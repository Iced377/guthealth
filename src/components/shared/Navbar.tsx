'use client';

import Link from 'next/link';
import Image from 'next/image';
import { LogOut, LogIn, Sun, Moon, BarChart3, UserPlus, User, Atom, CreditCard, ShieldCheck as AdminIcon, Lightbulb, X, ScrollText, LayoutGrid, Plus, Shield, Menu, Camera, ListChecks, CalendarDays, PlusCircle, Heart, FileText, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingActionMenu } from './FloatingActionMenu';
import { BottomActionBar } from './BottomActionBar';
import FeedbackWidget from '../feedback/FeedbackWidget';
// ... existing imports ...
import { useAuth } from '@/components/auth/AuthProvider';
import { signOutUser } from '@/lib/firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
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

const APP_NAME = "GutCheck";
const APP_VERSION = "Beta 3.10.2";


interface ReleaseNote {
  version: string;
  date?: string;
  title?: string;
  description: string | string[];
}

const releaseNotesData: ReleaseNote[] = [
  {
    version: "Beta 3.10.2",
    date: "Jan 08, 2026",
    title: "UI Refinements & Polish",
    description: [
      "User Center: Simplified section headers by removing icons for a cleaner look.",
      "Navigation: Moved 'Edit Profile' button to the top for better visibility.",
      "Theme: Standardized icon colors across the User Center and Setup Wizard."
    ]
  },
  {
    version: "Beta 3.10.1",
    date: "Jan 07, 2026",
    title: "Major Feature Release: User Profile Editing",
    description: [
      "User Center: You can now fully edit your Profile! Update your Height, Weight, Activity Level, and Goals.",
      "Smart Targets: Changing your profile automatically recalculates your daily Calorie (TDEE) and Macro targets.",
      "Sync: The Profile changes now instantly sync to your Dashboard 'Nutrition Overview' cards.",
      "Fix: Dashboard dark mode themes are now consistent with the User Center.",
      "UX: Added a 'Restart Setup' button to easily redo the entire onboarding process."
    ]
  },
  {
    version: "Beta 3.9.20",
    date: "Jan 06, 2026",
    title: "Meal Timing Distribution",
    description: [
      "Trends: Added a new 'Meal Timing Distribution' chart to show you the frequency of your meals throughout the day.",
    ]
  },
  {
    version: "Beta 3.9.19",
    date: "Jan 06, 2026",
    title: "Hourly Calories Trend",
    description: [
      "Trends: Added a new chart to visualize your average calorie intake by hour of the day to help identify eating patterns.",
    ]
  },
  {
    version: "Beta 3.9.18",
    date: "Jan 06, 2026",
    title: "Trends Data Fix",
    description: [
      "Trends: Fixed a data filtering bug where morning data was missing from the earliest day in selected time ranges.",
      "Dev: Fixed localhost access issues.",
    ]
  },
  {
    version: "Beta 3.9.17",
    date: "Jan 05, 2026",
    title: "Critical Permission Fix",
    description: [
      "Fitbit: Forced the app to request all necessary permissions (Activity, Nutrition, Profile, Weight) to prevent configuration errors in production environments.",
    ]
  },
  {
    version: "Beta 3.9.16",
    date: "Jan 05, 2026",
    title: "User Center & Fitbit Fixes",
    description: [
      "User Center: Launched a new profile management page where you can update your Date of Birth and manage connected apps.",
      "Fitbit Toggle: Added a dedicated toggle to easily connect or disconnect your Fitbit account.",
      "Sync Fix: Resolved a critical issue where Fitbit permissions were missing, causing 403 errors and data syncing delays. The app now correctly requests and checks for Profile and Activity permissions.",
      "Timezone Fix: Fixed a timezone alignment bug that caused morning syncing to fail.",
    ]
  },
  {
    version: "Beta 3.9.15",
    date: "Jan 03, 2026",
    title: "Admin Automation",
    description: [
      "Admin: Feedback items are now automatically marked as 'Viewed' when you leave the feedback page.",
      "Fix: Resolved a layout hydration warning."
    ]
  },
  {

    version: "Beta 3.9.14",
    date: "Jan 03, 2026",
    title: "App Icons & Social Sharing",
    description: [
      "App Identity: Optimized app icons and fixed WhatsApp/Social sharing links to correctly display the app logo."
    ]
  },
  {
    version: "Beta 3.9.13",
    date: "January 3, 2026",
    title: "Mobile UI Polish",
    description: [
      "Mobile: Hidden the 'Sign In' button on the guest header for a cleaner mobile look.",
      "Mobile: Added a 'Log Out' button for authenticated users viewing the guest page.",
      "UI: Updated Hero text and improved spacing to prevent text overlap on small screens.",
      "Layout: Adjusted positioning of action buttons for better visibility on mobile devices."
    ]
  },
  {
    version: "Beta 3.9.12",
    date: "January 3, 2026",
    title: "Landing Page Redesign",
    description: [
      "Landing Page: Implemented a full-screen video background experience.",
      "UI: Simplified the guest header by removing the background and app title for a cleaner look.",
      "Fix: Resolved a video loading issue on the landing page."
    ]
  },
  {
    version: "Beta 3.9.11",
    date: "January 2, 2026",
    title: "UI & Interaction Polish",
    description: [
      "Trends: Charts now use click-to-view tooltips for better mobile experience.",
      "Trends: Micronutrient achievements now open detailed popups on click.",
      "Mobile: Fixed missing menu items and menu height issues.",
    ]
  },
  {
    version: "Beta 3.9.10",
    date: "January 2, 2026",
    title: "Layout Fix (Trends)",
    description: [
      "Optimized the Trends Dashboard layout for smaller screens.",
    ]
  },
  {
    version: "Beta 3.9.9",
    date: "January 2, 2026",
    title: "Debug & Layout Fix",
    description: [
      "Fixed mobile layout overflow issue.",
      "Added diagnostic tools for Fitbit sync.",
    ]
  },
  {
    version: "Beta 3.9.8",
    date: "January 2, 2026",
    title: "Hotfix",
    description: [
      "Build Fix: Resolved a syntax error in the Fitbit sync API that was causing deployment failures.",
    ]
  },
  {
    version: "Beta 3.9.6",
    date: "January 2, 2026",
    title: "Sync & AI Fixes",
    description: [
      "Fitbit Sync Engine Overhaul: Implemented a smart holistic sync that handles 1-year history (chunked), auto-syncs on page load, and guarantees real-time 'Today' data.",
      "AI Food Recognition Fix: Resolved an issue where the AI service was failing due to configuration mismatch. Text and Image logging are fully operational again.",
    ]
  },
  {
    version: "Beta 3.9.5",
    date: "January 1, 2026",
    title: "AI Improvements",
    description: [
      "AI: Improved food identification to automatically estimate quantities for more accurate macro tracking.",
      "AI: Optimized nutrition analysis for faster response times.",
    ]
  },
  {
    version: "Beta 3.8.24",
    date: "December 31, 2025",
    title: "Visual Alignment",
    description: [
      "UI: Perfectly aligned timeline nodes with date headers.",
    ]
  },
  {
    version: "Beta 3.8.23",
    date: "December 31, 2025",
    title: "Layout Refinement",
    description: [
      "UI: Adjusted timeline spacing to prevent header overlap.",
    ]
  },
  {
    version: "Beta 3.8.22",
    date: "December 31, 2025",
    title: "Timeline Design",
    description: [
      "UI: Overhauled the Dashboard Layout into a structured Vertical Timeline for a cleaner, professional look.",
    ]
  },
  {
    version: "Beta 3.8.21",
    date: "December 31, 2025",
    title: "Layout Fixes",
    description: [
      "UI: Fixed Desktop Grid Layout to ensure all daily cards are of equal height.",
    ]
  },
  {
    version: "Beta 3.8.20",
    date: "December 31, 2025",
    title: "Shorter Titles",
    description: [
      "AI: Updated the Title Generator to limit creative names to 21 characters for better UI fit.",
    ]
  },
  {
    version: "Beta 3.8.19",
    date: "December 31, 2025",
    title: "Streamlined Cards",
    description: [
      "UI: Cleaned up Food Card headers by consolidating all actions into a single menu button.",
    ]
  },
  {
    version: "Beta 3.8.18",
    date: "December 31, 2025",
    title: "Refined Actions",
    description: [
      "UI: Enhanced the bottom action bar with a richer frosted glass effect.",
      "UI: Redesigned the Log Food Menu to use a unified, accessible panel instead of floating buttons.",
    ]
  },
  {
    version: "Beta 3.8.17",
    date: "December 31, 2025",
    title: "Critical Fix",
    description: [
      "Bug Fix: Resolved a runtime error caused by missing layout components.",
    ]
  },
  {
    version: "Beta 3.8.16",
    date: "December 31, 2025",
    title: "Centered Menu",
    description: [
      "UI: Unified Feedback and Add Actions into a centered, frosted-glass bottom menu bar for better accessibility and aesthetics.",
    ]
  },
  {
    version: "Beta 3.8.15",
    date: "December 31, 2025",
    title: "Sync Fix",
    description: [
      "Bug Fix: Fixed an issue where Fitbit Sync was checking for future data instead of past data.",
    ]
  },
  {
    version: "Beta 3.8.14",
    date: "December 31, 2025",
    title: "Consistent Actions",
    description: [
      "Visuals: Applied consistent styling (Green with White Border) to the Feedback Widget button.",
    ]
  },
  {
    version: "Beta 3.8.13",
    date: "December 31, 2025",
    title: "Refined Actions",
    description: [
      "Visuals: Updated Floating Action Button to Primary Green with White Border for better contrast against page content.",
    ]
  },
  {
    version: "Beta 3.8.12",
    date: "December 31, 2025",
    title: "Streamlined Indicators",
    description: [
      "Visuals: Removed text indicators for 'Edited'.",
      "Action: Edit button now highlights white when an item has been modified.",
      "Action: Symptoms button now highlights white when symptoms are logged.",
    ]
  },
  {
    version: "Beta 3.8.11",
    date: "December 31, 2025",
    title: "Visual Prominence Update",
    description: [
      "Visuals: Added prominent outlines to the Add Button and Feedback actions to make them visually distinct and cohesive.",
    ]
  },
  {
    version: "Beta 3.8.10",
    date: "December 31, 2025",
    title: "Checking Visibility",
    description: [
      "Visuals: Adjusted colors for FAB and Food Cards to improve contrast against the green theme.",
      "Visuals: Card titles are now white for better readability.",
    ]
  },
  {
    version: "Beta 3.8.9",
    date: "December 31, 2025",
    title: "UI/UX Overhaul: FAB & Animations",
    description: [
      "Navigation: Replaced Navbar 'Add' button with a new Floating Action Menu (FAB) for quick access to logging.",
      "Menu: Mobile menu now opens with a smooth staggered animation and occupies the top half of the screen.",
      "Feedback: Refined button hover states for a cleaner, less intrusive look.",
    ]
  },
  {
    version: "Beta 3.8.8",
    date: "December 31, 2025",
    title: "Enhanced Animation Visibility",
    description: [
      "Interactions: Increased animation scale factor to 1.05x to ensure hover effects are clearly visible on small icons.",
    ]
  },
  {
    version: "Beta 3.8.7",
    date: "December 31, 2025",
    title: "Animation Stability Fixes",
    description: [
      "Interactions: Fixed missing animations on card icons and navbar triggers by isolating animation logic from tooltip logic.",
    ]
  },
  {
    version: "Beta 3.8.5",
    date: "December 31, 2025",
    title: "Global Animations",
    description: [
      "Interactions: Global button animations (hover scale, tap effect) now applied to all cards, navigation, and menu items.",
    ]
  },
  {
    version: "Beta 3.8.4",
    date: "December 31, 2025",
    title: "Mobile UI Fixes",
    description: [
      "Resolved an issue where timeline cards were truncated on smaller mobile screens.",
    ]
  },
  {
    version: "Beta 3.8.3",
    date: "December 31, 2025",
    title: "UX Refinements & Fixes",
    description: [
      "Navigation: Added 'About' and ensured 'Dashboard' are always visible in the mobile menu.",
      "Safety: Added confirmation dialogs when deleting food or symptom entries to prevent accidental loss.",
      "Branding: Fixed issue where default favicon might show instead of the app logo.",
    ]
  },
  {
    version: "Beta 3.8.2",
    date: "December 31, 2025",
    title: "Trends & Fitbit Enhancements",
    description: [
      "Trends: Body Weight graph now features dual axes to clearly show Weight vs. Fat Mass.",
      "Trends: Extended Fitbit data synchronization history from 30 days to 1 year.",
      "Visuals: Adjusted Body Weight graph colors for better consistency with safety charts.",
    ]
  },
  {
    version: "Beta 3.8.1",
    date: "December 30, 2025",
    title: "The Dashboard Update",
    description: [
      "Dashboard 2.0: A completely new Nutrition Overview section displaying real-time calorie and macro progress.",
      "Date Navigation: Navigate back in time to view your macros and micronutrients for any past date.",
      "Timeline Refinements: Cleaner layout with macros in the header; empty days are now automatically hidden.",
      "Fitbit Integration 2.0: Improved auto-sync reliability and added manual sync triggers.",
      "UI Polish: Premium watermark icons for macro cards and consistent badge styling.",
    ]
  },
  {
    version: "Beta 3.7.1",
    date: "July 16, 2025",
    title: "Terms of Use Page & Menu Link",
    description: [
      "Added a new 'Terms of Use' page with zero-liability disclaimers.",
      "Included a link to the new Terms page in the user profile dropdown menu.",
      "Corrected the previous version number in the release notes.",
    ]
  },
  {
    version: "Beta 3.7.0",
    date: "July 16, 2025",
    title: "Dashboard UX Enhancements & Fixes",
    description: [
      "Added a Floating Action Button (FAB) to the main dashboard sheet for quick logging.",
      "Resolved a critical bug that prevented the dashboard timeline from being scrollable.",
      "Fixed a layout issue where the FAB was not visible.",
      "Grouped timeline entries by date for a more organized view.",
    ],
  },
  {
    version: "Beta 3.6.11",
    date: "June 13, 2025",
    title: "Stability & Bug Fixes",
    description: [
      "Resolved a WebSocket connection issue to improve hot-reloading in development.",
      "Fixed an issue preventing the guest user pop-up from closing correctly on mobile.",
      "Addressed various font loading and image serving errors in the dev environment.",
    ],
  },
  {
    version: "Beta 3.6.10",
    date: "June 13, 2025",
    title: "Favorites",
    description: [
      "Implemented the Favorites function",

    ],
  },
  {
    version: "Beta 3.6.9",
    date: "June 12, 2025",
    title: "Food Item Favoriting Feature & Micros enhancements",
    description: [
      "Enhanced the accuracy of micros tracking.",
      "Added a 'heart' icon to food cards allowing users to mark items as favorites.",
      "Added a 'Favorites' link to the navbar (functionality to view favorites list is upcoming).",
    ],
  },
  {
    version: "Beta 3.6.8",
    date: "June 11, 2025",
    title: "Landing Page UI Enhancements",
    description: [
      "Applied multi-color gradient text to various headings on the landing page for a more vibrant look.",
      "Updated guest homepage hero buttons with a consistent multi-color gradient background and refined hover/focus styles.",
    ],
  },
  {
    version: "Beta 3.6.7",
    date: "June 11, 2025",
    title: "Timeline Card Header Styling Enhancement",
    description: [
      "Updated the timeline food card headers to use the primary theme color for the background.",
      "Adjusted icon and text colors within the header for optimal contrast and readability.",
    ],
  },
  {
    version: "Beta 3.6.6",
    date: "June 11, 2025",
    title: "App Audit & Timestamp Fixes",
    description: [
      "Timestamp Control: Implemented precise date AND time selection for all food logging and editing actions.",
      "Audit Fix - Consistent Editing: Standardized editing dialogs; AI-processed items (text/photo) now consistently use the appropriate dialog for re-analysis or detail adjustment.",
      "Audit Fix - AI Model Stability: Resolved AI model access errors by defaulting to stable models and improving error messages for 'model not found' scenarios.",
      "Audit Fix - Firestore Compatibility: Ensured data integrity by converting potentially 'undefined' values to 'null' before saving to Firestore.",
    ],
  },
  {
    version: "Beta 3.6.5",
    date: "June 10, 2025",
    title: "Cookie Policy Update",
    description: [
      "Updated the 'Cookies and Tracking Technologies' section of the Privacy Policy to accurately reflect current cookie usage (Firebase Authentication for sessions, localStorage for theme/consent preferences), explicitly noting the absence of third-party advertising cookies.",
    ],
  },
  {
    version: "Beta 3.6.4",
    date: "June 10, 2025",
    title: "Enhanced Data Security Information",
    description: [
      "Added a comprehensive 'Data Security' section to the landing page (visible to both guest and logged-in users), detailing key security measures like reCAPTCHA, Google Authentication, SSL, AppCheck, Premium DNS, and Firestore Security Rules.",
      "Expanded the 'Data Security' information within the Privacy Notice page to provide more formal and detailed explanations of these measures.",
    ],
  },
  {
    version: "Beta 3.6.3",
    date: "June 09, 2025",
    title: "AI Meal Interpretation & Branded Item Accuracy",
    description: [
      "Improved AI text logging to correctly interpret standard meal descriptions (e.g., 'Sausage McMuffin with hashbrown') as a single serving, not 1.5 servings.",
      "Enhanced AI to avoid duplicating components already implied in a meal's name (e.g., not adding an 'extra egg' to 'Egg McMuffin' unless specified by the user).",
      "Refined AI prompt for `processMealDescriptionFlow` to accurately preserve all user-stated quantities and explicit additions (like 'extra egg') in the `primaryFoodItemForAnalysis` field.",
      "Strengthened AI prompt for `analyzeFoodItemFlow` by embedding nutritional examples for common branded items (e.g., specific McDonald's items) to improve the accuracy of macro and calorie estimations for those items.",
    ],
  },
  {
    version: "Beta 3.6.2",
    date: "June 08, 2025",
    title: "AI Logging Accuracy Enhancements",
    description: [
      "Improved accuracy for image-based food identification, including better portion estimation (e.g., counting eggs) and more general naming for ambiguous cooking methods.",
      "Enhanced nutritional analysis (macros & micronutrients) for text-based food logging, ensuring quantities in descriptions (e.g., '4 eggs') are better accounted for.",
      "Corrected a minor import path in an AI development utility file.",
    ],
  },
  {
    version: "Beta 3.6.1",
    date: "June 08, 2025",
    title: "AI Consistency & Date Logging Fixes",
    description: [
      "Improved consistency of AI meal analysis results by setting a lower temperature (0.2 or 0.5 as appropriate) for relevant AI flows, reducing variability for identical inputs.",
      "Fixed a bug where logging meals for a previous date was incorrectly using the current date due to premature state reset in the 'Log Previous Meal' dialog.",
    ],
  },
  {
    version: "Beta 3.6.0",
    date: "June 08, 2025",
    title: "Landing Page Overhaul & UI Refinements",
    description: [
      "Centralized landing page content: now shared between guest and logged-in user views with view-specific CTAs and messages.",
      "Updated guest view: Hero section now features 'Quick-Check Your Meal' and 'Join the Beta' buttons side-by-side.",
      "Guest view final CTA updated to a heartwarming invitation to join the beta program.",
      "Implemented CSS-based reveal animations for cards on the landing page for a more dynamic experience.",
      "Corrected app name to 'GutCheck' on the sign-up page.",
      "Adjusted spacing and alignment of elements on the landing page for improved visual flow in user view.",
    ],
  },
  {
    version: "Beta 3.5.9",
    date: "June 08, 2025",
    title: "Landing Page Content Update",
    description: [
      "Created content for the landing page in the User view.",
    ],
  },
  {
    version: "Beta 3.5.8",
    date: "June 08, 2025",
    title: "Navbar, Guest View & Auth Page UI Polish",
    description: [
      "Enhanced Navbar icon hover states for visual consistency with the 'Plus' button.",
      "Updated Guest View Navbar to hide the logo and adjust app name alignment.",
      "Overhauled the main action button on the Guest Homepage: text 'Quick-Check Your Meal' now wraps around the logo inside the button, improved floating effect with drop-shadow, and enhanced button aesthetics.",
      "Refined Login/Signup pages: updated 'Welcome' message, standardized Google Sign-In button size, and added a 'Back' button to the Login page.",
      "Made app version and release notes visible in Guest View Navbar.",
      "Adjusted icon sizes and layout in PremiumDashboardSheet header for micronutrients.",
      "Standardized label typography in SymptomLoggingDialog and icon sizes in various timeline card indicators (GI, Fiber, Allergens).",
    ],
  },
  {
    version: "Beta 3.5.7",
    date: "June 07, 2025",
    title: "UI Refinement & Consistency Pass",
    description: [
      "Implemented a new brand-aligned color scheme (soft blues, pale violet accents) for a more polished and user-friendly interface.",
      "Standardized button styles and sizes across dialogs and authentication forms for improved consistency.",
      "Enhanced Navbar logo display with a consistent themed background and increased size for better visibility.",
      "Refined padding and typography in key components like timeline cards for a cleaner layout.",
      "Removed unused UI elements and ad placeholders from dialogs.",
    ],
  },
  {
    version: "Beta 3.5.6",
    date: "June 07, 2025",
    title: "Enhanced App Aesthetics & Branding",
    description: "Implemented a new color scheme (whites, grays, themed green accent) for a more polished and user-friendly interface. Theme management now focuses on light/dark modes of this new branded look.",
  },
  {
    version: "Beta 3.5.5",
    date: "June 07, 2025",
    title: "Privacy Notice Page",
    description: [
      "Added a new Privacy Notice page accessible from the user dropdown menu.",
      "Updated app version to Beta 3.5.5.",
    ],
  },
  {
    version: "Beta 3.5.4",
    date: "June 06, 2025",
    title: "Improved Supplement Photo ID",
    description: [
      "Enhanced the 'Identify Food by Photo' feature to more accurately capture specific nutrient quantities (e.g., 'Vitamin D3 50,000 IU') when OCR'd from supplement labels.",
      "This ensures precise data from labels is passed to the main food analysis flow.",
    ],
  },
  {
    version: "Beta 3.5.3",
    date: "June 06, 2025",
    title: "AI Micronutrient Handling Improvements",
    description: [
      "Further refined AI prompt instructions to more accurately process and record user-provided specific micronutrient quantities for text-based food logging.",
      "Aimed to prevent the AI from substituting or ignoring explicit dosage information provided by the user.",
    ],
  },
  {
    version: "Beta 3.5.2",
    date: "June 06, 2025",
    title: "Food Card Enhancements & Indicator Reordering",
    description: [
      "Enhanced AI notes in food cards to include summaries for micronutrients and GI.",
      "Added highlighting for common allergens in food cards.",
      "Introduced a new 'Keto Friendliness' indicator badge.",
      "Reordered indicator badges on food cards: Micronutrients, Fiber, GI, Keto Score, FODMAP, Gut Impact, Allergens.",
      "Moved the main FODMAP risk indicator from card header to the content area with other badges.",
    ],
  },
  {
    version: "Beta 3.5.1",
    date: "June 06, 2025",
    title: "Release Notes Feature & Admin Button",
    description: [
      "Made the app version in the navbar clickable.",
      "Clicking the version now displays this release notes dialog.",
      "Added 'Return to Dashboard' button on Admin page.",
      "Updated various UI elements and fixed minor bugs.",
    ],
  },
  {
    version: "Beta 3.5.0",
    date: "June 05, 2024",
    title: "Admin Panel & UI Enhancements",
    description: "Iterative fixes for admin panel permissions. General UI polish.",
  },
  {
    version: "Beta 3.4.0",
    date: "June 04, 2024",
    title: "Rule Refinements",
    description: "Refined Firestore security rules for better access control.",
  },
];


