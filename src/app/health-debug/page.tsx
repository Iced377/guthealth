'use client';

import { useState } from 'react';
import { AppleHealthService } from '@/lib/apple-health';

export default function HealthDebugPage() {
    const [status, setStatus] = useState<string>('Ready');
    const [samples, setSamples] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    const fetchHealthData = async () => {
        setStatus('Fetching...');
        setError(null);
        setSamples([]);

        try {
            // Check availability first
            const isAvailable = await AppleHealthService.isAvailable();
            if (!isAvailable) {
                setError('Apple Health is NOT available on this device.');
                setStatus('Failed');
                return;
            }

            // Request permissions just in case
            await AppleHealthService.requestPermissions();

            // Fetch raw samples
            const rawSamples = await AppleHealthService.getRawStepSamples(30);
            setSamples(rawSamples);
            setStatus(`Success: Found ${rawSamples.length} samples`);

        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Unknown error occurred');
            setStatus('Error');
        }
    };

    const addTestSteps = async () => {
        try {
            setStatus('Adding steps...');
            await AppleHealthService.saveSteps(100);
            setStatus('Added 100 steps! Fetching now...');
            await fetchHealthData();
        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Failed to add steps');
            setStatus('Error');
        }
    };

    return (
        <div className="p-4 max-w-2xl mx-auto space-y-6 pb-24">
            <h1 className="text-2xl font-bold">Apple Health Debugger</h1>

            <div className="space-y-2">
                <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <span className="font-semibold">Status:</span>
                    <span className={status === 'Error' || status === 'Failed' ? 'text-red-500 font-bold' : 'text-green-600'}>
                        {status}
                    </span>
                </div>

                {error && (
                    <div className="p-4 bg-red-100 text-red-800 rounded-lg border border-red-200">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={fetchHealthData}
                        disabled={status === 'Fetching...'}
                        className="w-full py-4 bg-blue-600 text-white rounded-lg font-bold text-lg disabled:opacity-50 active:scale-95 transition-transform"
                    >
                        {status === 'Fetching...' ? 'Fetching...' : 'Fetch Data'}
                    </button>
                    <button
                        onClick={addTestSteps}
                        className="w-full py-4 bg-green-600 text-white rounded-lg font-bold text-lg active:scale-95 transition-transform"
                    >
                        + 100 Steps
                    </button>
                </div>
            </div>

            {samples.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Step Samples ({samples.length})</h2>
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-200 dark:bg-gray-700">
                                <tr>
                                    <th className="p-2">Date</th>
                                    <th className="p-2 text-right">Steps</th>
                                    <th className="p-2">Source</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {samples.map((sample, idx) => (
                                    <tr key={idx} className="bg-white dark:bg-gray-900">
                                        <td className="p-2">
                                            {new Date(sample.startDate).toLocaleString()}
                                        </td>
                                        <td className="p-2 text-right font-mono font-bold">
                                            {Math.round(sample.value)}
                                        </td>
                                        <td className="p-2 text-xs text-gray-500">
                                            {sample.sourceName || sample.sourceBundleId || 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <details>
                        <summary className="cursor-pointer text-blue-500 font-medium">View Raw JSON</summary>
                        <pre className="mt-2 p-4 bg-black text-green-400 rounded-lg text-xs overflow-auto h-64">
                            {JSON.stringify(samples, null, 2)}
                        </pre>
                    </details>
                </div>
            )}
        </div>
    );
}
