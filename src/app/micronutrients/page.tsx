'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { Loader2, AlertTriangle, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MicrosMotionControllerProvider } from '@/components/micros/useMicrosMotionController';
import MicrosHeroScene from '@/components/micros/MicrosHeroScene';

export default function MicronutrientsPage() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-black">
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-white/50" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-black text-white">
        <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
          <p className="text-white/60">Please log in to view your micronutrient progress.</p>
          <div className="mt-8">
            <Button asChild variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Link href="/?openDashboard=true">
                <Home className="mr-2 h-4 w-4" /> Return to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Provider wraps the scene to enforce motion authority */}
      <MicrosMotionControllerProvider>
        <MicrosHeroScene />
      </MicrosMotionControllerProvider>
    </div>
  );
}
