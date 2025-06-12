
'use client';
import { Loader2, Heart } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';

export default function FavoritesLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <div className="flex-grow flex items-center justify-center">
        <Heart className="h-16 w-16 animate-pulse text-primary mr-4" />
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-xl text-foreground">Loading Your Favorite Meals...</p>
      </div>
    </div>
  );
}
