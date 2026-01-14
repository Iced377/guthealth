'use client';

import { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FitbitSuccessPage() {
    useEffect(() => {
        // Attempt to deep link back to the app
        window.location.href = 'gutcheck://';
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-green-50 p-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Fitbit Connected!</h1>
            <p className="text-gray-600 mb-8 max-w-xs">
                Your Fitbit account has been successfully linked. You can now return to the GutCheck app.
            </p>
            <Button
                onClick={() => window.location.href = 'gutcheck://'}
                className="w-full max-w-xs bg-green-600 hover:bg-green-700 text-white"
            >
                Return to App
            </Button>
        </div>
    );
}