interface NavbarProps {
  isGuest?: boolean;
  onOpenDashboardClick?: () => void;
  onLogFoodAIClick?: () => void;
  onIdentifyByPhotoClick?: () => void;
  onLogSymptomsClick?: () => void;
  onLogPreviousMealClick?: () => void;
}

const LOCALSTORAGE_LAST_SEEN_VERSION_KEY = 'lastSeenAppVersion';

export default function Navbar({
  isGuest,
  onOpenDashboardClick,
  onLogFoodAIClick,
  onIdentifyByPhotoClick,
  onLogSymptomsClick,
  onLogPreviousMealClick,
}: NavbarProps) {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
  const [isReleaseNotesOpen, setIsReleaseNotesOpen] = useState(false);
  const [showNewReleaseIndicator, setShowNewReleaseIndicator] = useState(false);
  const [isActionPopoverOpen, setIsActionPopoverOpen] = useState(false);

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

  // Admin Notification: Check for new feedback
  const [hasNewFeedback, setHasNewFeedback] = useState(false);
  useEffect(() => {
    const checkNewFeedback = async () => {
      if (!isCurrentUserAdmin) return;
      try {
        const q = query(
          collection(db, 'feedbackSubmissions'),
          where('status', '==', 'new'),
          limit(1)
        );
        const snapshot = await getDocs(q);
        setHasNewFeedback(!snapshot.empty);
      } catch (error) {
        console.error("Error checking for new feedback:", error);
      }
    };

    if (isCurrentUserAdmin) {
      checkNewFeedback();
    }
  }, [isCurrentUserAdmin]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const lastSeenVersion = localStorage.getItem(LOCALSTORAGE_LAST_SEEN_VERSION_KEY);
      if (lastSeenVersion !== APP_VERSION) {
        setShowNewReleaseIndicator(true);
      }
    }
  }, []);


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

  const micronutrientsLinkHandler = (e?: React.MouseEvent) => {
    e?.preventDefault();
    router.push(pathname === '/micronutrients' ? '/?openDashboard=true' : '/micronutrients');
  };

  const aiInsightsLinkHandler = (e?: React.MouseEvent) => {
    e?.preventDefault();
    router.push(pathname === '/ai-insights' ? '/?openDashboard=true' : '/ai-insights');
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

  const headerBaseClasses = "z-50 w-full transition-all duration-300";
  const headerClasses = cn(
    headerBaseClasses,
    isGuest
      ? "absolute top-0 bg-transparent border-none py-2"
      : "sticky top-0 bg-card text-card-foreground border-b border-border"
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
    <header className={headerClasses}>
      <div className={cn("flex h-16 w-full items-center justify-between", "px-2 sm:px-4")}>
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Link href="/" className="flex items-center space-x-2">
            {!isGuest && (
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-full border-2 p-1", "bg-primary border-primary")}>
                <Image src="/Gutcheck_logo.png" alt="GutCheck Logo" width={39} height={39} className="object-contain filter brightness-0 invert" priority />
              </div>
            )}
            {!isGuest && (
              <span className={cn(appNameBaseClasses, 'text-current', 'sm:inline-block')}>{APP_NAME}</span>
            )}
          </Link>
          <Dialog open={isReleaseNotesOpen} onOpenChange={handleReleaseNotesToggle}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "text-xs p-1 h-auto ml-0 mt-1 rounded-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 relative",
                  "text-primary underline underline-offset-2",
                  "hover:bg-transparent hover:text-primary/80"
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


        <div className={cn("flex items-center", "space-x-0.5 sm:space-x-1")}>
          {isGuest ? (
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Show Log Out if user is authenticated but on guest view */}
              {authUser && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={handleSignOut} aria-label="Log out">
                  <LogOut className="h-5 w-5" />
                </Button>
              )}

              <Button
                onClick={() => router.push('/login')}
                className={cn(
                  "hidden sm:flex h-9 px-3 sm:px-4 text-xs sm:text-sm", // Hidden on mobile
                  "bg-primary text-primary-foreground hover:bg-primary/90"
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
                    <Button variant="ghost" size="icon" className={cn("h-8 w-8 focus-visible:ring-0 focus-visible:ring-offset-0", pathname === '/' ? 'bg-primary/10 text-primary' : 'text-current hover:text-primary hover:bg-primary/10')} aria-label="Dashboard" onClick={dashboardLinkHandler}>
                      <LayoutGrid className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className={cn("h-8 w-8 focus-visible:ring-0 focus-visible:ring-offset-0", pathname === '/favorites' ? 'bg-primary/10 text-primary' : 'text-current hover:text-primary hover:bg-primary/10')} aria-label="Favorites" onClick={favoritesLinkHandler}>
                      <Heart className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className={cn("h-8 w-8 focus-visible:ring-0 focus-visible:ring-offset-0", pathname === '/trends' ? 'bg-primary/10 text-primary' : 'text-current hover:text-primary hover:bg-primary/10')} aria-label="Trends" onClick={trendsLinkHandler}>
                      <BarChart3 className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className={cn("h-8 w-8 focus-visible:ring-0 focus-visible:ring-offset-0", pathname === '/micronutrients' ? 'bg-primary/10 text-primary' : 'text-current hover:text-primary hover:bg-primary/10')} aria-label="Micronutrients Progress" onClick={micronutrientsLinkHandler}>
                      <Atom className="h-5 w-5" />
                    </Button>
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-8 w-8 focus-visible:ring-0 focus-visible:ring-offset-0", pathname === '/ai-insights' ? 'bg-primary/10 text-primary' : 'text-current hover:text-primary hover:bg-primary/10')}
                        aria-label="AI Insights"
                        onClick={aiInsightsLinkHandler}
                      >
                        <Lightbulb className="h-5 w-5" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="icon" className={cn("h-8 w-8 focus-visible:ring-0 focus-visible:ring-offset-0", pathname === '/about' ? 'bg-primary/10 text-primary' : 'text-current hover:text-primary hover:bg-primary/10')} aria-label="About" onClick={aboutLinkHandler}>
                      <Info className="h-5 w-5" />
                    </Button>
                  </>
                )}

                <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="h-8 w-8 text-current hover:text-primary hover:bg-primary/10" aria-label="Toggle dark mode">
                  {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>

                {!authLoading && authUser && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className={cn("relative h-9 w-9 rounded-full border-2 border-current p-0 hover:bg-primary/10 hover:text-primary hover:border-primary")}>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={authUser.photoURL || undefined} alt={authUser.displayName || 'User'} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {getInitials(authUser.displayName)}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none text-foreground">{authUser.displayName || 'User'}</p>
                          <p className="text-xs leading-none text-muted-foreground">{authUser.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {isCurrentUserAdmin && (
                        <DropdownMenuItem onClick={() => router.push('/admin/feedback')} className="cursor-pointer flex justify-between items-center">
                          <div className="flex items-center">
                            <AdminIcon className="mr-2 h-4 w-4" />
                            <span>Admin Dashboard</span>
                          </div>
                          {hasNewFeedback && (
                            <span className="h-2 w-2 rounded-full bg-red-500 mr-2" />
                          )}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>User Center</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push('/privacy')} className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Privacy Notice</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push('/terms')} className="cursor-pointer">
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Terms of Use</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {!authLoading && authUser && (
                <div className="md:hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-current hover:text-primary hover:bg-primary/10"
                    aria-label="Open menu"
                    onClick={() => setIsMobileMenuOpen(true)}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

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
              initial={{ y: "-100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 right-0 max-h-[85vh] h-auto bg-background border-b border-border z-50 flex flex-col shadow-2xl overflow-hidden rounded-b-xl"
            >
              <div className="p-4 flex items-center justify-between border-b border-border bg-muted/20">
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
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
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
                  { icon: Atom, label: "Micronutrients", onClick: () => { setIsMobileMenuOpen(false); micronutrientsLinkHandler(); } },
                  { icon: Lightbulb, label: "AI Insights", onClick: () => { setIsMobileMenuOpen(false); aiInsightsLinkHandler(); } },
                  { icon: User, label: "User Center", onClick: () => { setIsMobileMenuOpen(false); router.push('/profile'); } },
                  { icon: Shield, label: "Privacy Notice", onClick: () => { setIsMobileMenuOpen(false); router.push('/privacy'); } },
                  { icon: FileText, label: "Terms of Use", onClick: () => { setIsMobileMenuOpen(false); router.push('/terms'); } },
                  { icon: Info, label: "About", onClick: () => { setIsMobileMenuOpen(false); aboutLinkHandler(); } },
                  ].map((item, idx) => (
                    <motion.div key={idx} variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}>
                      <Button variant="ghost" className="w-full justify-start text-base h-12" onClick={item.onClick}>
                        <item.icon className="mr-3 h-5 w-5 text-muted-foreground" /> {item.label}
                      </Button>
                    </motion.div>
                  ))}

                  <div className="my-2 border-t border-border/50" />

                  <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}>
                    <Button variant="ghost" className="w-full justify-start text-base h-12" onClick={toggleDarkMode}>
                      {isDarkMode ? <Sun className="mr-3 h-5 w-5" /> : <Moon className="mr-3 h-5 w-5" />} Toggle Theme
                    </Button>
                  </motion.div>

                  {isCurrentUserAdmin && (
                    <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}>
                      <Button variant="ghost" className="w-full justify-between text-base h-12 pr-4" onClick={() => { setIsMobileMenuOpen(false); router.push('/admin/feedback'); }}>
                        <div className="flex items-center">
                          <AdminIcon className="mr-3 h-5 w-5" /> Admin Dashboard
                        </div>
                        {hasNewFeedback && (
                          <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                        )}
                      </Button>
                    </motion.div>
                  )}

                  <div className="my-2 border-t border-border/50" />

                  <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}>
                    <Button variant="ghost" className="w-full justify-start text-base h-12 text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={handleSignOut}>
                      <LogOut className="mr-3 h-5 w-5" /> Log out
                    </Button>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {!authLoading && authUser && !isGuest && (
        <BottomActionBar>
          <FeedbackWidget />
          <FloatingActionMenu
            onLogFoodAIClick={() => handleGenericActionItemClick(onLogFoodAIClick, 'logFoodAI')}
            onScanBarcodeClick={() => handleGenericActionItemClick(onIdentifyByPhotoClick, 'logPhoto')}
            onLogSymptomsClick={() => handleGenericActionItemClick(onLogSymptomsClick, 'logSymptoms')}
            onAddManualEntryClick={() => handleGenericActionItemClick(onLogPreviousMealClick, 'logPrevious')}
          />
        </BottomActionBar>
      )}
    </header>
  );
}

