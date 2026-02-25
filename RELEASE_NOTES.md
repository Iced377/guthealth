# Release Notes

## v5.5.4 (February 25, 2026) - iOS Dashboard Performance Isolation
**Restored smooth iOS dashboard performance for large histories.**

### 🚀 Improvements
- **History Hydration Gate**: On iOS, full history hydration now waits until you open Trends, Insights, or Admin to keep the dashboard light.
- **Hero Controls**: Start/Login and Help buttons now stay above the hero background.
- **HealthKit Respect**: Apple Health hooks no longer run when integration is disabled.
- **Nav Stability**: Bottom nav stays available during auth hydration and keeps admin visibility consistent.
- **iOS Timeline Mode**: Dashboard stays on a light timeline; full history only loads when you visit Trends/Insights/Admin.
- **Nav Efficiency**: Favorites list is memoized to reduce unnecessary recomputes.

### 🐛 Bug Fixes
- **Dashboard Jank**: The dashboard timeline now caps render to recent entries on iOS, preventing slowdowns with long histories.

---

## v5.5.3 (February 25, 2026) - Apple Health Sync Throttle
**Reduced background load by throttling historical Apple Health syncs.**

### 🚀 Improvements
- **Sync Throttle**: Apple Health history sync now runs at most once per day per user.

### 🐛 Bug Fixes
- **Performance**: Reduced iOS dashboard jitter caused by repeated HealthKit history fetches.

---

## v5.5.2 (February 25, 2026) - HealthKit Dedupe & Landing Polish
**Stabilized step counts with HealthKit totals and refined the landing hero stacking on mobile.**

### 🚀 Improvements
- **HealthKit Totals**: Step counts now use HealthKit aggregated totals for stable, deduped results.
- **Hero Flow**: Video background stays locked while hero content swaps between flicks.
- **Mobile Hero**: Safer spacing and layout tweaks to prevent overlap on smaller screens.
- **Apple Badge**: App Store badge now maintains proper aspect ratio.

---

## v5.5.1 (February 24, 2026) - Favorites Stability & Webview Fixes
**Cleaner favorites behavior with last-used ordering, plus tighter mobile containment in Admin.**

### 🚀 Improvements
- **Favorites Ordering**: Favorites now reorder by last used, keeping the most recent at the top.
- **Auto-Dedup**: The favorites list automatically de-duplicates to prevent repeated entries of the same meal.
- **Admin Mobile Layout**: AI Performance cards now wrap correctly on small screens.

### 🐛 Bug Fixes
- **Favorites Reuse**: Using a favorite no longer creates duplicate favorite records.
- **Safety**: Favorites can no longer delete the underlying meal log (unfavorite only).

---

## v5.5.0 (February 15, 2026) - Ramadan Experience & Insights Upgrade
**A dedicated Ramadan Hub experience, smarter contextual Highlights/Coach logic, and future meal planning.**

### ✨ New Features
- **Ramadan Hub**: A new Discover destination with wisdom cards, committed goals, and a Ramadan calendar.
- **Ramadan Mode**: Choose Fasting, Witnessing, or Prefer not to share to tailor content and coach tone.
- **Future Meal Planning**: Log meals for future dates and times.

### 🚀 Improvements
- **Highlights**: Reduced repetition with contextual rotation and improved onboarding guidance for new users.
- **Coach Output**: Better formatting and safer fasting language.

---

## v5.2.4 (February 4, 2026) - Admin Hub & Journey
**A major upgrade to the Admin Dashboard featuring a new "Journey" timeline, unified scrollable navigation, and a dedicated Brand Kit tab.**

### ✨ New Features
- **Admin Redesign**: Completely overhauled the Admin Hub with a sleek, horizontally scrollable tab band for unifying all management tools.
- **App Journey**: Introduced "The Ascent" — a premium visual timeline tracking our app's milestones from inception to the App Store.
- **Brand Kit Tab**: Moved the Brand Kit into a dedicated tab within the Admin Hub for quicker access.

### 🚀 Improvements
- **Navigation**: Unified AI, Feedback, Contact, and Growth tabs into a single responsive view.
- **Compliance**: Updated Privacy Policy and legal compliance for App Store submission.

---

## v5.1.0 (January 23, 2026) - Interactive Health Updates
**Major enhancements to the Vitals logger, smoother animations, and critical fixes for the app tour.**

### ✨ New Features
- **Editable Vitals**: You can now tap on Weight and Step cards to manually edit your daily logs via a new, beautiful dialog.
- **Match Vitals UI**: The Vitals logger now shares the same premium "frosted glass" design as the food logger.

### 🚀 Improvements
- **Animation Polish**: Added a smooth entry animation to the Back button on the About page.

### 🐛 Bug Fixes
- **Tour Loop Fixed**: Resolved a bug where the App Tour would incorrectly restart after completion.
- **Stability**: Improved server response times and build stability.

---

## v5.0.5 (January 22, 2026) - Polished & Precise
**A major visual refinement update focusing on a cleaner, borderless UI and smarter AI insights, plus a critical fix for Google Sign-In on iOS.**

### ✨ New Features
- **Pulse Orb Loading**: Replacing the standard spinner with our signature rotating orb for a more immersive app launch.
- **Borderless UI**: A complete visual overhaul of the Feedback and Navigation menus to remove "frames" and borders, embracing a pure "Liquid Glass" aesthetic in dark mode.
- **Native Google Sign-In**: iOS and Android users now get a native Google Sign-In experience with no browser redirect, while web users retain the existing popup flow.

### 🚀 Improvements
- **Feedback Scroll Hint**: Added a helpful "Scroll For More" indicator to the feedback form.
- **Enhanced Card Details**: Food detail cards (macros/ingredients) are now fully scrollable, ensuring no data is cut off.
- **Visual Polish**: Removed distracting hover highlights and backgrounds from feedback options.
- **Platform-Aware Authentication**: Intelligent platform detection ensures the best sign-in experience on every device.

### 🐛 Bug Fixes
- **Google Sign-In on iOS**: Fixed persistent issue where iOS users would be redirected to Safari for authentication but couldn't return to the app. Now uses native iOS Google Sign-In SDK for a seamless experience.
- **AI Correlation Logic**: Fixed a logic error where the AI Dietitian would incorrectly report a positive activity-appetite correlation by including days with missing food logs. It now correctly aligns with your Metabolic Flux chart.
- **Navigation State**: Fixed the bottom navigation bar incorrectly switching tabs when opening the Release Notes.
- **Layout Fixes**: Resolved overlap issues with scroll indicators and floating menus.

---

## v5.0.3 (January 21, 2026) - Visual & Motion Consistency
**Refining the "Liquid Glass" motion design and stabilizing navigation behaviors.**
*(Previous notes...)*
