export interface ReleaseNote {
    version: string;
    date?: string; // Keep optional for older entries
    title?: string; // Keep optional for older entries
    description: string | string[]; // Keep union type for older entries
    features?: string[]; // Add optional for new structure
    improvements?: string[]; // Add optional for new structure
    fixes?: string[]; // Add optional for new structure
}

export const APP_VERSION = "5.1.4";

export const releaseNotesData: ReleaseNote[] = [
    {
        version: '5.1.4',
        date: 'January 25, 2026',
        title: 'Connection Stability',
        description: 'Fixed a critical connectivity issue affecting the iOS app in Testflight.',
        features: [],
        improvements: [],
        fixes: [
            'Connectivity: Resolved "transport errored" issues by enforcing long-polling for database connections.',
        ]
    },
    {
        version: '5.1.3',
        date: 'January 25, 2026',
        title: 'App Tour Polish',
        description: 'Fixed an issue where menu items were still clickable during the App Tour.',
        features: [],
        improvements: [],
        fixes: [
            'App Tour: The logic to lock menu items during the tour has been hardened.',
            'Z-Index: Adjusted overlay layers to ensure the tour highlights are always on top.'
        ]
    },
    {
        version: '5.1.2',
        date: 'January 25, 2026',
        title: 'Acquisition & Admin Update',
        description: 'Complete rollout of the Acquisition Dashboard, Admin Portal navigation fixes, and improved Apple Health historical syncing.',
        features: [
            'Admin Portal: Direct links to the new Acquisition Dashboard.',
            'Apple Health: Enhanced permission requests and historical data sync.',
            'App Tour: Fixed menu locking during the tour.'
        ],
        improvements: [
            'Performance: Faster video loading on the About page.',
        ],
        fixes: [
            'Fixed critical deployment issue where features were missing from v5.1.1.'
        ]
    },
    {
        version: '5.1.1',
        date: 'January 25, 2026',
        title: 'Instant Speed Updates',
        description: 'We\'ve supercharged the app responsiveness. Reusing meals is now instant, and videos/images load without delay.',
        features: [
            'Optimistic Meal Reuse: "Reuse Meal" now logs instantly while the analysis refines in the background.',
            'Instant Media: Coach videos and food photos now load immediately for a snappier feel.',
        ],
        improvements: [
            'General performance polish across the dashboard.',
        ],
        fixes: []
    },
    {
        version: '5.1.0',
        date: 'January 23, 2026',
        title: 'Interactive Health Updates',
        description: 'Major enhancements to the Vitals logger, smoother animations, and critical fixes for the app tour.',
        features: [
            'Editable Vitals: You can now tap on Weight and Step cards to manually edit your daily logs via a new, beautiful dialog.',
            'Match Vitals UI: The Vitals logger now shares the same premium "frosted glass" design as the food logger.',
        ],
        improvements: [
            'Animation Polish: Added a smooth entry animation to the Back button on the About page.',
        ],
        fixes: [
            'Tour Loop Fixed: Resolved a bug where the App Tour would incorrectly restart after completion.',
            'Stability: Improved server response times and build stability.'
        ]
    },
    {
        version: '5.0.5',
        date: 'January 22, 2026',
        title: 'Polished & Precise',
        description: 'A major visual refinement update focusing on a cleaner, borderless UI and smarter AI insights, plus a critical fix for Google Sign-In on iOS.',
        features: [
            'New "Pulse Orb" loading animation for a smoother app start.',
            'Borderless "Liquid Glass" UI for all feedback and navigation menus.',
            'Native Google Sign-In: iOS and Android now use native authentication (no browser redirect).',
        ],
        improvements: [
            'Feedback form now shows a "Scroll For More" hint.',
            'Enhanced scrollability for long food details (ingredients/macros).',
            'Removed visual clutter (borders/highlights) from Feedback options.',
            'Platform-aware authentication ensures the best sign-in experience on every device.',
        ],
        fixes: [
            'Fixed persistent issue where iOS users were redirected to Safari for Google authentication but couldn\'t return to the app. Now uses native iOS Google Sign-In SDK.',
            'Fixed AI falsely reporting positive Activity-Appetite correlation.',
            'Fixed Navigation highlight jumping away from "Explore" when viewing Release Notes.',
            'Resolved overlap issues with feedback scroll indicators.',
        ]
    },
    {
        version: "Beta 5.0.3",
        date: "Jan 20, 2026",
        title: "Critical Hotfix & Native Google Auth",
        description: [
            "CRITICAL: Restored AI Model to Gemini 2.0 Flash (Fixed analysis failure).",
            "Native Google Sign-In: Improved iOS sign-in experience (no longer opens Safari).",
            "Fixed various build and deployment issues."
        ]
    },
    {
        version: "Beta 5.0.1",
        date: "Jan 20, 2026",
        title: "Liquid Glass UI & Core Overhaul",
        description: [
            "Liquid Glass UI: A completely redesigned interface featuring our signature frosted glass aesthetic, smooth animations, and a modern dark mode.",
            "Navigation 2.0: New side-drawer menu and unified navigation structure for easier access to everything.",
            "Dashboard Reimagined: Interactive timeline with flying cards, parallax headers, and live health vitals.",
            "Feedback 2.0: New interactive feedback system with ratings and motion-controlled input."
        ]
    },
    {
        version: "Beta 4.5.3",
        date: "Jan 15, 2026",
        title: "Precision Steps",
        description: "Fixed double-counting issues by intelligently merging Apple Watch and iPhone step data."
    },
    {
        version: "Beta 4.5.2",
        date: "Jan 15, 2026",
        title: "Seamless Health",
        description: [
            "Step Counter: Added a minimalist step counter to the Dashboard.",
            "Seamless Sync: Enabled background refresh for Apple Health when resuming the app.",
            "Brand Logos: Updated icons and toggles for a more polished User Center."
        ]
    },
    {
        version: "Beta 4.5.1",
        date: "Jan 14, 2026",
        title: "Native Authorization Engine",
        description: [
            "Hybrid Architecture: Rebuilt Google and Fitbit login flows to be platform-aware.",
            "No More Safari Redirects: Native iOS app now uses system dialogs and in-app browsers for a seamless login experience.",
            "Web Safe: Fully preserved web functionality while upgrading the native experience."
        ]
    },
    {
        version: "Beta 4.5.0",
        date: "Jan 14, 2026",
        title: "Apple Health Reborn",
        description: "Rebuilt the Apple Health integration from scratch for rock-solid stability. This is a fresh start for syncing."
    },
    {
        version: "Beta 4.4.4",
        date: "Jan 14, 2026",
        title: "Migration Fix",
        description: "Migrated to a more stable health plugin to resolve installation issues on iOS."
    },
    {
        version: "Beta 4.4.3",
        date: "Jan 14, 2026",
        title: "Sync Fix",
        description: "Fixed a crash when syncing with Apple Health on some devices."
    },
    {
        version: "Beta 4.4.2",
        date: "Jan 14, 2026",
        title: "Apple Health Integration",
        description: [
            "Activity Sync: Added native support for Apple Health to sync daily steps.",
            "New Feature: You can now connect Apple Health directly from the Trends dashboard."
        ]
    },
    {
        version: "Beta 4.4.1",
        date: "Jan 14, 2026",
        title: "Insights & UI Polish",
        description: [
            "Insights Fix: Resolved a crash caused by duplicate code.",
            "Stability: Fixed a schema validation error preventing the AI from processing some food logs.",
            "UI Polish: Removed the brain icon and updated the check-in text for a friendlier experience."
        ]
    },
    {
        version: "Beta 4.4.0",
        date: "Jan 14, 2026",
        title: "iOS Perfection & Performance",
        description: [
            "Instant Launch: The app now opens instantly with zero lag or white screen delay.",
            "Native Feel: Fixed the 'app freeze' issue when switching back to GutCheck.",
            "Typing Fixed: Inputs no longer annoyingly 'zoom in' when you tap them on iPhone.",
            "Polish: Smoother menu interactions, better keyboard handling for feedback, and updated dialogs."
        ]
    },
    {
        version: "Beta 4.3.5",
        date: "Jan 12, 2026",
        title: "Landing Page & Walkthrough Polish",
        description: [
            "Landing Page: Restored smooth scroll snapping and animations.",
            "UI: Login and Version buttons now elegantly fade out on scroll.",
            "Walkthrough: New 'Grand Finale' step with a video avatar to welcome you properly.",
            "Security: Fixed layout issues in the About section."
        ]
    },
    {
        version: "Beta 4.3.4",
        date: "Jan 12, 2026",
        title: "Tour & Fasting Insights",
        description: [
            "App Tour: Added a new 'Navigation & Insights' step to help you get around the dashboard.",
            "Fasting Logic: Improved the 'Fasting Status' check to prevent false positives right after a meal.",
            "Smart Trends: The AI now praises your consistency when you hit extended fasting windows (14+ hours) over the last week!"
        ]
    },
    {
        version: "Beta 4.3.3",
        date: "Jan 12, 2026",
        title: "Authentication Improvements",
        description: "Fixed an issue where Google Sign-In could fail silently on some new devices.",
    },
    {
        version: "Beta 4.3.2",
        date: "Jan 11, 2026",
        title: "Fasting Friendlier",
        description: [
            "Smart Fasting: The system now rightly ignores negligible calorie items (like black coffee, water, or supplements < 5kcal) when calculating your fasting timer. Your morning brew no longer resets your fast!"
        ]
    },
    {
        version: "Beta 4.3.1",
        date: "Jan 10, 2026",
        title: "Smarter Insights",
        description: [
            "Fasting Intel: The AI now knows exactly when your fasting window began and gives precise times for when you can break it.",
            "Fix: Resolved a logic error where the trends analysis was biased towards Fitbit data, ignoring Apple Health/Pedometer steps."
        ]
    },
    {
        version: "Beta 4.3.0",
        date: "Jan 10, 2026",
        title: "Enhanced Trends & Insightful AI",
        description: [
            "Visualized Macros: The Daily Macros chart is now a stacked bar chart with Gram/% toggles and filters, making it easier to see your nutrient breakdown.",
            "Calorie Intelligence: New Daily Calorie Histogram (with over-limit warnings) and a Cumulative Net Change chart to track your long-term deficit or surplus.",
            "Smarter Dietitian: Your Personal Dietitian now sees these long-term trends (Adherence, Cumulative Balance) to give you more relevant, big-picture advice."
        ]
    },
    {
        version: "Beta 4.2.0",
        date: "Jan 10, 2026",
        title: "Brand Refresh & Privacy Suite",
        description: [
            "New App Icon: Say hello to our new 'Happy Stomach' mascot! A fresh, modern look for your home screen.",
            "Data Export: You can now download a copy of your personal data (profile, timeline, feedback) directly from the User Center.",
            "Privacy First: Enhanced cookie consent and transparent analytics tracking to fully respect your privacy choices.",
            "Fixes: Resolved permissions issues with admin notifications and fixed cloud build dependency errors."
        ]
    },
    {
        version: "Beta 4.1.2",
        date: "Jan 09, 2026",
        title: "UI & Layout Polishing",
        description: [
            "Log Food Dialog: Fixed a layout issue where the Date and Time inputs were overflowing on mobile screens.",
            "Dietitian Page: Removed the floating action menu from the Personal Dietitian page for a cleaner experience.",
            "About Page: Implemented smooth Scroll Snapping and fixed visibility bugs where some sections appeared blank."
        ]
    },
    {
        version: "Beta 4.1.1",
        date: "Jan 09, 2026",
        title: "Polish & Experience Fixes",
        description: [
            "Setup Wizard UI: Fixed iOS layout issues (Date of Birth overflow) and resolved Dark Mode visibility problems in Diet & Goal selection steps.",
            "About Page: Refined text for clarity (simplified feature descriptions) and removed the floating action menu to ensure a focused reading experience.",
            "Public Assets: Updated manifest and public assets for better consistency.",
            "General: Ongoing UI polish and dark mode improvements across the app."
        ]
    },
    {
        version: "Beta 4.1.0",
        date: "Jan 09, 2026",
        title: "Major Redesign & Experience Update",
        description: [
            "New About & Guest Experience: Completely redesigned the About page and Guest Landing page with a modern, immersive layout featuring video backgrounds, specific 'Problem/Solution' storytelling, and a focused security carousel.",
            "Dashboard Animations: Timeline cards now dynamically 'fly in and snap' into place as you scroll, creating a more engaging and modern feed.",
            "Mobile Menu Upgrade: The main menu now slides in from the right as a full-height drawer, offering better accessibility and a cleaner look.",
            "Floating Actions: Floating buttons (logging, feedback) now intelligently hide when the mobile menu is open (or when you scroll to the bottom) to keep your view clear.",
            "Visual Refinements: Fixed scrolling overlaps, polished video integrations, and improved touch targets for mobile users."
        ]
    },
    {
        version: "Beta 4.0.4",
        date: "Jan 09, 2026",
        title: "Native iOS Dialogs",
        description: [
            "New Feature: Dialogs now use native iOS 'Page Sheet' animations, sliding up from the bottom with rounded corners.",
            "UI Update: Added native-style Circular Gray close buttons and action menus for a cleaner, familiar iOS feel."
        ]
    },
    {
        version: "Beta 4.0.3",
        date: "Jan 09, 2026",
        title: "Layout Fix (Metadata)",
        description: [
            "Layout: Fixed the root cause of the status bar overlap. The app now correctly recognizes the safe area inset on all iOS devices.",
            "Fix: Updated viewport metadata configuration."
        ]
    },
    {
        version: "Beta 4.0.2",
        date: "Jan 09, 2026",
        title: "Critical Layout Fix",
        description: [
            "Layout Fix: Applied a robust fix for the status bar overlap issue on iOS devices. The top menu now correctly respects the 'safe area' notch and dynamic island.",
            "Polish: Ensured the fix works consistently across different iOS versions."
        ]
    },
    {
        version: "Beta 4.0.1",
        date: "Jan 09, 2026",
        title: "Polish & Fixes",
        description: [
            "Native Feel: Implemented consistent 'press' animations for a more responsive, native-app experience across all buttons and cards.",
            "Layout Fix: Fixed an issue where the top menu bar overlapped with the status bar on notched iPhones.",
            "UX: Refined touch feedback on health indicators and food logging triggers."
        ]
    },
    {
        version: "Beta 4.0.0",
        date: "Jan 08, 2026",
        title: "Mobile Release & Native Feel",
        description: [
            "Mobile Launch: GutCheck is now fully optimized for the App Store and Google Play!",
            "Experience: Implemented native gestures, removed tap delays, and optimized scrolling for a buttery smooth app feel.",
            "Access: App users now have a streamlined login flow, skipping the web landing page."
        ]
    },
    {
        version: "Beta 3.10.6",
        date: "Jan 08, 2026",
        title: "Experience Polish",
        description: [
            "Smart Upgrade: Removed 'AI' branding in favor of 'System', 'Smart', and 'GutCheck Assistant' for a warmer experience.",
            "Insights Fixed: Your Personal Dietitian now knows your exact local time and uses precise daily totals for accurate advice.",
            "Visuals: The About page now features a cleaner look without the background video, improving readability."
        ]
    },
    {
        version: "Beta 3.10.5",
        date: "Jan 08, 2026",
        title: "Preferences & Polish",
        description: [
            "User Center: View and edit Dietary Preferences (Keto, Vegan, etc.).",
            "Smart Upgrade: System now calculates your Max Fasting Window for better Intermittent Fasting advice.",
            "Mobile: Fixed animated logo visibility on small screens.",
            "Visuals: Added a friendly avatar video greeting."
        ]
    },
    {
        version: "Beta 3.10.4",
        date: "Jan 08, 2026",
        title: "Your Personal Dietitian",
        description: [
            "Upgrade: Renamed to 'Your Personal Dietitian' with a smarter, goal-oriented brain.",
            "Smart Goals: The system now understands your specific goal (Weight Loss, Muscle Gain, etc.) and tailors advice accordingly.",
            "Trends Awareness: It now looks at your long-term trends to provide more meaningful 'Next Steps'.",
            "Context: Your Activity Level and BMR are now part of the system's analysis for hyper-personalized insights."
        ]
    },
    {
        version: "Beta 3.10.3",
        date: "Jan 08, 2026",
        title: "Polished Logging Experience",
        description: [
            "Favorites: Added 'Log from Favourites' for one-click re-logging.",
            "Visuals: Food cards now have jazzy background illustrations.",
            "Icons: Greatly expanded the food icon library.",
            "Fix: Aligned Symptoms card size with food cards."
        ]
    },
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
    }
];
