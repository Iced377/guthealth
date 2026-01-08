

# Release Notes - GutHealth v3.10.2 (UI Refinements)

**Release Date:** January 08, 2026
**Version:** v3.10.2

## 💅 UI/UX Polish
### User Center
- **Cleaner Interface**: Simplified the profile section headers by removing icons for a cleaner, more minimal look.
- **Improved Navigation**: Moved the "Edit Profile" button to the top header to clearly indicate it applies to your entire profile.
- **Consistent Icons**: Ensured all icons in the Setup Wizard and User Center use the consistent green theme color.

---

# Release Notes - GutHealth v3.10.1 (Major Feature Release)

**Release Date:** January 07, 2026
**Version:** v3.10.1

## 🌟 Major Features
### User Profile Editing
- **Full Edit Control**: You can now edit your biometric data (Height, Weight, Age) and lifestyle settings (Activity Level, Goal) directly from the User Center.
- **Auto-Recalculation**: Updating your profile instantly recalculates your daily Calorie (TDEE) and Macro targets based on nutrition science.
- **Dashboard Sync**: Your new personalized targets are immediately reflected on your Dashboard's Nutrition Overview cards.

### Setup & Onboarding
- **Redo Setup**: Added a "Redo Setup Wizard" button to the profile page, allowing you to easily restart the onboarding process from scratch.

## 🛠 Fixes & Polish
- **Dark Mode**: Fixed a theming inconsistency where the User Center was using light-mode colors in dark mode. It now perfectly matches the rest of the app.
- **Data Sync**: Resolved an issue where profile targets were not propagating to the dashboard cards.

---

# Release Notes - GutHealth v3.9.20 (Meal Timing Distribution)

**Release Date:** January 06, 2026
**Version:** v3.9.20

## 📈 New Features
### Trends Dashboard
- **Meal Timing Distribution**: Added a new chart that visualizes how often you eat at different times of the day. This provides insight into your daily meal frequency and timing habits.

---

# Release Notes - GutHealth v3.9.19 (Hourly Calories Trend)

**Release Date:** January 06, 2026
**Version:** v3.9.19

## 📈 New Features
### Trends Dashboard
- **Hourly Average Calories**: Added a new chart to visualize your average calorie intake by hour of the day. This helps you identify your eating patterns and potential snacking spikes.

---

# Release Notes - GutHealth v3.9.17 (Critical Permission Fix)

**Release Date:** January 05, 2026
**Version:** v3.9.17

## 🛠 Fixes
### Fitbit Integration
- **Forced Scopes**: Modified the authentication flow to strictly request `activity`, `nutrition`, `weight`, and `profile` permissions, overriding any potential misconfiguration in production environment variables. This ensures the app always has access to the data it needs to function.

# Release Notes - GutHealth v3.9.18 (Trends Data Fix)

**Release Date:** January 06, 2026
**Version:** v3.9.18

## 🛠 Fixes
### Trends Dashboard
- **Data Filtering**: Fixed an issue where the "Last 7 Days" and "Last 30 Days" filters were cutting off data from the earliest day in the range. The app now correctly includes the full 24 hours of the start date.
- **Localhost Fix**: Resolved an issue where the local development environment was not opening correctly.

---

# Release Notes - GutHealth v3.9.16 (User Center & Fitbit Fixes)

**Release Date:** January 05, 2026
**Version:** v3.9.16

## 🌟 Highlights
### User Center
- **Profile Page**: Launched a new User Center (`/profile`) where you can manage your personal details.
- **Date of Birth**: You can now easily set and update your Date of Birth for age-specific health metrics.
- **App Connections**: A new dedicated section to manage integrations.
- **Fitbit Toggle**: Easily Connect or Disconnect your Fitbit account with a single switch.

## 🛠 Fixes
### Fitbit Integration
- **Sync Reliability**: Resolved a critical bug where missing permissions (Profile/Activity) were causing 403 errors and data gaps in the morning.
- **Timezone Awareness**: Fixed an issue where the app was defaulting to UTC, causing "Today's" data to appear empty until the afternoon.
- **Smart Permissions**: The app now intelligently checks and requests the specific permissions required for full functionality.

---

# Release Notes - GutHealth v3.9.15 (Admin Automation)

**Release Date:** January 03, 2026
**Version:** v3.9.15

## 🌟 Highlights
### Admin Efficiency
- **Smart Feedback Status**: Feedback items marked as 'New' are now automatically marked as 'Viewed' when an admin opens and exits the feedback list, eliminating manual cleanup.

## 🛠 Fixes
- **Stability**: Fixed a hydration mismatch warning related to the root layout body tag.

---

# Release Notes - GutHealth v3.9.14 (App Icons & Social Sharing)

