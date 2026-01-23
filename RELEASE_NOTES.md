# Release Notes

## v5.0.7 (January 23, 2026) - Sync & Polish
**Restoring essential data connectivity and refining the chart interaction experience.**

### 🐛 Bug Fixes
- **Fitbit Weight Sync**: Fixed a critical issue where weight and body fat data stopped syncing automatically. The background sync engine now initializes correctly on app launch.
- **Chart Tooltips**: The Average Macro Chart tooltip now behaves consistently with other charts, floating naturally without being cut off or obscuring the filter controls.
- **Chart Expansion**: Fixed an issue where the Macro Chart would appear truncated in expanded view. It now correctly fills the available screen space.

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
