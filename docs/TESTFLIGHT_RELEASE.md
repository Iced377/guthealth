# TestFlight Release Guide (Safe Staging)

This guide explains how to safely deploy your "Liquid Glass" build to TestFlight without breaking your production website (`mygutcheck.app`).

## Prerequisites
- A GitHub repository connected to your Firebase project.
- Access to the Firebase Console.
- Access to the Apple Developer account / Transporter app (optional but recommended).

## Step 1: Push Code to a New Branch
We avoid touching `main` (Production) for now.

1.  Create and switch to a release branch:
    ```bash
    git checkout -b release/testflight
    ```
2.  Commit your changes:
    ```bash
    git add .
    git commit -m "Prepare for TestFlight"
    ```
3.  Push to GitHub:
    ```bash
    git push origin release/testflight
    ```

## Step 2: Create a Staging Backend
We need a live server for the app's API. We'll use Firebase App Hosting to create a temporary "Staging" environment.

1.  Go to the **Firebase Console** -> **App Hosting**.
2.  Click **"Get Started"** or **"Create Backend"**.
3.  **Connect GitHub**: Select your repository (`Iced377/guthealth`).
4.  **Settings**:
    -   **Backend ID**: `guthealth-staging` (or similar).
    -   **Branch**: Select `release/testflight`.
    -   **Root Directory**: Leave defaults (or set to `/` if asked).
5.  Click **"Create and Deploy"**.

Wait for the deployment to finish. Firebase will give you a **Default domain** (e.g., `https://guthealth-staging.web.app`). **Copy this URL.**

## Step 3: Configure the Native App
Now we tell the native app to look at this new Staging URL instead of your local computer.

1.  Run the helper script with your copied URL:
    ```bash
    node scripts/set-capacitor-url.js https://YOUR-STAGING-URL.web.app
    ```
    *(Verify: Check `capacitor.config.ts`. It should show your new URL in the `server` block.)*

2.  Sync this config to the native projects:
    ```bash
    npx cap sync
    ```

## Step 4: Build for TestFlight
Now your native project is pointing to the live Staging server.

**For iOS:**
1.  Open the iOS project:
    ```bash
    npx cap open ios
    ```
2.  In Xcode, select your device (or "Any iOS Device (arm64)").
3.  Go to **Product** -> **Archive**.
4.  Once archived, click **"Distribute App"** -> **TestFlight & App Store** -> **Distribute**.

## Step 5: Clean Up (Back to Dev)
When you are done releasing or want to go back to coding:

1.  Switch back to local mode:
    ```bash
    node scripts/set-capacitor-url.js local
    npx cap sync
    ```
2.  (Optional) Switch back to your main branch if needed:
    ```bash
    git checkout main
    ```
