'use client';

import Link from 'next/link';
import { Shield, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className="bg-white shadow-sm border-b border-secondary-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center space-x-2">
                            <Shield className="w-8 h-8 text-primary-600" />
                            <span className="text-xl font-bold text-secondary-900">GuardianChain</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link href="/dashboard" className="text-secondary-600 hover:text-secondary-900">
                            Dashboard
                        </Link>
                        <Link href="/reports" className="text-secondary-600 hover:text-secondary-900">
                            Reports
                        </Link>
                        <Link href="/submit-report" className="btn-primary">
                            Submit Report
                        </Link>
                        <Link href="/login" className="text-secondary-600 hover:text-secondary-900">
                            Sign In
                        </Link>
                        <Link href="/register" className="btn-primary">
                            Get Started
                        </Link>
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
                        <Link href="/dashboard" className="block px-3 py-2 text-secondary-600 hover:text-secondary-900" onClick={() => setIsMenuOpen(false)}>
                            Dashboard
                        </Link>
                        <Link href="/reports" className="block px-3 py-2 text-secondary-600 hover:text-secondary-900" onClick={() => setIsMenuOpen(false)}>
                            Reports
                        </Link>
                        <Link href="/submit-report" className="block px-3 py-2 text-primary-600 hover:text-primary-700 font-medium" onClick={() => setIsMenuOpen(false)}>
                            Submit Report
                        </Link>
                        <Link href="/login" className="block px-3 py-2 text-secondary-600 hover:text-secondary-900" onClick={() => setIsMenuOpen(false)}>
                            Sign In
                        </Link>
                        <Link href="/register" className="block px-3 py-2 text-primary-600 hover:text-primary-700 font-medium" onClick={() => setIsMenuOpen(false)}>
                            Get Started
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
} 