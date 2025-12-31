
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
