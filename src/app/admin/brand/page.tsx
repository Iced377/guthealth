'use client';

import { BrandDeck } from '@/components/brand/BrandDeck';
import { useRouter } from 'next/navigation';

export default function BrandPage() {
    const router = useRouter();

    return (
        <div className="h-screen w-screen overflow-hidden">
            <BrandDeck onClose={() => router.push('/admin')} />
        </div>
    );
}
