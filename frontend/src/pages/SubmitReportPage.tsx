import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Send, Shield, Eye, EyeOff, FileText, Tag, User, Clock, UserCheck } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { stakingApi, reportApi } from '../services/api';
import { blockchainService } from '../services/blockchain';
import StakingModal from '../components/StakingModal';
import toast from 'react-hot-toast';

const SubmitReportPage = () => {
  const navigate = useNavigate();
  const { wallet } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState({
    isRegistered: false,
    isVerified: false,
    canSubmitReports: false
  });
  const [showStakingModal, setShowStakingModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: 'security',
    content: '',
    anonymous: false,
    severity: 'medium',
    evidence: ''
  });

  // Check user verification status when wallet is connected
  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!wallet.isConnected || !wallet.address) {
        setIsCheckingVerification(false);
        return;
      }

      try {
        setIsCheckingVerification(true);
        
        // Check verification status directly from blockchain
        console.log('🔍 Checking verification status on blockchain for:', wallet.address);
        
        // Initialize blockchain service if needed
        if (!blockchainService.isConnected()) {
          await blockchainService.initializeFromExistingProvider();
        }
        
        const isVerified = await blockchainService.checkUserVerification(wallet.address);
        console.log('🔍 User verification status:', isVerified);
        
        setVerificationStatus({
          isRegistered: true, // If wallet is connected, we consider them registered
          isVerified: isVerified,
          canSubmitReports: isVerified // Can submit reports if verified on blockchain
        });
        
      } catch (error) {
        console.error('Failed to check verification status:', error);
        // Fallback: assume not verified if we can't check
        setVerificationStatus({
          isRegistered: false,
          isVerified: false,
          canSubmitReports: false
        });
      } finally {
        setIsCheckingVerification(false);
      }
    };

    checkVerificationStatus();
  }, [wallet.isConnected, wallet.address]);

  // Auto-refresh verification status when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && wallet.isConnected && wallet.address) {
        // Re-check verification status when tab becomes visible
        setTimeout(() => {
          stakingApi.getStatus(wallet.address!)
            .then(response => {
              if (response.success && response.data) {
                setVerificationStatus({
                  isRegistered: response.data.isRegistered,
                  isVerified: response.data.isVerified,
                  canSubmitReports: response.data.isVerified
                });
              }
            })
            .catch(error => console.error('Failed to refresh verification status:', error));
        }, 1000); // Small delay to allow any pending transactions to complete
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [wallet.isConnected, wallet.address]);

  const handleVerificationComplete = async () => {
    console.log('🔄 handleVerificationComplete called for wallet:', wallet.address);
    
    // Refresh verification status after registration with retry logic
    if (wallet.address) {
      try {
        // Show loading state
        setIsCheckingVerification(true);
        console.log('📊 Checking verification status...');
        
        // Add delay to allow blockchain state to update
        toast('⏳ Waiting for blockchain confirmation...', {
          icon: '⏳',
          duration: 3000
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        let retryCount = 0;
        const maxRetries = 3;
        let response;
        
        // Retry verification status check
        while (retryCount < maxRetries) {
          try {
            console.log(`📊 Checking verification status (attempt ${retryCount + 1}/${maxRetries})...`);
            response = await stakingApi.getStatus(wallet.address);
            console.log('📋 Status response:', response);
            
            if (response.success && response.data) {
              break; // Success, exit retry loop
            }
            
            throw new Error('Invalid response from verification API');
          } catch (statusError) {
            console.warn(`⚠️ Verification status check failed (attempt ${retryCount + 1}):`, statusError);
            retryCount++;
            
            if (retryCount < maxRetries) {
              // Wait before retry, with increasing delay
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            }
          }
        }
        
        if (!response || !response.success) {
          throw new Error('Unable to verify registration status after multiple attempts');
        }
        
        if (response.success && response.data) {
          const { isRegistered, isVerified } = response.data;
          console.log(`🔍 User status - Registered: ${isRegistered}, Verified: ${isVerified}`);
          
          // If user is registered but not verified, trigger verification process
          if (isRegistered && !isVerified) {
            console.log('⚡ User needs verification - calling verify-and-reward endpoint');
            toast('🔄 User is registered but not verified. Attempting verification...', {
              icon: '⚡',
              duration: 4000
            });
            
            try {
              // Call the verification API endpoint using the proper API service
              const verifyResponse = await stakingApi.verifyAndReward(wallet.address);
              console.log('✅ Verify response:', verifyResponse);
              
              if (verifyResponse.success) {
                toast.success('✅ Verification successful! You can now submit reports.');
                setVerificationStatus({
                  isRegistered: true,
                  isVerified: true,
                  canSubmitReports: true
                });
              } else {
                console.error('❌ Verification failed:', verifyResponse);
                toast.error(`Verification failed: ${verifyResponse.error || 'Unknown error'}`);
              }
            } catch (verifyError) {
              console.error('💥 Verification error:', verifyError);
              toast.error('Failed to verify user. Please try again.');
            }
          } else {
            // Update status normally
            setVerificationStatus({
              isRegistered: response.data.isRegistered,
              isVerified: response.data.isVerified,
              canSubmitReports: response.data.isVerified
            });
            
            // Show feedback to user
            if (response.data.isVerified) {
              toast.success('✅ Verification complete! You can now submit reports.');
            } else if (!response.data.isRegistered) {
              toast.error('❌ User not registered. Please complete registration first.');
            } else {
              toast('🔄 Still processing... Please wait a few more seconds and try again.', {
                icon: '⏳',
                duration: 4000
              });
            }
          }
        } else {
          console.error('❌ Failed status response:', response);
          toast.error('Failed to check verification status. Please try again.');
        }
      } catch (error) {
        console.error('💥 Failed to refresh verification status:', error);
        toast.error('Network error. Please check your connection and try again.');
      } finally {
        setIsCheckingVerification(false);
        console.log('✅ handleVerificationComplete finished');
      }
    }
  };

  const categories = [
    { value: 'security', label: 'Security Vulnerability', icon: Shield },
    { value: 'fraud', label: 'Fraud/Scam', icon: AlertTriangle },
    { value: 'governance', label: 'Governance Issue', icon: FileText },
    { value: 'technical', label: 'Technical Issue', icon: Tag },
    { value: 'other', label: 'Other', icon: FileText }
  ];

  const severityLevels = [
    { value: 'low', label: 'Low', color: 'text-green-600', bg: 'bg-green-50' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { value: 'high', label: 'High', color: 'text-orange-600', bg: 'bg-orange-50' },
    { value: 'critical', label: 'Critical', color: 'text-red-600', bg: 'bg-red-50' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!wallet.isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!wallet.address) {
      toast.error('Wallet address not available');
      return;
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('📝 Submitting report directly to blockchain...');
      
      // Initialize blockchain service if not already done
      if (!blockchainService.isConnected()) {
        await blockchainService.connectWallet();
      }

      // Check user verification status on blockchain
      const isVerified = await blockchainService.checkUserVerification(wallet.address);
      if (!isVerified) {
        toast.error('You must be verified before submitting reports. Please complete the staking process first.');
        setShowStakingModal(true);
        return;
      }

      // Prepare report data object for blockchain submission
      const reportData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        evidence: formData.evidence.trim() || '',
        category: formData.category,
        severity: formData.severity,
        anonymous: formData.anonymous,
        submittedBy: wallet.address
      };

      console.log('📝 Form data before submission:', formData);
      console.log('📝 Report data prepared:', reportData);
      console.log('📝 Submitting content to blockchain:', { 
        contentLength: JSON.stringify(reportData).length,
        anonymous: formData.anonymous 
      });

      // Submit directly to blockchain via MetaMask
      const txHash = await blockchainService.submitReport(reportData);
      
      console.log('✅ Report submitted to blockchain:', txHash);
      
      // Record the transaction in the API database
      console.log('📝 Recording transaction in API...');
      try {
        const apiResponse = await reportApi.submitReportWithTx({
          title: formData.title,
          content: formData.content,
          category: formData.category,
          severity: formData.severity,
          evidence: formData.evidence,
          anonymous: formData.anonymous,
          walletAddress: wallet.address!,
          transactionHash: txHash
        });
        
        console.log('✅ Transaction recorded in API:', apiResponse);
        toast.success(`Report submitted successfully! Transaction: ${txHash.slice(0, 10)}...`);
      } catch (apiError: any) {
        console.warn('⚠️ Report submitted to blockchain but failed to record in API:', apiError);
        toast.success(`Report submitted to blockchain! Transaction: ${txHash.slice(0, 10)}... (Note: May take time to appear in reports list)`);
      }
      
      // Navigate to reports page
      navigate('/reports');

    } catch (error: any) {
      console.error('❌ Failed to submit report:', error);
      
      // Provide user-friendly error messages
      if (error.message.includes('User denied')) {
        toast.error('Transaction was cancelled by user');
      } else if (error.message.includes('verification')) {
        toast.error('Account verification required. Please complete the staking process.');
        setShowStakingModal(true);
      } else if (error.message.includes('gas')) {
        toast.error('Insufficient gas fee. Please try again with more gas.');
      } else if (error.message.includes('network')) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error(error.message || 'Failed to submit report to blockchain');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = categories.find(cat => cat.value === formData.category);
  const selectedSeverity = severityLevels.find(sev => sev.value === formData.severity);

  // Show loading screen while checking verification
  if (isCheckingVerification) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Checking Account Status</h2>
                <p className="text-gray-600">Verifying your account permissions...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show verification required message if not verified
  if (wallet.isConnected && !verificationStatus.canSubmitReports) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Submit Report</h1>
                <p className="text-gray-600 mt-1">
                  Report security issues, fraud, or other concerns confidentially and securely
                </p>
              </div>
            </div>
          </div>

          {/* Verification Required */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Account Verification Required</h2>
              
              {!verificationStatus.isRegistered ? (
                <div>
                  <p className="text-gray-600 mb-6">
                    You need to stake 10 GCR tokens to get verified and submit reports to the blockchain.
                  </p>
                  <button
                    onClick={() => setShowStakingModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Stake & Get Verified
                  </button>
                </div>
              ) : verificationStatus.isVerified ? (
                <div>
                  <p className="text-green-600 mb-4">
                    ✅ Your account is verified! You can now submit reports.
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Continue to Submit Report
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 mb-4">
                    Your account is registered and staked. Verification is being processed automatically.
                  </p>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-amber-600" />
                      <span className="text-amber-800 font-medium">Processing Verification</span>
                    </div>
                    <p className="text-amber-700 text-sm mt-1">
                      Your stake has been processed. Verification should complete within a few seconds.
                    </p>
                  </div>
                  <button
                    onClick={handleVerificationComplete}
                    disabled={isCheckingVerification}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      isCheckingVerification
                        ? 'bg-gray-400 cursor-not-allowed text-white'
                        : 'bg-gray-600 hover:bg-gray-700 text-white'
                    }`}
                  >
                    {isCheckingVerification ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Checking...</span>
                      </div>
                    ) : (
                      'Check Status Again'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Staking Modal */}
          <StakingModal
            isOpen={showStakingModal}
            onClose={() => setShowStakingModal(false)}
            onSuccess={handleVerificationComplete}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Submit Report</h1>
              <p className="text-gray-600 mt-1">
                Report security issues, fraud, or other concerns confidentially and securely
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Report Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Brief, descriptive title for your report"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Category & Severity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="severity" className="block text-sm font-medium text-gray-700 mb-2">
                    Severity Level *
                  </label>
                  <select
                    id="severity"
                    name="severity"
                    value={formData.severity}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {severityLevels.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Content */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  Report Details *
                </label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Provide detailed information about the issue. Include what happened, when it occurred, who was involved, and any other relevant details."
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Your report will be encrypted before being stored on the blockchain
                </p>
              </div>

              {/* Evidence */}
              <div>
                <label htmlFor="evidence" className="block text-sm font-medium text-gray-700 mb-2">
                  Evidence/Supporting Information
                </label>
                <textarea
                  id="evidence"
                  name="evidence"
                  value={formData.evidence}
                  onChange={handleInputChange}
                  placeholder="Include any additional evidence, URLs, transaction hashes, screenshots descriptions, or other supporting information"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  required
                />
              </div>

              {/* Anonymous Option */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="anonymous"
                  name="anonymous"
                  checked={formData.anonymous}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="anonymous" className="ml-3 text-sm text-gray-700">
                  Submit anonymously (your wallet address will still be recorded for rewards)
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || !wallet.isConnected}
                  className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Report
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center"
                >
                  {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                  {showPreview ? 'Hide' : 'Preview'}
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Selection */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900 mb-3">Report Summary</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center">
                  {selectedCategory && <selectedCategory.icon className="w-4 h-4 text-gray-500 mr-2" />}
                  <span className="text-gray-600">Category:</span>
                  <span className="ml-2 font-medium">{selectedCategory?.label}</span>
                </div>
                
                <div className="flex items-center">
                  <AlertTriangle className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-gray-600">Severity:</span>
                  <span className={`ml-2 font-medium ${selectedSeverity?.color}`}>
                    {selectedSeverity?.label}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <User className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-gray-600">Anonymous:</span>
                  <span className="ml-2 font-medium">
                    {formData.anonymous ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Privacy Protected</h4>
                  <p className="text-sm text-blue-700">
                    Your report content is encrypted before being stored on the blockchain. 
                    Only authorized investigators can decrypt and view your submission.
                  </p>
                </div>
              </div>
            </div>

            {/* Rewards Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <FileText className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-green-900 mb-1">Earn Rewards</h4>
                  <p className="text-sm text-green-700">
                    Verified reports earn GCT tokens. Critical security issues may receive 
                    additional rewards based on impact and severity.
                  </p>
                </div>
              </div>
            </div>

            {/* Preview */}
            {showPreview && formData.content && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="font-medium text-gray-900 mb-3">Preview</h3>
                
                <div className="space-y-3">
                  {formData.title && (
                    <div>
                      <h4 className="font-medium text-gray-800">{formData.title}</h4>
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-600 border-l-2 border-gray-200 pl-3">
                    {formData.content.split('\n').map((line, index) => (
                      <p key={index} className="mb-1">{line || '\u00A0'}</p>
                    ))}
                  </div>
                  
                  {formData.evidence && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Evidence:</p>
                      <p className="text-sm text-gray-600">{formData.evidence}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Staking Modal */}
        <StakingModal
          isOpen={showStakingModal}
          onClose={() => setShowStakingModal(false)}
          onSuccess={handleVerificationComplete}
        />
      </div>
    </div>
  );
};

export default SubmitReportPage;
