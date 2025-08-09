"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, FileText, Clock, CheckCircle, AlertTriangle, Eye, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Report = {
    id: number;
    title: string;
    category: string;
    status: "submitted" | "investigating" | "verified" | "rejected";
    severity: "low" | "medium" | "high" | "critical";
    timestamp: string;
    reporter: string;
    anonymous?: boolean;
    content?: string;
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
];

const statusOptions = [
    { value: "all", label: "All Status", color: "text-gray-600" },
    { value: "submitted", label: "Submitted", color: "text-blue-600" },
    { value: "investigating", label: "Investigating", color: "text-yellow-600" },
    { value: "verified", label: "Verified", color: "text-green-600" },
    { value: "rejected", label: "Rejected", color: "text-red-600" },
];

const categoryOptions = [
    { value: "all", label: "All Categories" },
    { value: "security", label: "Security" },
    { value: "fraud", label: "Fraud" },
    { value: "governance", label: "Governance" },
    { value: "technical", label: "Technical" },
    { value: "other", label: "Other" },
];

const severityBadge = {
    low: "bg-green-50 text-green-700",
    medium: "bg-yellow-50 text-yellow-700",
    high: "bg-orange-50 text-orange-700",
    critical: "bg-red-50 text-red-700",
} as const;

const statusIcon = {
    submitted: Clock,
    investigating: AlertTriangle,
    verified: CheckCircle,
    rejected: FileText,
} as const;

export default function Page() {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");

    const filtered = useMemo(() => {
        return demoReports.filter((r) => {
            const matchesSearch = !searchTerm ||
                r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.category?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "all" || r.status === statusFilter;
            const matchesCategory = categoryFilter === "all" || r.category === categoryFilter;
            return matchesSearch && matchesStatus && matchesCategory;
        });
    }, [searchTerm, statusFilter, categoryFilter]);

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
                        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
                        <p className="text-gray-600 mt-1">Browse and track all submitted reports in the system</p>
                    </div>
                    <div className="mt-4 md:mt-0">
                        <Link href="/submit-report">
                            <Button className="gap-2">
                                <Plus className="size-4" /> Submit Report
                            </Button>
                        </Link>
                    </div>
                </div>

                <Card className="mb-6">
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
                                    <Input
                                        placeholder="Search reports..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categoryOptions.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>
                                            {o.label}
                                        </SelectItem>
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
                            <p className="text-gray-600 mb-4">
                                {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                                    ? "Try adjusting your search or filters"
                                    : "No reports have been submitted yet"}
                            </p>
                            <Link href="/submit-report">
                                <Button className="gap-2">
                                    <Plus className="size-4" /> Submit First Report
                                </Button>
                            </Link>
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

                                                {report.content && (
                                                    <p className="text-gray-700 text-sm line-clamp-2 mb-3">{report.content}</p>
                                                )}
                                            </div>

                                            <div className="ml-4 flex-shrink-0">
                                                <Link href={`/reports/${report.id}`}>
                                                    <Button variant="outline" className="gap-2">
                                                        <Eye className="size-4" /> View
                                                    </Button>
                                                </Link>
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