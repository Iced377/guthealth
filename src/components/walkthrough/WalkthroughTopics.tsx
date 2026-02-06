import { LayoutGrid, Compass, PlusCircle, LineChart, User, Atom, Lightbulb } from 'lucide-react';

export type WalkthroughStep = {
    id: string;
    title: string;
    content: React.ReactNode;
    targetId?: string; // ID of the DOM element to highlight
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
    mediaUrl?: string; // Optional image/video
    mediaType?: 'image' | 'video';
    actionLabel?: string; // Custom label for "Next" button
    customType?: 'avatar-modal';
};

export type WalkthroughTopic = {
    id: string;
    title: string;
    steps: WalkthroughStep[];
};

export const WALKTHROUGH_TOPICS: Record<string, WalkthroughTopic> = {
    welcome: {
        id: 'welcome',
        title: 'Welcome to GutCheck',
        steps: [
            {
                id: 'welcome-1',
                title: 'Hi there! 👋',
                content: "I'm your personal gut health companion. Let me show you around so you can get the most out of your journey!",
                position: 'center',
                actionLabel: "Let's go!",
            },
            {
                id: 'welcome-2',
                title: 'Your Dashboard',
                content: "Your daily home base. Swipe to see previous days.",
                targetId: 'dashboard-container',
                position: 'bottom',
            },
            // --- Staged Meal Card Steps ---
            {
                id: 'tour-meal-card-intro',
                title: 'Your Food Log',
                content: "Every meal you log appears as a card on your timeline. Tap any card to view full analysis, ingredients, and more details.",
                targetId: 'walkthrough-mock-card',
                position: 'bottom',
            },
            {
                id: 'tour-meal-card-macros',
                title: 'Macronutrients',
                content: "See exactly how much protein, carbs, and fats were in your meal at a glance.",
                targetId: 'walkthrough-mock-card-macros',
                position: 'bottom',
            },
            {
                id: 'tour-meal-card-indicators',
                title: 'Health Indicators',
                content: "I analyze your food for Gut Impact, FODMAPs, Allergens, and other info. These badges show you what matters.",
                targetId: 'walkthrough-mock-card-indicators',
                position: 'bottom',
            },
            {
                id: 'tour-meal-card-actions',
                title: 'Actions Menu',
                content: "Tap the 3 dots on any card to access actions like reuse, log symptoms, favorite, or edit.",
                targetId: 'walkthrough-mock-card-actions',
                position: 'top',
            },
            // -----------------------------
            {
                id: 'tour-navbar-options',
                title: 'Navigation & Insights',
                content: (
                    <div className="space-y-3 mt-1">
                        <p>The floating menu puts everything at your fingertips:</p>
                        <ul className="grid grid-cols-1 gap-2 text-sm">
                            <li className="flex items-center gap-2">
                                <span className="p-1 rounded bg-muted"><LayoutGrid className="w-3.5 h-3.5" /></span>
                                <span><strong>Home:</strong> Your daily dashboard.</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="p-1 rounded bg-muted"><Compass className="w-3.5 h-3.5" /></span>
                                <span><strong>Explore:</strong> The latest information about your GutCheck.</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="p-1 rounded bg-muted bg-emerald-500/10 text-emerald-500"><PlusCircle className="w-3.5 h-3.5" /></span>
                                <span><strong>Log:</strong> The magic button: write, scan, or quickly reuse a previous meal.</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="p-1 rounded bg-muted"><LineChart className="w-3.5 h-3.5" /></span>
                                <span><strong>Insights:</strong> Review your progress with me, as your private advanced coach.</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="p-1 rounded bg-muted"><User className="w-3.5 h-3.5" /></span>
                                <span><strong>Profile:</strong> Manage your settings, permissions and app theme.</span>
                            </li>
                        </ul>
                    </div>
                ),
                targetId: 'liquid-tab-bar',
                position: 'top',
            },
            {
                id: 'welcome-4',
                title: 'We Value Your Feedback',
                content: "Use the orange Feedback button to tell us what you like, what you don't, or report any bugs. Your input helps us improve!",
                targetId: 'nav-item-feedback',
                position: 'top',
            },
            {
                id: 'welcome-5',
                title: 'All Set!',
                content: "You're all set to get started. I'll be here to help you along the way.",
                customType: 'avatar-modal',
                mediaUrl: '/welcome.mp4',
                mediaType: 'video',
                position: 'center',
                actionLabel: "Take me to my Dashboard",
            },
        ],
    },
    food_logging: {
        id: 'food_logging',
        title: 'Mastering Food Logging',
        steps: [
            {
                id: 'logging-1',
                title: 'Text vs. Photo',
                content: "You can log by typing or taking a picture. Photos are great for quick capture, but text is better for complex mixed dishes.",
                position: 'center',
            },
            {
                id: 'logging-2',
                title: 'Portion Sizes',
                content: "Use your hand as a reference! A fist is roughly a cup, a palm is 3-4oz of meat.",
                position: 'center',
                mediaUrl: '/images/portion-guide.jpg', // Placeholder
                mediaType: 'image',
            },
            {
                id: 'logging-3',
                title: 'Be Specific',
                content: "Instead of 'Sandwich', try 'Turkey sandwich on whole wheat with lettuce and tomato'. The more detail, the better the insights!",
                position: 'center',
            },
        ],
    },
    insights: {
        id: 'insights',
        title: 'Understanding Insights',
        steps: [
            {
                id: 'insights-1',
                title: 'Pattern Recognition',
                content: "I'll analyze your logs to find connections between what you eat and how you feel.",
                position: 'center',
            },
            {
                id: 'insights-2',
                title: 'Symptoms',
                content: "Don't forget to log symptoms! The more symptom data I have, the smarter I get at predicting triggers.",
                targetId: 'nav-item-insights',
                position: 'bottom',
            },
        ],
    },
};
