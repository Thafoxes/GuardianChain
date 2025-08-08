import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, FileText, Award } from 'lucide-react';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gradient mb-6">
              GuardianChain
            </h1>
            <p className="text-xl md:text-2xl text-secondary-600 mb-8 max-w-3xl mx-auto">
              Secure, anonymous reporting platform built on Oasis Sapphire blockchain.
              Empower truth-telling with privacy-first technology.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="btn-primary text-lg px-8 py-3 inline-flex items-center justify-center"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="btn-secondary text-lg px-8 py-3 inline-flex items-center justify-center"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              Why Choose GuardianChain?
            </h2>
            <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
              Built on cutting-edge blockchain technology to ensure your reports are secure,
              verifiable, and protected.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="card text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                Privacy First
              </h3>
              <p className="text-secondary-600">
                End-to-end encryption ensures your identity and reports remain confidential.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                Verifiable Reports
              </h3>
              <p className="text-secondary-600">
                Blockchain technology ensures all reports are tamper-proof and verifiable.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                Community Driven
              </h3>
              <p className="text-secondary-600">
                Verified community members help validate and process reports.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                Earn Rewards
              </h3>
              <p className="text-secondary-600">
                Get rewarded for submitting verified reports and helping the community.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-24 bg-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
              Simple steps to secure reporting on the blockchain
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                Connect Wallet
              </h3>
              <p className="text-secondary-600">
                Connect your MetaMask wallet to the Oasis Sapphire network.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                Submit Report
              </h3>
              <p className="text-secondary-600">
                Submit your encrypted report securely to the blockchain.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                Get Verified
              </h3>
              <p className="text-secondary-600">
                Community verifiers review and validate your report.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-primary-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join the GuardianChain community and help build a more transparent world.
          </p>
          <Link
            to="/register"
            className="bg-white text-primary-600 hover:bg-primary-50 font-medium py-3 px-8 rounded-lg transition-colors duration-200 inline-flex items-center justify-center text-lg"
          >
            Start Reporting Today
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
