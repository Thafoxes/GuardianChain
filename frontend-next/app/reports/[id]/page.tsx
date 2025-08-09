import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Calendar, User, AlertTriangle, CheckCircle, FileText, Clock, Lock } from "lucide-react";

const statusColors: Record<string, string> = {
    submitted: "text-blue-700 bg-blue-50",
    investigating: "text-yellow-700 bg-yellow-50",
    verified: "text-green-700 bg-green-50",
    rejected: "text-red-700 bg-red-50",
};
const severityColors: Record<string, string> = {
    low: "text-green-700 bg-green-50",
    medium: "text-yellow-700 bg-yellow-50",
    high: "text-orange-700 bg-orange-50",
    critical: "text-red-700 bg-red-50",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const report = {
        id,
        title: `Report #${id}`,
        timestamp: new Date().toISOString(),
        reporter: "0x2fa4b...9c1e",
        anonymous: false,
        status: "submitted",
        severity: "medium",
        category: "security",
        content:
            "Encrypted content placeholder. Connect wallet and decrypt to view full report details.",
    } as const;

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <Link href="/reports" className="inline-flex items-center text-blue-600 hover:text-blue-700">
                        <ArrowLeft className="size-4 mr-2" /> Back to Reports
                    </Link>
                </div>

                <Card className="mb-6">
                    <CardContent className="py-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">{report.title}</h1>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                    <span className="inline-flex items-center">
                                        <Calendar className="size-4 mr-1" /> {formatDate(report.timestamp)}
                                    </span>
                                    <span className="inline-flex items-center">
                                        <User className="size-4 mr-1" />
                                        {report.anonymous ? "Anonymous" : report.reporter}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${severityColors[report.severity]}`}>
                                    <AlertTriangle className="size-4 mr-1" />
                                    {report.severity.charAt(0).toUpperCase() + report.severity.slice(1)}
                                </span>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[report.status]}`}>
                                    <Clock className="size-4 mr-1" />
                                    {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle>Report Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="prose max-w-none">
                                    <p className="text-gray-700">
                                        {report.content}
                                    </p>
                                </div>
                                <div>
                                    <Button variant="default" className="gap-2">
                                        <Lock className="size-4" /> Decrypt with MetaMask
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle>Metadata</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-gray-700 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500">Report ID</span>
                                    <span>#{report.id}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500">Category</span>
                                    <span className="capitalize">{report.category}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500">Reporter</span>
                                    <span>{report.anonymous ? "Anonymous" : report.reporter}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
} 