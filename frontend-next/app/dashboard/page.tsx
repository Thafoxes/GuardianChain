"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    FileText,
    CheckCircle,
    AlertTriangle,
    XCircle,
    Plus,
    ArrowRight,
    Clock,
    User,
} from "lucide-react";

type Report = {
    id: number;
    title: string;
    category: "security" | "fraud" | "governance" | "technical" | "other";
    status: "submitted" | "investigating" | "verified" | "rejected";
    severity: "low" | "medium" | "high" | "critical";
    timestamp: string;
    reporter: string;
    anonymous?: boolean;
};

const demoReports: Report[] = [
    {
        id: 101,
        title: "Suspicious wallet interactions",
        category: "security",
        status: "submitted",
        severity: "medium",
        timestamp: new Date().toISOString(),
        reporter: "0x2fa4b...9c1e",
    },
    {
        id: 102,
        title: "Phishing site targeting users",
        category: "fraud",
        status: "investigating",
        severity: "high",
        timestamp: new Date(Date.now() - 3600_000).toISOString(),
        reporter: "0x8bd2e...12af",
    },
    {
        id: 103,
        title: "Multi-sig governance delay",
        category: "governance",
        status: "verified",
        severity: "low",
        timestamp: new Date(Date.now() - 86400_000).toISOString(),
        reporter: "0x91a0c...77b3",
    },
];

const severityBadge: Record<Report["severity"], string> = {
    low: "bg-green-50 text-green-700",
    medium: "bg-yellow-50 text-yellow-700",
    high: "bg-orange-50 text-orange-700",
    critical: "bg-red-50 text-red-700",
};

export default function Page() {
    const stats = useMemo(() => {
        const totals = demoReports.reduce(
            (acc, r) => {
                acc.total += 1;
                if (r.status === "verified") acc.verified += 1;
                if (r.status === "investigating") acc.investigating += 1;
                if (r.status === "rejected") acc.rejected += 1;
                return acc;
            },
            { total: 0, verified: 0, investigating: 0, rejected: 0 }
        );
        return totals;
    }, []);

    const recent = useMemo(() => demoReports.slice(0, 5), []);

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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                        <p className="text-gray-600 mt-1">Overview of your reports and activity</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/submit-report">
                            <Button className="gap-2">
                                <Plus className="size-4" /> Submit Report
                            </Button>
                        </Link>
                        <Link href="/reports">
                            <Button variant="outline" className="gap-2">
                                View Reports <ArrowRight className="size-4" />
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Total Reports</p>
                                    <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                                </div>
                                <FileText className="size-6 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Verified</p>
                                    <p className="text-2xl font-semibold text-gray-900">{stats.verified}</p>
                                </div>
                                <CheckCircle className="size-6 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Investigating</p>
                                    <p className="text-2xl font-semibold text-gray-900">{stats.investigating}</p>
                                </div>
                                <AlertTriangle className="size-6 text-yellow-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Rejected</p>
                                    <p className="text-2xl font-semibold text-gray-900">{stats.rejected}</p>
                                </div>
                                <XCircle className="size-6 text-red-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle>Recent Reports</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {recent.length === 0 ? (
                                    <div className="p-8 text-center text-gray-600">
                                        No recent reports. Create your first one.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {recent.map((r) => (
                                            <div key={r.id} className="p-6 flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="text-base font-semibold text-gray-900 truncate">
                                                            {r.title || `Report #${r.id}`}
                                                        </h3>
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${severityBadge[r.severity]}`}>
                                                            {r.severity.charAt(0).toUpperCase() + r.severity.slice(1)}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                                        <span className="inline-flex items-center">
                                                            <Clock className="size-4 mr-1" /> {formatDate(r.timestamp)}
                                                        </span>
                                                        <span className="capitalize">{r.category}</span>
                                                        {r.anonymous ? (
                                                            <span className="text-gray-400">Anonymous</span>
                                                        ) : (
                                                            <span className="inline-flex items-center">
                                                                <User className="size-4 mr-1" /> {r.reporter}
                                                            </span>
                                                        )}
                                                        <Badge variant="secondary" className="capitalize">
                                                            {r.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="ml-4 flex-shrink-0">
                                                    <Link href={`/reports/${r.id}`}>
                                                        <Button variant="outline" className="gap-2">
                                                            View <ArrowRight className="size-4" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Link href="/submit-report">
                                    <Button className="w-full justify-between">
                                        Submit new report <Plus className="size-4" />
                                    </Button>
                                </Link>
                                <Link href="/reports">
                                    <Button variant="outline" className="w-full justify-between">
                                        Browse all reports <ArrowRight className="size-4" />
                                    </Button>
                                </Link>
                                <Link href="/profile">
                                    <Button variant="ghost" className="w-full justify-between">
                                        Go to profile <ArrowRight className="size-4" />
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle>Verification</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm text-gray-700">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500">Status</span>
                                    <Badge className="bg-green-50 text-green-700">Verified</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500">Reports allowed</span>
                                    <span>Yes</span>
                                </div>
                                <div className="pt-2">
                                    <Link href="/submit-report">
                                        <Button variant="outline" className="w-full">Submit a report</Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
} 