
'use client';

import { useState } from 'react';
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
import { Loader2, Upload, FileText } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

export default function PedometerImportDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
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

            // Ideally trigger a refresh of the parent data here
            // But page refresh is simple fallback or we can use a context/prop to refetch
            // For now, let's just reload the page to be safe as data is massive
            window.location.reload();
            // console.log('Import response:', data);

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
                    <Upload className="h-4 w-4" />
                    Import Pedometer++
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Import Pedometer++ Data</DialogTitle>
                    <DialogDescription>
                        Export your data from the Pedometer++ app as a CSV file and upload it here.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-4">
                        <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
                            <p className="font-medium text-foreground mb-1">How to export:</p>
                            <ol className="list-decimal list-inside space-y-1">
                                <li>Open Pedometer++ on your iPhone.</li>
                                <li>Go to <strong>Settings</strong> via the gear icon.</li>
                                <li>Tap <strong>Export Data</strong>.</li>
                                <li>Choose <strong>Export to CSV</strong>.</li>
                                <li>Save the file and upload it here.</li>
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
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isUploading}>
                        Cancel
                    </Button>
                    <Button onClick={handleUpload} disabled={!file || isUploading}>
                        {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Import Data
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
