'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/shared/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, BarChart3, Users } from 'lucide-react';
import Link from 'next/link';
import { getAcquisitionStats } from '@/actions/admin';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';

interface ChartData {
    period: string;
    count: number;
    cumulativeCount: number;
}

export default function AcquisitionPage() {
    const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [data, setData] = useState<ChartData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const stats = await getAcquisitionStats(timeframe);
                // Sort stats based on date parsing?
                // For now, assuming server returns reasonable chunks or we trust input order if sorted there.
                // Reversing or sorting here might be needed if object keys were random.
                setData(stats);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [timeframe]);


    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <div className="container mx-auto py-8 px-4 space-y-6">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin"><ArrowLeft className="w-4 h-4" /></Link>
                    </Button>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                        <BarChart3 className="w-8 h-8 text-primary" />
                        Acquisition Dashboard
                    </h1>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="space-y-1">
                                <CardTitle>New User Growth</CardTitle>
                                <CardDescription>Users joined per period.</CardDescription>
                            </div>
                            <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as any)} className="w-[300px]">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="daily">Daily</TabsTrigger>
                                    <TabsTrigger value="weekly">Weekly</TabsTrigger>
                                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </CardHeader>
                        <CardContent className="h-[300px] mt-4">
                            {loading ? (
                                <div className="h-full flex items-center justify-center text-muted-foreground">Loading...</div>
                            ) : data.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                                        <XAxis dataKey="period" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#888888' }} dy={10} />
                                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#888888' }} allowDecimals={false} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                                        />
                                        <Bar dataKey="count" fill="currentColor" className="fill-primary" radius={[4, 4, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground">No data available.</div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Total User Base</CardTitle>
                            <CardDescription>Cumulative users over time.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px] mt-4">
                            {loading ? (
                                <div className="h-full flex items-center justify-center text-muted-foreground">Loading...</div>
                            ) : data.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data}>
                                        <defs>
                                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                                        <XAxis dataKey="period" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#888888' }} dy={10} />
                                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#888888' }} allowDecimals={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                                        />
                                        <Area type="monotone" dataKey="cumulativeCount" stroke="#8884d8" fillOpacity={1} fill="url(#colorTotal)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground">No data available.</div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
