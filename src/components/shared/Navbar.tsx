'use client';

import Link from 'next/link';
import Image from 'next/image';
import { LogOut, LogIn, Sun, Moon, BarChart3, UserPlus, User, Atom, CreditCard, ShieldCheck as AdminIcon, Lightbulb, X, ScrollText, LayoutGrid, Plus, Shield, Menu, Camera, ListChecks, CalendarDays, PlusCircle, Heart, FileText, Info, PlayCircle, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// FloatingActionMenu, BottomActionBar, FeedbackWidget removed
// ... existing imports ...
import { useAuth } from '@/components/auth/AuthProvider';
import { useWalkthrough } from '@/contexts/WalkthroughContext';
import { signOutUser } from '@/lib/firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { LiquidPressable } from '@/components/ui/LiquidPressable';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { FEEDBACK_ENABLED } from '@/lib/featureFlags';
import { db } from '@/config/firebase';
import {
  getDoc,
  doc as firestoreDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';
import type { UserProfile } from '@/types';



import { releaseNotesData, ReleaseNote, APP_VERSION } from '@/config/releaseNotes';

const APP_NAME = "GutCheck";
interface NavbarProps {
  isGuest?: boolean;
  onOpenDashboardClick?: () => void;
  onLogFoodAIClick?: () => void;
  onIdentifyByPhotoClick?: () => void;
  onLogSymptomsClick?: () => void;
  onLogPreviousMealClick?: () => void;
  hideFloatingActionMenu?: boolean;
  isScrolled?: boolean;
  isReleaseNotesOpen?: boolean;
  onReleaseNotesOpenChange?: (open: boolean) => void;
}

const LOCALSTORAGE_LAST_SEEN_VERSION_KEY = 'lastSeenAppVersion';

export default function Navbar({
  isGuest,
  onOpenDashboardClick,
  onLogFoodAIClick,
  onIdentifyByPhotoClick,
  onLogSymptomsClick,
  onLogPreviousMealClick,
  hideFloatingActionMenu = false,
  isScrolled: externalIsScrolled,
  isReleaseNotesOpen: externalIsReleaseNotesOpen,
  onReleaseNotesOpenChange,
}: NavbarProps) {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
  const [internalIsReleaseNotesOpen, setInternalIsReleaseNotesOpen] = useState(false);

  const isReleaseNotesOpen = externalIsReleaseNotesOpen !== undefined ? externalIsReleaseNotesOpen : internalIsReleaseNotesOpen;
  const setIsReleaseNotesOpen = (open: boolean) => {
    if (onReleaseNotesOpenChange) {
      onReleaseNotesOpenChange(open);
    } else {
      setInternalIsReleaseNotesOpen(open);
    }
  };
  const [showNewReleaseIndicator, setShowNewReleaseIndicator] = useState(false);
  const [isActionPopoverOpen, setIsActionPopoverOpen] = useState(false);
  const { startWalkthrough } = useWalkthrough();
  const [internalIsScrolled, setInternalIsScrolled] = useState(false);

  const isScrolled = externalIsScrolled ?? internalIsScrolled;

  useEffect(() => {
    const handleScroll = () => {
      setInternalIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (authUser) {
        try {
          const userProfileRef = firestoreDoc(db, 'users', authUser.uid);
          const userProfileSnap = await getDoc(userProfileRef);
          if (userProfileSnap.exists()) {
            const userProfileData = userProfileSnap.data() as UserProfile;
            setIsCurrentUserAdmin(userProfileData.isAdmin === true);
          } else {
            setIsCurrentUserAdmin(false);
          }
        } catch (error) {
          console.error("Error fetching user profile for Navbar:", error);
          setIsCurrentUserAdmin(false);
        }
      } else {
        setIsCurrentUserAdmin(false);
      }
    };
    if (!authLoading) {
      fetchUserProfile();
    }
  }, [authUser, authLoading]);



  useEffect(() => {
    if (typeof window !== 'undefined') {
      const lastSeenVersion = localStorage.getItem(LOCALSTORAGE_LAST_SEEN_VERSION_KEY);
      if (lastSeenVersion !== APP_VERSION) {
        setShowNewReleaseIndicator(true);
      }
    }
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);


  const handleSignOut = async () => {
    const error = await signOutUser();
    if (error) {
      toast({ title: 'Logout Failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      router.push('/');
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length === 1) return names[0][0]?.toUpperCase() || '';
    return (names[0][0]?.toUpperCase() || '') + (names[names.length - 1][0]?.toUpperCase() || '');
  };

  const trendsLinkHandler = (e?: React.MouseEvent) => {
    e?.preventDefault();
    router.push(pathname === '/trends' ? '/?openDashboard=true' : '/trends');
  };



  const aiInsightsLinkHandler = (e?: React.MouseEvent) => {
    e?.preventDefault();
    router.push(pathname === '/insights' ? '/?openDashboard=true' : '/insights');
  };

  const favoritesLinkHandler = (e?: React.MouseEvent) => {
    e?.preventDefault();
    router.push('/favorites');
  };

  const aboutLinkHandler = (e?: React.MouseEvent) => {
    e?.preventDefault();
    router.push('/about');
  };

  const dashboardLinkHandler = (e?: React.MouseEvent) => {
    e?.preventDefault();
    router.push('/');
  };


  const handleReleaseNotesToggle = (open: boolean) => {
    if (open) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCALSTORAGE_LAST_SEEN_VERSION_KEY, APP_VERSION);
      }
      setShowNewReleaseIndicator(false);
    }
    setIsReleaseNotesOpen(open);
  };

  const headerBaseClasses = "z-50 w-full transition-all duration-300 safe-area-pt";
  const headerClasses = cn(
    headerBaseClasses,
    isGuest
      ? "absolute top-0 bg-transparent border-none py-2"
      : cn(
        // Standard sticky position with Liquid Glass material
        "sticky top-0",
        "bg-white/10 dark:bg-black/15 backdrop-blur-xl",
        "border-b border-white/20 dark:border-white/10"
      )
  );
  const appNameBaseClasses = "font-bold font-headline text-xl";

  const handleGenericActionItemClick = (passedHandler?: () => void, redirectQueryParam?: string) => {
    if (passedHandler) {
      passedHandler();
    } else if (redirectQueryParam) {
      router.push(`/?openDialog=${redirectQueryParam}`);
    }
    setIsActionPopoverOpen(false);
  };


  return (
    <>
      <header className={headerClasses}>
        <div className={cn("flex h-16 w-full items-center justify-between", "px-2 sm:px-4")}>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Link href="/" className="flex items-center space-x-2">

              {!isGuest && (
                <span className={cn(appNameBaseClasses, 'text-current')}>{APP_NAME}</span>
              )}
            </Link>
            <Dialog open={isReleaseNotesOpen} onOpenChange={handleReleaseNotesToggle}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "text-xs p-1 h-auto ml-0 mt-1 rounded-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 relative",
                    "text-primary underline underline-offset-2",
                    "hover:bg-transparent hover:text-primary/80",
                    "transition-opacity duration-300",
                    isGuest && isScrolled ? "opacity-0 pointer-events-none" : "opacity-100"
                  )}
                  aria-label={`App Version ${APP_VERSION}, click for release notes`}
                >
                  {APP_VERSION}
                  {showNewReleaseIndicator && (
                    <span
                      className="absolute top-0.5 right-0.5 block h-2 w-2 rounded-full bg-red-500 border border-background"
                      aria-hidden="true"
                    />
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="font-headline text-xl flex items-center">
                    <ScrollText className="mr-2 h-5 w-5" /> Release Notes
                  </DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-2 -mr-2 py-2">
                  <div className="space-y-4">
                    {releaseNotesData.map((release, index) => (
                      <div key={index} className="pb-3 border-b border-border last:border-b-0">
                        <h3 className="text-md font-semibold text-foreground">
                          Version {release.version}
                          {release.date && <span className="text-xs text-muted-foreground ml-2 font-normal">- {release.date}</span>}
                        </h3>
                        {release.title && <p className="text-sm font-medium text-primary mt-0.5">{release.title}</p>}
                        {Array.isArray(release.description) ? (
                          <ul className="list-disc list-inside text-sm text-muted-foreground mt-1 space-y-0.5">
                            {release.description.map((note, noteIndex) => (
                              <li key={noteIndex}>{note}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">{release.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <DialogFooter className="sm:justify-start mt-2">
                  <DialogClose asChild>
                    <Button type="button" variant="secondary" className="w-full sm:w-auto">
                      Close
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>


          <div id="navbar-actions-container" className={cn("flex items-center", "space-x-0.5 sm:space-x-1")}>
            {isGuest ? (
              <div className="flex items-center space-x-2 sm:space-x-3">
                {/* Show Log Out if user is authenticated but on guest view */}
                {authUser && (
                  <LiquidPressable variant="icon" size="sm" haptic="light" className="text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={handleSignOut} aria-label="Log out">
                    <LogOut className="h-5 w-5" />
                  </LiquidPressable>
                )}

                <Button
                  onClick={() => router.push('/login')}
                  className={cn(
                    "flex h-9 px-3 sm:px-4 text-xs sm:text-sm transition-all duration-300", // Visible on all screens
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                    isGuest && isScrolled ? "opacity-0 pointer-events-none" : "opacity-100"
                  )}
                  variant={'default'}
                >
                  <UserPlus className="mr-1.5 h-4 sm:h-5 w-4 sm:w-5" />
                  Sign In / Up
                </Button>
              </div>
            ) : (
              <>
                {!authLoading && authUser && null}

                <div className="hidden md:flex items-center space-x-0.5 sm:space-x-1">
                  {!authLoading && authUser && (
                    <>
                      <LiquidPressable variant="icon" size="sm" haptic="light" className={cn("focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors", pathname === '/' ? 'bg-primary/10 text-primary' : 'text-current hover:text-primary hover:bg-primary/10')} aria-label="Dashboard" id="nav-item-dashboard" onClick={dashboardLinkHandler}>
                        <LayoutGrid className="h-5 w-5" />
                      </LiquidPressable>
                      <LiquidPressable variant="icon" size="sm" haptic="light" className={cn("focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors", pathname === '/favorites' ? 'bg-primary/10 text-primary' : 'text-current hover:text-primary hover:bg-primary/10')} aria-label="Favorites" id="nav-item-favorites" onClick={favoritesLinkHandler}>
                        <Heart className="h-5 w-5" />
                      </LiquidPressable>
                      <LiquidPressable variant="icon" size="sm" haptic="light" className={cn("focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors", pathname === '/trends' ? 'bg-primary/10 text-primary' : 'text-current hover:text-primary hover:bg-primary/10')} aria-label="Trends" id="nav-item-trends" onClick={trendsLinkHandler}>
                        <BarChart3 className="h-5 w-5" />
                      </LiquidPressable>

                      <div className="relative">
                        <LiquidPressable
                          variant="icon"
                          size="sm"
                          haptic="light"
                          className={cn("focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors", pathname === '/insights' ? 'bg-primary/10 text-primary' : 'text-current hover:text-primary hover:bg-primary/10')}
                          aria-label="Insights"
                          id="nav-item-insights"
                          onClick={aiInsightsLinkHandler}
                        >
                          <Lightbulb className="h-5 w-5" />
                        </LiquidPressable>
                      </div>
                      <LiquidPressable variant="icon" size="sm" haptic="light" className={cn("focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors", pathname === '/about' ? 'bg-primary/10 text-primary' : 'text-current hover:text-primary hover:bg-primary/10')} aria-label="About" id="nav-item-about" onClick={aboutLinkHandler}>
                        <Info className="h-5 w-5" />
                      </LiquidPressable>
                    </>
                  )}

                  <LiquidPressable variant="icon" size="sm" haptic="medium" onClick={toggleDarkMode} className="text-current hover:text-primary hover:bg-primary/10" aria-label="Toggle dark mode">
                    {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </LiquidPressable>


                </div>

                {!authLoading && authUser && (
                  <div className="md:hidden">
                    <LiquidPressable
                      variant="icon"
                      size="lg"
                      haptic="medium"
                      className="text-current hover:text-primary hover:bg-primary/10"
                      aria-label="Open menu"
                      onClick={() => setIsMobileMenuOpen(true)}
                    >
                      <Menu className="h-7 w-7" />
                    </LiquidPressable>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 h-full w-[85vw] max-w-sm bg-background/20 backdrop-blur-xl border-l border-border z-[100] flex flex-col shadow-2xl overflow-hidden rounded-l-2xl"
            >
              <div className="p-4 safe-area-pt flex items-center justify-between border-b border-border bg-muted/20">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage src={authUser?.photoURL || undefined} alt={authUser?.displayName || 'User'} />
                    <AvatarFallback className="bg-primary text-primary-foreground">{getInitials(authUser?.displayName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{authUser?.displayName || 'User'}</p>
                    <p className="text-xs text-muted-foreground">{authUser?.email}</p>
                  </div>
                </div>
                <LiquidPressable variant="icon" size="sm" haptic="light" onClick={() => setIsMobileMenuOpen(false)}>
                  <X className="h-5 w-5" />
                </LiquidPressable>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                <motion.div
                  className="flex flex-col space-y-1"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
                  }}
                >
                  {[{ icon: LayoutGrid, label: "Dashboard", onClick: () => { setIsMobileMenuOpen(false); dashboardLinkHandler(); } },
                  { icon: Heart, label: "Favorites", onClick: () => { setIsMobileMenuOpen(false); favoritesLinkHandler(); } },
                  { icon: BarChart3, label: "Trends", onClick: () => { setIsMobileMenuOpen(false); trendsLinkHandler(); } },

                  { icon: Lightbulb, label: "Insights", onClick: () => { setIsMobileMenuOpen(false); aiInsightsLinkHandler(); } },
                  { icon: User, label: "User Center", onClick: () => { setIsMobileMenuOpen(false); router.push('/profile'); } },
                  ...(FEEDBACK_ENABLED ? [{ icon: MessageSquare, label: "Feedback", onClick: () => { setIsMobileMenuOpen(false); router.push('/feedback'); } }] : []),
                  { icon: PlayCircle, label: "App Tour", onClick: () => { setIsMobileMenuOpen(false); startWalkthrough('welcome'); } },
                  { icon: Shield, label: "Privacy Notice", onClick: () => { setIsMobileMenuOpen(false); router.push('/privacy'); } },
                  { icon: FileText, label: "Terms of Use", onClick: () => { setIsMobileMenuOpen(false); router.push('/terms'); } },
                  { icon: BarChart3, label: "Health Debug", onClick: () => { setIsMobileMenuOpen(false); router.push('/health-debug'); } },
                  { icon: Info, label: "About", onClick: () => { setIsMobileMenuOpen(false); aboutLinkHandler(); } },
                  ].map((item, idx) => (
                    <motion.div key={idx} variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}>
                      <LiquidPressable variant="ghost" size="lg" haptic="light" className="w-full justify-start text-base h-12 rounded-xl" onClick={item.onClick}>
                        <item.icon className="mr-3 h-5 w-5 text-muted-foreground" /> {item.label}
                      </LiquidPressable>
                    </motion.div>
                  ))}

                  <div className="my-2 border-t border-border/50" />

                  <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}>
                    <LiquidPressable variant="ghost" size="lg" haptic="medium" className="w-full justify-start text-base h-12 rounded-xl" onClick={toggleDarkMode}>
                      {isDarkMode ? <Sun className="mr-3 h-5 w-5" /> : <Moon className="mr-3 h-5 w-5" />} Toggle Theme
                    </LiquidPressable>
                  </motion.div>

                  {isCurrentUserAdmin && (
                    <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}>
                      <LiquidPressable variant="ghost" size="lg" haptic="light" className="w-full justify-between text-base h-12 pr-4 rounded-xl" onClick={() => { setIsMobileMenuOpen(false); router.push('/admin/feedback'); }}>
                        <div className="flex items-center">
                          <AdminIcon className="mr-3 h-5 w-5" /> Admin Dashboard
                        </div>
                      </LiquidPressable>
                    </motion.div>
                  )}

                  <div className="my-2 border-t border-border/50" />

                  <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}>
                    <LiquidPressable variant="ghost" size="lg" haptic="light" className="w-full justify-start text-base h-12 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-xl" onClick={handleSignOut}>
                      <LogOut className="mr-3 h-5 w-5" /> Log out
                    </LiquidPressable>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </>
        )
        }
      </AnimatePresence >

      {/* Bottom Action Bar removed in favor of Global Liquid Navigation */}
    </>
  );
}

