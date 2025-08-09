"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Shield, Wrench, AlertTriangle, CheckCircle, XCircle, Search } from "lucide-react";

type User = {
    id: number;
    address: string;
    role: "user" | "admin" | "reviewer";
    status: "active" | "suspended";
};

type FlaggedReport = {
    id: number;
    title: string;
    severity: "low" | "medium" | "high" | "critical";
};

const demoUsers: User[] = [
    { id: 1, address: "0x2fa4b...9c1e", role: "user", status: "active" },
    { id: 2, address: "0x8bd2e...12af", role: "reviewer", status: "active" },
    { id: 3, address: "0x91a0c...77b3", role: "admin", status: "active" },
];

const demoFlagged: FlaggedReport[] = [
    { id: 301, title: "Duplicate report submission", severity: "low" },
    { id: 302, title: "Inappropriate content", severity: "medium" },
];

const severityBadge = {
    low: "bg-green-50 text-green-700",
    medium: "bg-yellow-50 text-yellow-700",
    high: "bg-orange-50 text-orange-700",
    critical: "bg-red-50 text-red-700",
} as const;

export default function Page() {
    const [users, setUsers] = useState<User[]>(demoUsers);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [retentionDays, setRetentionDays] = useState("90");

    const stats = useMemo(() => {
        return {
            totalUsers: users.length,
            admins: users.filter((u) => u.role === "admin").length,
            reviewers: users.filter((u) => u.role === "reviewer").length,
            flagged: demoFlagged.length,
        };
    }, [users]);

    const filteredUsers = useMemo(() => {
        return users.filter((u) => {
            const matchesSearch = !search || u.address.toLowerCase().includes(search.toLowerCase());
            const matchesRole = roleFilter === "all" || u.role === roleFilter;
            return matchesSearch && matchesRole;
        });
    }, [users, search, roleFilter]);

    const toggleSuspend = (id: number) => {
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: u.status === "active" ? "suspended" : "active" } : u)));
    };

    const changeRole = (id: number, role: User["role"]) => {
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">System Admin</h1>
                        <p className="text-gray-600 mt-1">Manage users, settings, and moderation</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Total Users</p>
                                    <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
                                </div>
                                <Users className="size-6 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Admins</p>
                                    <p className="text-2xl font-semibold text-gray-900">{stats.admins}</p>
                                </div>
                                <Shield className="size-6 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Reviewers</p>
                                    <p className="text-2xl font-semibold text-gray-900">{stats.reviewers}</p>
                                </div>
                                <Wrench className="size-6 text-yellow-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Flagged Reports</p>
                                    <p className="text-2xl font-semibold text-gray-900">{stats.flagged}</p>
                                </div>
                                <AlertTriangle className="size-6 text-red-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader className="pb-2"><CardTitle>User Management</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="md:col-span-2 relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
                                        <Input className="pl-10" placeholder="Search by address" value={search} onChange={(e) => setSearch(e.target.value)} />
                                    </div>
                                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                                        <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Roles</SelectItem>
                                            <SelectItem value="user">User</SelectItem>
                                            <SelectItem value="reviewer">Reviewer</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="divide-y divide-gray-100">
                                    {filteredUsers.map((u) => (
                                        <div key={u.id} className="py-4 flex items-center justify-between">
                                            <div>
                                                <div className="font-medium text-gray-900">{u.address}</div>
                                                <div className="text-sm text-gray-500">Status: {u.status}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Select value={u.role} onValueChange={(v) => changeRole(u.id, v as User["role"])}>
                                                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="user">User</SelectItem>
                                                        <SelectItem value="reviewer">Reviewer</SelectItem>
                                                        <SelectItem value="admin">Admin</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {u.status === "active" ? (
                                                    <Button variant="outline" className="gap-2" onClick={() => toggleSuspend(u.id)}>
                                                        <XCircle className="size-4" /> Suspend
                                                    </Button>
                                                ) : (
                                                    <Button className="gap-2" onClick={() => toggleSuspend(u.id)}>
                                                        <CheckCircle className="size-4" /> Activate
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2"><CardTitle>Moderation Queue</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                {demoFlagged.length === 0 ? (
                                    <div className="text-gray-600">No flagged reports</div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {demoFlagged.map((r) => (
                                            <div key={r.id} className="py-4 flex items-start justify-between">
                                                <div>
                                                    <div className="font-medium text-gray-900">{r.title}</div>
                                                    <Badge className={`${severityBadge[r.severity]} mt-1`}>{r.severity}</Badge>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="outline">Dismiss</Button>
                                                    <Button>Review</Button>
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
                            <CardHeader className="pb-2"><CardTitle>System Settings</CardTitle></CardHeader>
                            <CardContent className="space-y-4 text-sm text-gray-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium text-gray-900">Maintenance mode</div>
                                        <div className="text-gray-500">Temporarily disable submissions</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Checkbox checked={maintenanceMode} onCheckedChange={(v) => setMaintenanceMode(Boolean(v))} />
                                    </div>
                                </div>
                                <div>
                                    <div className="font-medium text-gray-900 mb-1">Data retention (days)</div>
                                    <Input type="number" value={retentionDays} onChange={(e) => setRetentionDays(e.target.value)} className="w-40" />
                                </div>
                                <div className="pt-2">
                                    <Button className="w-full">Save Settings</Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2"><CardTitle>Status</CardTitle></CardHeader>
                            <CardContent className="space-y-2 text-sm text-gray-700">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500">Environment</span>
                                    <span>Demo</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500">Submissions</span>
                                    <span>{maintenanceMode ? "Disabled" : "Enabled"}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
} 