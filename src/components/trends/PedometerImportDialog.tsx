'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, FileText, Activity, RefreshCw } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { AppleHealthService } from '@/lib/apple-health';
import { Capacitor } from '@capacitor/core';
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

export default function PedometerImportDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();

    useEffect(() => {
        setIsIOS(Capacitor.getPlatform() === 'ios');
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleAppleHealthSync = async () => {
        if (!user) return;
        setIsSyncing(true);
        try {
            await AppleHealthService.requestPermissions();
            const steps = await AppleHealthService.getTodaySteps();

            // Save to Firestore
            // Consistent with the CSV import logic, we create a doc for today
            const now = new Date();
            const docId = `pedometer_${now.getTime()}`; // Or maybe utilize date-string for uniqueness per day? 
            // The CSV import uses distinct timestamps. For daily sync, we might want to update a daily doc.
            // But let's stick to the current pattern of appending entries or update "today's" entry.
            // Actually, for "Timeline", distinct entries are key.
            // Let's create a specific entry for "Apple Health Today" that we overwrite

            const todayStr = now.toISOString().split('T')[0];
            const syncDocId = `apple_health_${todayStr}`;

            await setDoc(doc(db, 'users', user.uid, 'timelineEntries', syncDocId), {
                id: syncDocId,
                timestamp: Timestamp.fromDate(now),
                entryType: 'pedometer_data',
                steps: steps,
                distance: 0, // We can fetch this too if expanded
                floorsAscended: 0,
                activeEnergy: 0,
                source: 'apple_health',
                syncedAt: Timestamp.now()
            }, { merge: true });

            toast({
                title: 'Sync Complete',
                description: `Synced ${steps} steps from Apple Health.`,
            });

            // Optional: Reload or Refetch
            window.location.reload();

        } catch (error: any) {
            console.error('Apple Health Sync Error:', error);
            toast({
                title: 'Sync Failed',
                description: error.message || 'Could not sync with Apple Health',
                variant: 'destructive'
            });
        } finally {
            setIsSyncing(false);
            setIsOpen(false);
        }
    };

    const handleUpload = async () => {
        if (!file || !user) return;

        setIsUploading(true);
        try {
            const text = await file.text();
            const idToken = await user.getIdToken();

            const res = await fetch('/api/integrations/pedometer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({ csvContent: text }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            toast({
                title: data.skipped ? 'Import Complete (Partial)' : 'Import Successful',
                description: data.message || `Imported data from ${file.name}`,
                variant: data.skipped ? 'destructive' : 'default',
            });

            if (data.errors && data.errors.length > 0) {
                alert(`Some lines were skipped:\n${data.errors.slice(0, 5).join('\n')}${data.errors.length > 5 ? '\n...' : ''}`);
            }
            setIsOpen(false);
            setFile(null);
            window.location.reload();

        } catch (error: any) {
            console.error('Import error:', error);
            toast({
                title: 'Import Failed',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    {isIOS ? <Activity className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                    {isIOS ? 'Sync Activity' : 'Import Pedometer'}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Activity Sync</DialogTitle>
                    <DialogDescription>
                        Sync your steps from Apple Health or import a CSV file. <span className="text-xs text-muted-foreground ml-2">(Platform: {Capacitor.getPlatform()})</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {isIOS && (
                        <div className="flex flex-col gap-2 p-4 border rounded-lg bg-secondary/10">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Activity className="h-4 w-4" /> Apple Health
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Automatically sync your today's step count from Apple Health.
                            </p>
                            <Button
                                onClick={handleAppleHealthSync}
                                disabled={isSyncing}
                                className="w-full mt-2"
                                variant="default"
                            >
                                {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                Sync Now
                            </Button>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="h-px flex-1 bg-border" />
                            <span className="text-xs text-muted-foreground uppercase">Or Import CSV</span>
                            <div className="h-px flex-1 bg-border" />
                        </div>

                        <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
                            <p className="font-medium text-foreground mb-1">Pedometer++ CSV Import:</p>
                            <ol className="list-decimal list-inside space-y-1 text-xs">
                                <li>Open Pedometer++ &gt; Settings</li>
                                <li>Export Data &gt; Export to CSV</li>
                                <li>Upload here</li>
                            </ol>
                        </div>

                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Input
                                id="csv-file"
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                disabled={isUploading}
                            />
                            {file && (
                                <p className="text-xs text-muted-foreground flex items-center mt-1">
                                    <FileText className="h-3 w-3 mr-1" />
                                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                                </p>
                            )}
                        </div>
                        <Button
                            onClick={handleUpload}
                            disabled={!file || isUploading}
                            variant="secondary"
                            className="w-full"
                        >
                            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Import CSV
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