**Release Date:** January 03, 2026
**Version:** v3.9.14

## 💅 UI/UX Improvements
### App Identity
- **Updated Icons**: Optimized app icons for all devices (Mobile Home Screen, Splash Screen, Favicons).
- **Social Sharing**: Fixed WhatsApp and Social Media preview images to correctly display the app logo and description when sharing links.
- **Logo Polish**: Maximized the logo size within the app icon for better visibility.

---
# Release Notes - GutHealth v3.9.13 (Mobile UI Polish)

**Release Date:** January 03, 2026
**Version:** v3.9.13

## 💅 UI/UX Improvements
### Mobile Experience
- **Cleaner Header**: Removed the "Sign In" button from the top bar on mobile devices to reduce clutter.
- **Smart Actions**: Added a "Log Out" button that intelligently appears if you are logged in but viewing the guest landing page.
- **Visual Polish**: Updated the hero text to "Keep Your Food Diary. Transform your Health." and fixed spacing issues where text would overlap with the header.
- **Layout**: Optimized the vertical spacing of the main action buttons to ensure they fit perfectly on smaller screens.

---

# Release Notes - GutHealth v3.9.12 (Landing Page Redesign)

**Release Date:** January 03, 2026
**Version:** v3.9.12

## 🌟 Highlights
### Full-Screen Video Background
- **Immersive Experience**: The landing page now features a seamless full-screen video background that extends behind the transparent header.
- **Visual Clarity**: Removed the app name and background bar from the guest header for a cleaner, modern look.

## 🛠 Fixes
- **Video Playback**: Fixed an issue where the background video would fail to load on the landing page.

---

# Release Notes - GutHealth v3.9.11 (UI Polish)

**Release Date:** January 02, 2026
**Version:** v3.9.11

## 💅 UI/UX Improvements
- **Trends Charts**: Switched interactive tooltips to **Click** (instead of Hover) to ensure they work reliably on mobile and don't get obstructed.
- **Micronutrients**: Clicking an achievement now opens a clean popup with details, fixing mobile interaction.
- **Mobile Menu**: Restored missing links (Terms, Privacy) and fixed scrolling issues on small screens.

---
# Release Notes - GutHealth v3.9.10 (Layout Fix)

**Release Date:** January 02, 2026
**Version:** v3.9.10

## 🛠 Fixes
- **Mobile Layout**: Refactored the Trends Dashboard header to wrap buttons gracefully on small screens, preventing horizontal overflow.

---
# Release Notes - GutHealth v3.9.9 (Debug Tool)

**Release Date:** January 02, 2026
**Version:** v3.9.9

## 🛠 Debugging & Fixes
- **Mobile Layout**: Fixed an issue where content would spill over the screen edge on mobile devices.
- **Fitbit Debug**: Added a hidden "Bug" icon on the Trends dashboard to diagnose sync data issues.

---
# Release Notes - GutHealth v3.9.9 (Debug Tool)

**Release Date:** January 02, 2026
**Version:** v3.9.9

## 🛠 Debugging
- **Fitbit Debug**: Added a hidden "Bug" icon on the Trends dashboard. Clicking it runs a pure diagnostic check of your Fitbit data and Timezone to identify why today's records are missing.

---
# Release Notes - GutHealth v3.9.7 (Build Hotfix)

**Release Date:** January 02, 2026
**Version:** v3.9.7

## 🛠 Fixes
- **Build System**: Removed stray characters from the API route file that broke the production build.

---
# Release Notes - GutHealth v3.9.6 (Sync & AI Fixes)

**Release Date:** January 02, 2026
**Version:** v3.9.6

## 🌟 Highlights
### Holistic Fitbit Sync
- **Smart History**: Automatically fetches up to 1 year of history in safe chunks to avoid API limits.
- **Auto-Pilot**: Syncs automatically in the background when checking Trends.
- **Real-Time Guarantee**: Explicitly fetches "Today's" live stats to ensure your dashboard is always current.

## 🛠 Fixes
- **AI Food Recognition**: Resolved a configuration issue that was preventing food analysis. Both text and image logging are restored.

---
# Release Notes - GutHealth v3.9.5 (Trends Enhancement)

**Release Date:** January 02, 2026
**Version:** v3.9.5

## 📈 New Features
- **Correlation Chart**: Added a new scatter plot to visualize the specific correlation between daily **Steps** and **Calorie Intake**.

---

# Release Notes - GutHealth v3.9.4 (Hotfix)

**Release Date:** January 02, 2026
**Version:** v3.9.4

## 🛠 Fixes
- **Deployment**: Finalized `package-lock.json` synchronization to fix "Module not found" errors during build.

---

# Release Notes - GutHealth v3.9.3 (Build Stability)

