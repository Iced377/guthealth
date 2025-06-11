
import type { Metadata } from 'next';
import LandingPageClientContent from '@/components/landing/LandingPageClientContent'; // Updated import

export const metadata: Metadata = {
  title: 'GutCheck - Track Your Gut, Transform Your Health',
  description: 'Log meal conveniently, get deep nutritional analysis, track reactions, and receive personalized insights to master your diet and well-being.',
  openGraph: {
    title: 'GutCheck - Track Your Gut, Transform Your Health',
    description: 'Log meal conveniently, get deep nutritional analysis, track reactions, and receive personalized insights to master your diet and well-being.',
    images: [
      {
        url: '/Gutcheck_logo.png', 
        width: 512,
        height: 512,
        alt: 'GutCheck Logo',
      },
    ],
  },
};

// This is the Server Component for the /landing route
export default function LandingPage() {
  return <LandingPageClientContent />;
}
