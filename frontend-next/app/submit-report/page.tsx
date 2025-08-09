"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Send, Shield, Eye, EyeOff, FileText, Tag, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

export default function Page() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [isCheckingVerification, setIsCheckingVerification] = useState(false);
    const [verificationStatus] = useState({ isRegistered: true, isVerified: true, canSubmitReports: true });

    const [formData, setFormData] = useState({
        title: "",
        category: "security",
        content: "",
        anonymous: false,
        severity: "medium",
        evidence: "",
    });

    useEffect(() => {
        setIsCheckingVerification(false);
    }, []);

    const categories = useMemo(
        () => [
            { value: "security", label: "Security Vulnerability", icon: Shield },
            { value: "fraud", label: "Fraud/Scam", icon: AlertTriangle },
            { value: "governance", label: "Governance Issue", icon: FileText },
            { value: "technical", label: "Technical Issue", icon: Tag },
            { value: "other", label: "Other", icon: FileText },
        ],
        []
    );

    const severityLevels = [
        { value: "low", label: "Low", color: "text-green-600", bg: "bg-green-50" },
        { value: "medium", label: "Medium", color: "text-yellow-600", bg: "bg-yellow-50" },
        { value: "high", label: "High", color: "text-orange-600", bg: "bg-orange-50" },
        { value: "critical", label: "Critical", color: "text-red-600", bg: "bg-red-50" },
    ];

    const handleChange = (name: string, value: string | boolean) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.content.trim()) return;
        setIsSubmitting(true);
        setTimeout(() => setIsSubmitting(false), 800);
    };

    const selectedCategory = useMemo(
        () => categories.find((cat) => cat.value === formData.category),
        [categories, formData.category]
    );

    if (isCheckingVerification) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Card>
                        <CardContent className="py-12">
                            <div className="flex flex-col items-center justify-center space-y-4">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                <div className="text-center">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Checking Account Status</h2>
                                    <p className="text-gray-600">Verifying your account permissions...</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (!verificationStatus.canSubmitReports) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Card className="mb-8">
                        <CardHeader className="space-y-1">
                            <CardTitle>Submit Report</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600">
                                Report security issues, fraud, or other concerns confidentially and securely
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="py-8 text-center">
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-amber-600">!</span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Verification Required</h3>
                            <p className="text-gray-600 mb-6">
                                You need to be a verified user to submit reports. Please complete staking to get verified.
                            </p>
                            <Button>Stake & Verify</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <Card className="mb-8">
                    <CardContent className="py-6">
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
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardContent className="p-6 space-y-6">
                                <div>
                                    <Label className="mb-1 block">Title</Label>
                                    <Input
                                        value={formData.title}
                                        onChange={(e) => handleChange("title", e.target.value)}
                                        placeholder="Brief summary of the issue"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="mb-1 block">Category</Label>
                                        <Select
                                            value={formData.category}
                                            onValueChange={(v) => handleChange("category", v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map((cat) => (
                                                    <SelectItem key={cat.value} value={cat.value}>
                                                        {cat.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="mb-1 block">Severity</Label>
                                        <Select
                                            value={formData.severity}
                                            onValueChange={(v) => handleChange("severity", v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select severity" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {severityLevels.map((sev) => (
                                                    <SelectItem key={sev.value} value={sev.value}>
                                                        {sev.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div>
                                    <Label className="mb-1 block">Details</Label>
                                    <Textarea
                                        value={formData.content}
                                        onChange={(e) => handleChange("content", e.target.value)}
                                        rows={6}
                                        placeholder="Provide detailed information about the incident..."
                                    />
                                </div>

                                <div>
                                    <Label className="mb-1 block">Evidence (optional)</Label>
                                    <Input
                                        value={formData.evidence}
                                        onChange={(e) => handleChange("evidence", e.target.value)}
                                        placeholder="Links to screenshots, documents, etc."
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <label className="inline-flex items-center space-x-2">
                                        <Checkbox
                                            checked={formData.anonymous}
                                            onCheckedChange={(v) => handleChange("anonymous", Boolean(v))}
                                        />
                                        <span className="text-sm text-gray-700">Submit anonymously</span>
                                    </label>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setShowPreview((p) => !p)}
                                        className="gap-1"
                                    >
                                        {showPreview ? (
                                            <>
                                                <EyeOff className="w-4 h-4" /> Hide preview
                                            </>
                                        ) : (
                                            <>
                                                <Eye className="w-4 h-4" /> Show preview
                                            </>
                                        )}
                                    </Button>
                                </div>

                                <div className="flex justify-end">
                                    <Button type="submit" onClick={handleSubmit} className="gap-2">
                                        <Send className="w-4 h-4" />
                                        {isSubmitting ? "Submitting..." : "Submit Report"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-1">
                        <Card className="sticky top-6">
                            <CardHeader>
                                <CardTitle>Preview</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {!showPreview ? (
                                    <p className="text-gray-500 text-sm">Toggle preview to see how your report will appear.</p>
                                ) : (
                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-sm text-gray-500 mb-1">Title</div>
                                            <div className="text-gray-900 font-medium">{formData.title || "Untitled report"}</div>
                                        </div>

                                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                                            <Clock className="w-4 h-4" />
                                            <span>{new Date().toLocaleString()}</span>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            {selectedCategory && <selectedCategory.icon className="w-4 h-4 text-blue-600" />}
                                            <span className="text-sm capitalize text-gray-700">{formData.category}</span>
                                        </div>

                                        <div>
                                            <div className="text-sm text-gray-500 mb-1">Severity</div>
                                            <Badge variant="secondary" className="capitalize">
                                                {formData.severity}
                                            </Badge>
                                        </div>

                                        <div>
                                            <div className="text-sm text-gray-500 mb-1">Details</div>
                                            <p className="text-sm text-gray-800 whitespace-pre-wrap">
                                                {formData.content || "No details provided."}
                                            </p>
                                        </div>

                                        {formData.evidence && (
                                            <div>
                                                <div className="text-sm text-gray-500 mb-1">Evidence</div>
                                                <p className="text-sm text-gray-800 break-all">{formData.evidence}</p>
                                            </div>
                                        )}

                                        <div className="text-sm text-gray-600">
                                            {formData.anonymous ? "Will be submitted anonymously" : "Reporter will be shown"}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
} 