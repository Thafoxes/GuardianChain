"use client";

import { useEffect, useState } from "react";
import { Shield, AlertCircle, Wallet, Coins } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

export default function Page() {
    const [isLoading, setIsLoading] = useState(false);
    const [walletConnected, setWalletConnected] = useState(false);
    const [isCorrectNetwork, setIsCorrectNetwork] = useState(true);
    const [showStakingModal, setShowStakingModal] = useState(false);

    useEffect(() => {
        if (walletConnected && isCorrectNetwork) {
            setShowStakingModal(true);
        }
    }, [walletConnected, isCorrectNetwork]);

    const handleWalletConnect = () => {
        setIsLoading(true);
        setTimeout(() => {
            setWalletConnected(true);
            setIsLoading(false);
        }, 600);
    };

    const handleNetworkSwitch = () => {
        setIsCorrectNetwork(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <Shield className="mx-auto h-12 w-12 text-primary-600" />
                    <h2 className="mt-6 text-3xl font-bold text-secondary-900">Join GuardianChain</h2>
                    <p className="mt-2 text-sm text-secondary-600">
                        Stake 10 GCR tokens to get instantly verified and start reporting
                    </p>
                </div>

                <Card>
                    <CardContent className="p-8 space-y-6">
                        {!walletConnected ? (
                            <div className="space-y-4">
                                <Alert>
                                    <AlertCircle className="size-4" />
                                    <AlertTitle>Connect Your Wallet</AlertTitle>
                                    <AlertDescription>
                                        First, connect your MetaMask wallet to get started with GuardianChain.
                                    </AlertDescription>
                                </Alert>

                                <Button
                                    onClick={handleWalletConnect}
                                    disabled={isLoading}
                                    className="w-full"
                                >
                                    {isLoading ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    ) : (
                                        <Wallet className="h-5 w-5 mr-2" />
                                    )}
                                    Connect MetaMask
                                </Button>
                            </div>
                        ) : !isCorrectNetwork ? (
                            <div className="space-y-4">
                                <Alert>
                                    <AlertCircle className="size-4" />
                                    <AlertTitle>Wrong Network</AlertTitle>
                                    <AlertDescription>
                                        Please switch to Oasis Sapphire Localnet to continue.
                                    </AlertDescription>
                                </Alert>

                                <Button onClick={handleNetworkSwitch} className="w-full" variant="secondary">
                                    Switch to Sapphire Localnet
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <Alert>
                                    <Coins className="size-4" />
                                    <AlertTitle>Ready to Stake & Verify</AlertTitle>
                                    <AlertDescription>
                                        Your wallet is connected. Click below to stake tokens and get verified.
                                    </AlertDescription>
                                </Alert>

                                <Button onClick={() => setShowStakingModal(true)} className="w-full">
                                    <Coins className="h-5 w-5 mr-2" />
                                    Stake & Get Verified
                                </Button>
                            </div>
                        )}

                        <div className="text-center">
                            <p className="text-sm text-secondary-600">
                                Already have an account?{" "}
                                <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
                                    Sign in instead
                                </Link>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Staking Modal placeholder */}
                {showStakingModal && (
                    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                            <h3 className="text-lg font-semibold text-secondary-900 mb-2">Stake 10 GCR</h3>
                            <p className="text-secondary-600 mb-6">Simulated staking modal. Integrate real staking later.</p>
                            <Button className="w-full" onClick={() => setShowStakingModal(false)}>
                                Done
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 