import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Send, Shield, Eye, EyeOff, FileText, Tag, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { reportApi } from '../services/api';
import toast from 'react-hot-toast';

const SubmitReportPage = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { wallet } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: 'security',
    content: '',
    anonymous: false,
    severity: 'medium',
    evidence: ''
  });

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

    if (!auth.isAuthenticated) {
      toast.error('Please login first');
      return;
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit report to API
      const reportData = {
        title: formData.title.trim(),
        category: formData.category,
        content: formData.content.trim(),
        evidence: formData.evidence.trim(),
        severity: formData.severity,
        anonymous: formData.anonymous,
        walletAddress: wallet.address
      };

      await reportApi.submitReport(reportData);

      toast.success('Report submitted successfully!');
      navigate('/reports');

    } catch (error: any) {
      console.error('Failed to submit report:', error);
      toast.error(error.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = categories.find(cat => cat.value === formData.category);
  const selectedSeverity = severityLevels.find(sev => sev.value === formData.severity);

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
      </div>
    </div>
  );
};

export default SubmitReportPage;
