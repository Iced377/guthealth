'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn } from 'lucide-react';
import { HeroSection, ProblemSection, StorySection, FeatureGrid, SecuritySection, FinalCTA } from '@/components/about/AboutSections';
import { APP_VERSION as version } from '@/config/releaseNotes';

export default function LandingPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isWebview, setIsWebview] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return;

      const currentScrollY = scrollRef.current.scrollTop;
      const isScrollingUp = currentScrollY < lastScrollY.current;
      const isAtTop = currentScrollY < 50; // Always show at very top

      if (isAtTop || isScrollingUp) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setIsVisible(false);
      }

      lastScrollY.current = currentScrollY;
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    setIsWebview(document.documentElement.dataset.webview === 'true');
  }, []);

  return (
    <div
      ref={scrollRef}
      className={`fixed inset-0 bg-background text-foreground overflow-y-auto overflow-x-hidden selection:bg-primary/30 font-body antialiased safe-area-pt scroll-smooth z-[45] landing-root ${isWebview ? 'landing-webview snap-y snap-mandatory' : ''}`}
    >
      {/* Version Display (Top Left) */}
      <div className="fixed top-14 left-6 z-[70] pointer-events-none opacity-50 text-xs font-mono text-muted-foreground">
        v{version}
      </div>

      {/* Floating Action Buttons (Top Right) */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="fixed top-14 right-6 z-[70] flex flex-col items-end gap-3"
          >
            <Link
              href="/login"
              className="px-4 py-2 rounded-full bg-background/50 backdrop-blur-md border border-white/10 text-sm font-medium text-foreground hover:bg-background/80 shadow-sm flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
            >
              Start / Login
              <LogIn className="w-4 h-4" />
            </Link>

            <Link
              href="/support"
              className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors px-2"
            >
              Need Help?
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        <HeroSection scrollContainerRef={scrollRef} />
        <ProblemSection scrollContainerRef={scrollRef} />
        <StorySection />
        <FeatureGrid />
        <SecuritySection />
        <FinalCTA isLoggedIn={false} />
      </main>
    </div>
  );
}
