import React from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../../contexts/WalletContext';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, Menu, X, User, Settings, LogOut } from 'lucide-react';
import { useState } from 'react';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { wallet, disconnectWallet } = useWallet();
  const { auth, logout } = useAuth();

  const handleLogout = () => {
    logout();
    disconnectWallet();
    setIsProfileOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-secondary-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-primary-600" />
              <span className="text-xl font-bold text-secondary-900">GuardianChain</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {auth.isAuthenticated ? (
              <>
                <Link to="/dashboard" className="text-secondary-600 hover:text-secondary-900">
                  Dashboard
                </Link>
                <Link to="/reports" className="text-secondary-600 hover:text-secondary-900">
                  Reports
                </Link>
                <Link to="/submit-report" className="btn-primary">
                  Submit Report
                </Link>
                
                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 text-secondary-600 hover:text-secondary-900"
                  >
                    <User className="w-5 h-5" />
                    <span className="font-mono text-sm">
                      {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
                    </span>
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-secondary-200 py-1">
                      <Link
                        to="/profile"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        <span>Profile</span>
                      </Link>
                      {auth.user?.role === 'ADMIN' && (
                        <Link
                          to="/admin"
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <Shield className="w-4 h-4" />
                          <span>Admin</span>
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-secondary-600 hover:text-secondary-900">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-secondary-600 hover:text-secondary-900"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-secondary-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {auth.isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="block px-3 py-2 text-secondary-600 hover:text-secondary-900"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/reports"
                  className="block px-3 py-2 text-secondary-600 hover:text-secondary-900"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Reports
                </Link>
                <Link
                  to="/submit-report"
                  className="block px-3 py-2 text-primary-600 hover:text-primary-700 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Submit Report
                </Link>
                <Link
                  to="/profile"
                  className="block px-3 py-2 text-secondary-600 hover:text-secondary-900"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
                {auth.user?.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className="block px-3 py-2 text-secondary-600 hover:text-secondary-900"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-red-600 hover:text-red-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 text-secondary-600 hover:text-secondary-900"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 text-primary-600 hover:text-primary-700 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
