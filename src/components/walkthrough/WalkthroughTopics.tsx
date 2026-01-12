import { Heart, Edit3, Repeat, ListChecks, Trash2, LayoutGrid, BarChart3, Atom, Info, Lightbulb } from 'lucide-react';

export type WalkthroughStep = {
    id: string;
    title: string;
    content: React.ReactNode;
    targetId?: string; // ID of the DOM element to highlight
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
    mediaUrl?: string; // Optional image/video
    mediaType?: 'image' | 'video';
    actionLabel?: string; // Custom label for "Next" button
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
                content: "This is your home base. Here you'll see your daily summary, recent meals, and quick actions.",
                targetId: 'dashboard-container',
                position: 'bottom',
            },
            // --- Staged Meal Card Steps ---
            {
                id: 'tour-meal-card-intro',
                title: 'Your Food Log',
                content: "Every meal you log appears as a card on your timeline. It shows the time, calories, and a quick summary.",
                targetId: 'walkthrough-mock-card',
                position: 'center',
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
                content: "I analyze your food for Gut Impact, FODMAPs, Allergens, and Micronutrients. These badges show you what matters.",
                targetId: 'walkthrough-mock-card-indicators',
                position: 'bottom',
            },
            {
                id: 'tour-meal-card-actions',
                title: 'Actions Menu',
                content: (
                    <div className="space-y-3 mt-1">
                        <p>Tap the three dots to render more options:</p>
                        <ul className="grid grid-cols-1 gap-2 text-sm">
                            <li className="flex items-center gap-2">
                                <span className="p-1 rounded bg-muted">
                                    <Heart className="w-3.5 h-3.5" />
                                </span>
                                <span><strong>Favorite:</strong> Save for quick re-logging</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="p-1 rounded bg-muted">
                                    <ListChecks className="w-3.5 h-3.5" />
                                </span>
                                <span><strong>Log Symptoms:</strong> Track how you feel</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="p-1 rounded bg-muted">
                                    <Edit3 className="w-3.5 h-3.5" />
                                </span>
                                <span><strong>Edit:</strong> Modify ingredients or macros</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="p-1 rounded bg-muted">
                                    <Repeat className="w-3.5 h-3.5" />
                                </span>
                                <span><strong>Copy:</strong> Eat this again? Copy it!</span>
                            </li>
                        </ul>
                    </div>
                ),
                targetId: 'walkthrough-mock-card-actions',
                position: 'bottom',
            },
            // -----------------------------
            {
                id: 'tour-navbar-options',
                title: 'Navigation & Insights',
                content: (
                    <div className="space-y-3 mt-1">
                        <p>Use the top bar to explore:</p>
                        <ul className="grid grid-cols-1 gap-2 text-sm">
                            <li className="flex items-center gap-2">
                                <span className="p-1 rounded bg-muted">
                                    <LayoutGrid className="w-3.5 h-3.5" />
                                </span>
                                <span><strong>Dashboard:</strong> Your daily overview</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="p-1 rounded bg-muted">
                                    <BarChart3 className="w-3.5 h-3.5" />
                                </span>
                                <span><strong>Trends:</strong> Helpful analytics</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="p-1 rounded bg-muted">
                                    <Lightbulb className="w-3.5 h-3.5" />
                                </span>
                                <span><strong>Insights:</strong> Your smart advisor</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="p-1 rounded bg-muted">
                                    <Atom className="w-3.5 h-3.5" />
                                </span>
                                <span><strong>Micronutrients:</strong> Vitamins & Minerals</span>
                            </li>
                        </ul>
                    </div>
                ),
                targetId: 'navbar-actions-container',
                position: 'bottom',
            },
            {
                id: 'welcome-4',
                title: 'We Value Your Feedback',
                content: "Use this button to tell us what you like, what you don't, or report any bugs or features that aren't working. Your input helps us improve!",
                targetId: 'feedback-widget-button',
                position: 'top',
            },
            {
                id: 'welcome-3',
                title: 'Start Logging!',
                content: "Go ahead and log your first meal now! Tap the plus button to get started.",
                targetId: 'fab-add-button',
                position: 'top',
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
