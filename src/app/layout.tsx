
import type { Metadata, Viewport } from 'next';
// Removed 'Inter' from 'next/font/google' to load it directly
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ThemeProvider } from '@/contexts/ThemeContext';
// FeedbackWidget moved to Navbar for unified BottomActionBar
import CookieConsentBanner from '@/components/shared/CookieConsentBanner';

// `inter` variable is no longer needed here

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#27AE60',
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9002'),
  title: 'GutCheck',
  description: 'Your smart companion for easy food logging and meaningful insights.',
  openGraph: {
    title: 'GutCheck',
    description: 'Your smart companion for easy food logging and meaningful insights.',
    images: [
      {
        url: '/opengraph-image.jpg',
        width: 1200,
        height: 630,
        alt: 'GutCheck Logo',
      },
    ],
    type: 'website',
  },
  icons: {
    icon: '/favicon-32.png',
    shortcut: '/favicon-32.png',
    apple: '/icon-192.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#27AE60" />
        {/* Direct link to Google Fonts for Inter */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      {/* Removed the inter.variable class name from the body */}
      <body suppressHydrationWarning className="font-body antialiased min-h-screen flex flex-col bg-background text-foreground">
        <AuthProvider>
          <ThemeProvider>
            <main className="flex-grow w-full">
              {children}
            </main>
            <Toaster />

            <CookieConsentBanner />
          </ThemeProvider>
        </AuthProvider>
        {/* {gaId && <GoogleAnalytics gaId={gaId} />} */}
      </body>
    </html>
  );
}
