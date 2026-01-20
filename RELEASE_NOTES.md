# Release Notes

## Beta 5.0.1 (Jan 20, 2026)
-   **Liquid Glass UI:** A completely redesigned interface featuring our signature frosted glass aesthetic, smooth animations, and a modern dark mode.
-   **Navigation 2.0:** New side-drawer menu and unified navigation structure for easier access to everything.
-   **Dashboard Reimagined:** Interactive timeline with flying cards, parallax headers, and live health vitals.
-   **Feedback 2.0:** New interactive feedback system with ratings and motion-controlled input.

## Beta 4.5.3 (Jan 15, 2026)
-   **Precision Steps:** Implemented a smart deduplication algorithm for Apple Health. The app now intelligently merges steps from your iPhone and Apple Watch to prevent double-counting.
-   **Auto-Sync:** Fixed an issue where steps wouldn't load immediately on app launch.

## Beta 4.5.2 (Jan 15, 2026)
-   **Step Counter:** Added a minimalist step counter card to the Dashboard (with improved Apple Health icons).
-   **Seamless Sync:** Apple Health now allows background refreshing; data syncs automatically when you resume the app.
-   **UI Polish:** Updated "Connected Apps" with official brand logos and clearer "Active" states (Green toggles).

## Beta 4.5.1 (Jan 14, 2026)
-   **Native Authorization:** Implemented "Hybrid" auth strategy. iOS app now uses `ASWebAuthenticationSession` (Secure System Modal) for Fitbit and Native SDK for Google Sign-In, eliminating the annoying Safari context switch. Web version remains unchanged.

## Beta 4.5.0 (Jan 14, 2026)
-   **Apple Health Reborn:** Rebuilt the Apple Health integration from scratch using the robust CapGo engine. This update resolves all previous "not implemented" errors.

## Beta 4.4.4 (Jan 14, 2026)
-   **Migration Fix:** Migrated to a more stable health plugin to resolve installation issues on iOS.

## Beta 4.4.3 (Jan 14, 2026)
-   **Sync Fix:** Fixed a crash when syncing with Apple Health on some devices.

## Beta 4.4.2 (Jan 14, 2026)
-   **Activity Sync:** Added native support for Apple Health to sync daily steps.
-   **New Feature:** You can now connect Apple Health directly from the Trends dashboard.

## Beta 4.4.1 (Jan 14, 2026)
-   **Insights Fix:** Resolved a crash caused by duplicate code.
-   **Stability:** Fixed a schema validation error preventing the AI from processing some food logs.
-   **UI Polish:** Removed the brain icon and updated the check-in text for a friendlier experience.

## Beta 4.4.0 (Jan 14, 2026)
-   **Instant Launch:** The app now opens instantly with zero lag or white screen delay.
-   **Native Feel:** Fixed the 'app freeze' issue when switching back to GutCheck.
-   **Typing Fixed:** Inputs no longer annoyingly 'zoom in' when you tap them on iPhone.
-   **Polish:** Smoother menu interactions, better keyboard handling for feedback, and updated dialogs.


## Beta 4.3.5 (Jan 12, 2026)
-   **Landing Page Polish:** Restored scroll snapping and animations; fixed Login button fade behavior.
-   **Walkthrough:** Added a new final step with a video welcome avatar.
-   **Security Section:** Fixed layout issue where content was cut off.
-   **UI:** Version indicator now fades out on scroll.

## Beta 4.3.4 (Jan 12, 2026)
-   **App Tour:** New walkthrough step for Navigation & Insights.
-   **Fasting:** Corrected logic to prevent "Fast Started" alerts immediately after eating (2-hour minimum).
-   **Consistency:** AI now analyzes your last 7 days to praise consistent intermittent fasting streaks.

## Beta 4.3.3 (Jan 12, 2026)
-   **Fix:** Resolved a critical issue with Google Sign-In redirects on new devices (preventing silent failures).

## Beta 4.3.2 (Jan 11, 2026)
-   **Smart Fasting:** Items under 5 calories (coffee, water, tea) no longer break your fast.
-   **AI Intelligence:** Your "Time Since Last Meal" calculation now respects this threshold.

## Beta 4.3.0 (Jan 10, 2026)
-   **Visualized Macros:** The Daily Macros chart is now a stacked bar chart with Gram/% toggles and filters.
-   **Calorie Intelligence:** New Daily Calorie Histogram (with over-limit warnings).
-   **Trend Analysis:** Added Net Calories (In vs Out) to the Calorie chart.
-   **Smarter AI:** The Dietitian now knows your literal TDEE balance (surplus/deficit) and gives specific advice based on your trends.

## Beta 4.2.0
-   **New App Icon**: A fresh look for your home screen.
-   **Data Export**: You can now export your complete food and health history as a JSON file. Use it for backups or your own analysis.
-   **Privacy Updates**: Updated Terms & Privacy Policy to reflect data ownership.
-   **Fixes**: Resolved a build error affecting Android deployments.

## Beta 3.10.5
-   **New Year, New Logo**: Updated splash screen and branding.
-   **Dietary Preferences**: Added support for specific diets (Keto, Vegan, etc.) in user profile.
-   **AI Tweaks**: Improved response timing for food logging feedback.

## Beta 3.9.19
-   **Fix**: Corrected daily macro target synchronization between profile and dashboard.
-   **Fix**: Timeline entries now display correctly after recent UI updates.

## Beta 3.9.18
-   **Fix**: Trends graphs now correctly include early morning data from the first day of the selected range (7D/30D/90D).

## Beta 3.9.16
-   **Performance**: Optimized initial load time for large food logs.

## Beta 3.9.14
-   **Feature**: Added "Quick Add" shortcut to the main fab button.
