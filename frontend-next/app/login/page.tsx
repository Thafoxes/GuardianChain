"use client";

import Link from "next/link";
import { Wallet, Shield, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function Page() {
    const [isLoading, setIsLoading] = useState(false);
    const [walletConnected, setWalletConnected] = useState(false);
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [isCorrectNetwork, setIsCorrectNetwork] = useState(true);

    const handleWalletConnect = async () => {
        setIsLoading(true);
        setTimeout(() => {
            setWalletConnected(true);
            setWalletAddress("0x1234...ABCD");
            setIsLoading(false);
        }, 700);
    };

    const handleLogin = async () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
        }, 700);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <Shield className="mx-auto h-12 w-12 text-primary-600" />
                    <h2 className="mt-6 text-3xl font-bold text-secondary-900">
                        Sign in to GuardianChain
                    </h2>
                    <p className="mt-2 text-sm text-secondary-600">
                        Connect your wallet to access your account
                    </p>
                </div>

                <div className="card">
                    {!walletConnected ? (
                        <div className="space-y-4">
                            <div className="text-center">
                                <Wallet className="mx-auto h-8 w-8 text-secondary-400 mb-2" />
                                <p className="text-sm text-secondary-600 mb-4">
                                    Connect your MetaMask wallet to continue
                                </p>
                            </div>

                            <button
                                onClick={handleWalletConnect}
                                disabled={isLoading}
                                className="w-full btn-primary flex items-center justify-center space-x-2"
                            >
                                {isLoading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                    <>
                                        <Wallet className="w-4 h-4" />
                                        <span>Connect MetaMask</span>
                                    </>
                                )}
                            </button>

                            <div className="text-center">
                                <p className="text-xs text-secondary-500">
                                    Don&apos;t have MetaMask?{" "}
                                    <a
                                        href="https://metamask.io/download/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary-600 hover:text-primary-700"
                                    >
                                        Download here
                                    </a>
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="text-center">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <Wallet className="w-6 h-6 text-green-600" />
                                </div>
                                <p className="text-sm font-medium text-secondary-900">Wallet Connected</p>
                                <p className="text-xs text-secondary-600 mt-1 font-mono">
                                    {walletAddress}
                                </p>
                            </div>

                            {!isCorrectNetwork && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start space-x-2">
                                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm">
                                        <p className="text-amber-800 font-medium">Wrong Network</p>
                                        <p className="text-amber-700">Please switch to Sapphire network</p>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleLogin}
                                disabled={isLoading || !isCorrectNetwork}
                                className="w-full btn-primary"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center space-x-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>Signing in...</span>
                                    </div>
                                ) : (
                                    "Sign In"
                                )}
                            </button>
                        </div>
                    )}
                </div>

                <div className="text-center text-xs text-secondary-500">
                    <p>
                        By connecting your wallet, you agree to our{" "}
                        <a href="#" className="text-primary-600 hover:text-primary-700">
                            Terms of Service
                        </a>{" "}
                        and{" "}
                        <a href="#" className="text-primary-600 hover:text-primary-700">
                            Privacy Policy
                        </a>
                    </p>
                    <p className="mt-2">
                        New here?{" "}
                        <Link href="/register" className="text-primary-600 hover:text-primary-700">
                            Create an account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
} 