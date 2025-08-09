"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle, AlertTriangle, Eye, Lock, XCircle, Shield } from "lucide-react";

type Report = {
    id: number;
    title: string;
    category: "security" | "fraud" | "governance" | "technical" | "other";
    status: "submitted" | "investigating" | "verified" | "rejected";
    severity: "low" | "medium" | "high" | "critical";
    timestamp: string;
    reporter: string;
    anonymous?: boolean;
    legalHold?: boolean;
    decryptionRequested?: boolean;
};

const demoReports: Report[] = [
    {
        id: 201,
        title: "Exchange account takeover attempt",
        category: "security",
        status: "investigating",
        severity: "high",
        timestamp: new Date().toISOString(),
        reporter: "0x2fa4b...9c1e",
        legalHold: true,
        decryptionRequested: true,
    },
    {
        id: 202,
        title: "Phishing campaign via SMS",
        category: "fraud",
        status: "submitted",
        severity: "medium",
        timestamp: new Date(Date.now() - 2 * 3600_000).toISOString(),
        reporter: "0x9ab3d...11e2",
        legalHold: false,
        decryptionRequested: false,
    },
];

const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "submitted", label: "Submitted" },
    { value: "investigating", label: "Investigating" },
    { value: "verified", label: "Verified" },
    { value: "rejected", label: "Rejected" },
] as const;

const categoryOptions = [
    { value: "all", label: "All Categories" },
    { value: "security", label: "Security" },
    { value: "fraud", label: "Fraud" },
    { value: "governance", label: "Governance" },
    { value: "technical", label: "Technical" },
    { value: "other", label: "Other" },
] as const;

const severityOptions = [
    { value: "all", label: "All Severity" },
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "critical", label: "Critical" },
] as const;

const severityBadge: Record<Report["severity"], string> = {
    low: "bg-green-50 text-green-700",
    medium: "bg-yellow-50 text-yellow-700",
    high: "bg-orange-50 text-orange-700",
    critical: "bg-red-50 text-red-700",
};

const statusIcon = {
    submitted: Clock,
    investigating: AlertTriangle,
    verified: CheckCircle,
    rejected: FileText,
} as const;

export default function Page() {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [severityFilter, setSeverityFilter] = useState<string>("all");

    const filtered = useMemo(() => {
        return demoReports.filter((r) => {
            const matchesSearch = !searchTerm ||
                r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.category?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "all" || r.status === statusFilter;
            const matchesCategory = categoryFilter === "all" || r.category === categoryFilter;
            const matchesSeverity = severityFilter === "all" || r.severity === severityFilter;
            return matchesSearch && matchesStatus && matchesCategory && matchesSeverity;
        });
    }, [searchTerm, statusFilter, categoryFilter, severityFilter]);

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Law Enforcement Review</h1>
                        <p className="text-gray-600 mt-1">Review reports, manage legal holds, and request decryption</p>
                    </div>
                    <div className="mt-4 md:mt-0 flex items-center gap-3">
                        <Button variant="outline" className="gap-2">
                            <Shield className="size-4" /> Bulk Legal Hold
                        </Button>
                        <Button className="gap-2">
                            <Lock className="size-4" /> Request Bulk Decryption
                        </Button>
                    </div>
                </div>

                <Card className="mb-6">
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2">
                                <div className="relative">
                                    <Input
                                        placeholder="Search reports..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categoryOptions.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={severityFilter} onValueChange={setSeverityFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Severity" />
                                </SelectTrigger>
                                <SelectContent>
                                    {severityOptions.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {filtered.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <FileText className="size-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
                            <p className="text-gray-600">Adjust filters or try another search</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {filtered.map((report) => {
                            const StatusIcon = statusIcon[report.status];
                            return (
                                <Card key={report.id} className="transition-shadow hover:shadow-md">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {report.title || `Report #${report.id}`}
                                                    </h3>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${severityBadge[report.severity]}`}>
                                                        {report.severity.charAt(0).toUpperCase() + report.severity.slice(1)}
                                                    </span>
                                                    {report.legalHold && (
                                                        <Badge variant="secondary" className="gap-1">
                                                            <Shield className="size-3" /> Legal Hold
                                                        </Badge>
                                                    )}
                                                    {report.decryptionRequested && (
                                                        <Badge variant="secondary" className="gap-1">
                                                            <Lock className="size-3" /> Decryption Requested
                                                        </Badge>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                                                    <div className="flex items-center">
                                                        <StatusIcon className="size-4 mr-1 text-gray-600" />
                                                        <span className="capitalize">{report.status}</span>
                                                    </div>
                                                    <span>#{report.id}</span>
                                                    <span className="capitalize">{report.category}</span>
                                                    <span>{formatDate(report.timestamp)}</span>
                                                    {!report.anonymous ? (
                                                        <span>Reporter: {report.reporter}</span>
                                                    ) : (
                                                        <span className="text-gray-400">Anonymous</span>
                                                    )}
                                                </div>

                                                <div className="flex gap-2">
                                                    <Link href={`/reports/${report.id}`}>
                                                        <Button variant="outline" className="gap-2">
                                                            <Eye className="size-4" /> View
                                                        </Button>
                                                    </Link>
                                                    <Button variant="outline" className="gap-2">
                                                        <Lock className="size-4" /> Request Decryption
                                                    </Button>
                                                    <Button className="gap-2">
                                                        <CheckCircle className="size-4" /> Approve Disclosure
                                                    </Button>
                                                    <Button variant="destructive" className="gap-2">
                                                        <XCircle className="size-4" /> Reject
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
} 