**Release Date:** January 02, 2026
**Version:** v3.9.3

## 🛠 Fixes
- **Build Fix**: Resolved `framer-motion` compatibility issues by explicitly marking UI components as client-side modules.

---

# Release Notes - GutHealth v3.9.2 (Code Sync)

**Release Date:** January 01, 2026
**Version:** v3.9.2

## 🛠 Fixes
- **Code Sync**: Ensured all new feature code (Pedometer Import, Activity Charts) is correctly included in the release build.

---

# Release Notes - GutHealth v3.9.1 (Build Fix)

**Release Date:** January 01, 2026
**Version:** v3.9.1

## 🛠 Fixes
- **Deployment**: Synced `package-lock.json` with `package.json` to resolve build errors during deployment.

---

# Release Notes - GutHealth v3.9.0 (Integrations & Insights)

**Release Date:** January 01, 2026
**Version:** v3.9.0

## 🌟 Highlights

### Pedometer++ Import
For users who track steps with Pedometer++, you can now bring your full history into GutCheck.
- **CSV Import**: Easily upload your exported data via the Trends dashboard.
- **Historic Data**: Import years of extensive step data in seconds.

### Enhanced Trends Visualization
We've upgraded the Activity Chart to give you deeper insights into your movement.
- **Histogram View**: Steps are now displayed as clear daily bars.
- **7-Day Trend Line**: A smooth moving average line helps you spot weekly trends amidst daily fluctuations.
- **Smart Merging**: The graph automatically prioritizes the best data source (Fitbit vs. Pedometer++) for each day.

## 🛠 Fixes & Improvements
- **Fitbit Sync**: Fixed an issue where the syncing process sometimes missed the most recent day's data. Syncing now explicitly captures everything up to the current moment.
- **Dashboard Layout**: Reorganized the Trends grid to prioritize Weight and Activity charts for better visibility.
- **Stability**: Resolved backend initialization errors for Firebase Admin SDK.

---

# Release Notes - GutCheck v3.8.25 (AI Improvements)

**Release Date:** January 01, 2026
**Version:** v3.8.25

## 🌟 Highlights

### Enhanced AI Food Identification
We've upgraded our image recognition capabilities to provide smarter, more accurate food logging.
- **Automatic Portion Estimation**: The AI now visually estimates the quantity of each ingredient (e.g., "150g Chicken" instead of just "Chicken"), leading to significantly more accurate macro and calorie tracking.

### Faster Nutrition Analysis
- **Speed Optimization**:  We've optimized our AI prompts to deliver nutrition insights faster than before, reducing wait times for your food logs.

---

# Release Notes - GutHealth v3.7 (The Dashboard Update)

**Release Date:** December 2025
**Version:** v3.7.16

## 🌟 Highlights

### Dashboard 2.0
We've completely overhauled the main interface. The new Dashboard focuses on what matters most: your daily nutrition and gut health trends.
- **Nutrition Overview**: A new top-level section displaying real-time progress towards Calorie, Protein, Carb, and Fat goals.
- **Date Navigation**: You can now travel back in time! Use the new navigation arrows to view your macros and micronutrients for any past date.
- **Dynamic Micronutrients**: The "Micronutrients Achieved" badges now update based on the selected date, giving you accurate feedback on your daily intake.

### Timeline Refinements
The food timeline has been streamlined for clarity and ease of use.
- **Cleaner Cards**: Timestamps and clutter removed from the card face. Actions are now neatly organized in the header.
- **Macros at a Glance**: Calorie and macro breakdowns are now visible directly in the card header for quick scanning.
- **Empty Day Filtering**: The timeline now automatically hides dates with no activity, keeping your feed relevant.
- **Detailed Dialogs**: Click any food title to see exact logging times, relative time (e.g., "2 hours ago"), and full ingredient details.

### Fitbit Integration 2.0
We've significantly improved the reliability of our Fitbit sync.
- **Auto-Sync**: Background syncing is smoother and handles permissions better.
- **Manual Sync**: Added a manual sync trigger on the Trends page (and via API) for immediate updates.
- **Auth Fixes**: Resolved issues with "Permission Denied" and session handling.

## 🛠 Fixes & Improvements
- **UI Polish**:
    - Large, premium watermark icons for Nutrition Cards.
    - Consistent badge styling for health indicators (Neutral Gut-Health, Micronutrients).
    - Restored "Beta" warning on the About page.
- **Redirects**: root (`/`) now redirects to the Dashboard, while the original landing page content lives at `/about`.
- **Performance**: Optimized rendering for the timeline and date switching.

## 🚀 Known Issues
- "Connect to Fitbit" button may occasionally flash on load (state sync latency).
- Demo Mode data is static (known limitation).
