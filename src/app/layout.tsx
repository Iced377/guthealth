
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ThemeProvider } from '@/contexts/ThemeContext';
// FeedbackWidget moved to Navbar for unified BottomActionBar
import CookieConsentBanner from '@/components/shared/CookieConsentBanner';
import AnalyticsWithConsent from '@/components/shared/AnalyticsWithConsent';
import { WalkthroughProvider } from '@/contexts/WalkthroughContext';
import WalkthroughOverlay from '@/components/walkthrough/WalkthroughOverlay';
import WalkthroughStage from '@/components/walkthrough/WalkthroughStage';
import { GlobalNavigationLayout } from '@/components/layout/GlobalNavigationLayout';
import NetworkStatusIndicator from '@/components/ui/NetworkStatusIndicator';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

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

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#27AE60" />
        <script
          id="theme-script"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Theme initialization
                  const stored = localStorage.getItem('app-theme-preference');
                  const system = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  
                  if (stored === 'dark' || (!stored && system) || (stored === 'system' && system)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }

                  // Suppress ResizeObserver loop errors (benign warning from third-party libs)
                  const origError = window.onerror;
                  window.onerror = function(msg) {
                    if (typeof msg === 'string' && msg.includes('ResizeObserver loop')) {
                      return true;
                    }
                    return origError ? origError.apply(this, arguments) : false;
                  };
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className={`${inter.variable} font-body antialiased min-h-screen flex flex-col bg-background text-foreground`}>
        <AuthProvider>
          <ThemeProvider>
            <WalkthroughProvider>
              <NetworkStatusIndicator />
              <GlobalNavigationLayout>
                <main className="flex-grow w-full">
                  {children}
                </main>
                <WalkthroughStage />
                <WalkthroughOverlay />
                <Toaster />

                <CookieConsentBanner />
              </GlobalNavigationLayout>
            </WalkthroughProvider>
          </ThemeProvider>
        </AuthProvider>
        <AnalyticsWithConsent />
        {/* {gaId && <GoogleAnalytics gaId={gaId} />} */}
      </body>
    </html>
  );
}
