// src/data/ramadan-seed.ts

export type RamadanCardCategory = 'Well-being' | 'Mental Resilience' | 'Community' | 'Nutrition' | 'Hydration';

export interface RamadanTip {
    topicId: string;
    title: string;
    content: string;
    category: RamadanCardCategory;
    actionItem?: string;
    source?: 'seed' | 'ai';
}

export const RAMADAN_SEED_DECK: RamadanTip[] = [
    // Nutrition (35)
    {
        topicId: 'nutrition-dates-fiber',
        category: 'Nutrition',
        title: 'The Power of Dates',
        content: "Breaking fast with dates provides quick carbohydrates and a small amount of fiber to ease the first bite.",
        actionItem: 'Start Iftar with 1–3 dates and water before your main meal.',
        source: 'seed'
    },
    {
        topicId: 'nutrition-fiber-suhoor',
        category: 'Nutrition',
        title: 'Fiber Is Your Friend',
        content: 'Fiber paired with protein and healthy fats can slow digestion and support steadier energy.',
        actionItem: 'Add oats, chia, or whole grains to Suhoor.',
        source: 'seed'
    },
    {
        topicId: 'nutrition-chew-slowly',
        category: 'Nutrition',
        title: 'Chew Slowly',
        content: 'Slower eating can reduce overeating and may lessen post‑meal discomfort after a long fast.',
        actionItem: 'Put your fork down between bites at Iftar.',
        source: 'seed'
    },
    {
        topicId: 'nutrition-protein-satiety',
        category: 'Nutrition',
        title: 'Prioritize Protein',
        content: 'Protein helps satiety and supports muscle maintenance during fasting days.',
        actionItem: 'Include eggs, yogurt, legumes, or lean protein at Suhoor.',
        source: 'seed'
    },
    {
        topicId: 'nutrition-sugar-crash',
        category: 'Nutrition',
        title: 'Avoid the Sugar Crash',
        content: 'Large portions of simple sugars may lead to fluctuating energy in some people.',
        actionItem: 'Save sweets for later; break fast with balanced foods first.',
        source: 'seed'
    },
    {
        topicId: 'nutrition-balanced-plate',
        category: 'Nutrition',
        title: 'Build a Balanced Plate',
        content: 'A balanced plate is a helpful starting point, but portions should match your activity and hunger.',
        actionItem: 'At Iftar, aim for half vegetables, a quarter protein, a quarter carbs.',
        source: 'seed'
    },
    {
        topicId: 'nutrition-slow-carb',
        category: 'Nutrition',
        title: 'Choose Slow Carbs',
        content: 'Carbs combined with protein and fat are digested more steadily than carbs alone.',
        actionItem: 'Pick brown rice, quinoa, or sweet potato at Suhoor.',
        source: 'seed'
    },
    {
        topicId: 'nutrition-omega-3',
        category: 'Nutrition',
        title: 'Omega-3 Support',
        content: 'Regular intake of omega‑3 rich foods supports long‑term heart and brain health.',
        actionItem: 'Add walnuts or chia to your meal today.',
        source: 'seed'
    },
    {
        topicId: 'nutrition-veggie-variety',
        category: 'Nutrition',
        title: 'Color Your Plate',
        content: 'Vegetable variety improves micronutrient coverage and gut health.',
        actionItem: 'Add at least 3 colors of veggies at Iftar.',
        source: 'seed'
    },
    {
        topicId: 'nutrition-portion-reset',
        category: 'Nutrition',
        title: 'Portion Reset',
        content: 'Your hunger cues may be delayed after fasting—start small and pause.',
        actionItem: 'Serve half portions first, then reassess hunger.',
        source: 'seed'
    },
    {
        topicId: 'nutrition-legumes',
        category: 'Nutrition',
        title: 'Lean on Legumes',
        content: 'Beans and lentils offer steady energy plus protein and fiber.',
        actionItem: 'Add lentil soup or chickpeas to your meal.',
        source: 'seed'
    },
    {
        topicId: 'nutrition-lean-protein',
        category: 'Nutrition',
        title: 'Lean Protein Focus',
        content: 'Lean protein supports recovery and may improve satiety for some people.',
        actionItem: 'Include chicken, fish, tofu, or eggs tonight.',
        source: 'seed'
    },
    {
        topicId: 'nutrition-gentle-iftar',
        category: 'Nutrition',
        title: 'Gentle Iftar Start',
        content: 'A light start helps your stomach adjust after a long fast.',
        actionItem: 'Begin with soup or a small snack before the main meal.',
        source: 'seed'
    },
    {
        topicId: 'nutrition-protein-smoothie',
        category: 'Nutrition',
        title: 'Protein Smoothie Boost',
        content: 'A smoothie can deliver protein without feeling heavy late at night.',
        actionItem: 'Blend yogurt or protein powder with fruit after Iftar.',
        source: 'seed'
    },
    {
        topicId: 'nutrition-calcium',
        category: 'Nutrition',
        title: 'Calcium Support',
        content: 'Calcium supports muscle function and bone health, especially if your intake is low.',
        actionItem: 'Include yogurt, kefir, or fortified milk tonight.',
        source: 'seed'
    },
    {
        topicId: 'nutrition-iron',
        category: 'Nutrition',
        title: 'Iron-Rich Choices',
        content: 'Iron is important if you are prone to low iron or feel unusually fatigued.',
        actionItem: 'Add spinach, lentils, or lean red meat with vitamin C foods.',
        source: 'seed'
    },
    {
        topicId: 'nutrition-vitamin-c',
        category: 'Nutrition',
        title: 'Vitamin C Pairing',
        content: 'Vitamin C supports normal immune function and helps iron absorption.',
        actionItem: 'Add citrus or peppers to your meal.',
        source: 'seed'
    },
    {
        topicId: 'nutrition-avoid-fried',
        category: 'Nutrition',
        title: 'Ease Up on Fried Foods',
        content: 'Heavy fried foods can cause sluggishness after Iftar.',
        actionItem: 'Swap one fried item for grilled or baked tonight.',
        source: 'seed'
    },
    {
        topicId: 'nutrition-night-snack',
        category: 'Nutrition',
        title: 'Smart Night Snack',
        content: 'A small, balanced snack may reduce night hunger for some people.',
        actionItem: 'Try fruit with nuts or yogurt before bed.',
        source: 'seed'
    },
    {
        topicId: 'nutrition-salt-balance',
        category: 'Nutrition',
        title: 'Salt Balance',
        content: 'Too much salt can increase thirst during the fasting hours.',
        actionItem: 'Taste before salting your Iftar meal.',
        source: 'seed'
    },
    {
        topicId: 'nutrition-prep-box',
        category: 'Nutrition',
        title: 'Prep a Suhoor Box',
        content: 'Preparation reduces skipped meals and helps maintain intake.',
        actionItem: 'Pack a ready-to-eat Suhoor in the fridge tonight.',
        source: 'seed'
    },
    {
        topicId: 'nutrition-whole-foods',
        category: 'Nutrition',
        title: 'Whole Foods First',
        content: 'Whole foods provide steadier energy than ultra-processed snacks.',
        actionItem: 'Choose one whole-food swap tonight.',
        source: 'seed'
    },
    {
        topicId: 'nutrition-spice-digest',
        category: 'Nutrition',
        title: 'Gentle Spices',
        content: 'Mild spices may feel gentler on the stomach for some people.',
        actionItem: 'Add cumin or ginger to your meal.',
        source: 'seed'
    },
    {
        topicId: 'nutrition-breakfast-style',
        category: 'Nutrition',
        title: 'Breakfast-Style Suhoor',
        content: 'A balanced breakfast-style meal can support morning energy when paired with good sleep.',
        actionItem: 'Try eggs, whole grains, and fruit at Suhoor.',
        source: 'seed'
    },
    {
        topicId: 'nutrition-veg-protein',
        category: 'Nutrition',
        title: 'Plant Protein',
        content: 'Plant proteins support fullness and provide fiber.',
        actionItem: 'Add tofu, tempeh, or beans to your meal.',
        source: 'seed'
    },
    {
        topicId: 'nutrition-omega-6-balance',
        category: 'Nutrition',
        title: 'Fat Balance',
        content: 'Balanced fats support long-term health; mood effects are gradual.',
        actionItem: 'Use olive oil and add nuts or seeds to your plate.',
        source: 'seed'
    },
    {
        topicId: 'nutrition-fruit-fiber',
        category: 'Nutrition',
        title: 'Fruit for Fiber',
        content: 'Fruits offer hydration and fiber without heavy digestion.',
        actionItem: 'Add berries or an orange after Iftar.',
        source: 'seed'
    },
    {
        topicId: 'nutrition-soup-hydration',
        category: 'Nutrition',
        title: 'Soup First',
        content: 'Warm soup can feel easier on digestion after a long fast.',
        actionItem: 'Start Iftar with a light broth or soup.',
        source: 'seed'
    },
    {
        topicId: 'nutrition-avoid-overeating',
        category: 'Nutrition',
        title: 'Pause at 80%',
        content: 'Stopping before fully stuffed helps energy and digestion.',
        actionItem: 'Pause for 5 minutes halfway through your meal.',
        source: 'seed'
    },
    {
        topicId: 'nutrition-healthy-sauce',
        category: 'Nutrition',
        title: 'Sauce Smart',
        content: 'Heavy sauces can add hidden calories and sugar.',
        actionItem: 'Choose lighter sauces or use less tonight.',
        source: 'seed'
    },
    {
        topicId: 'nutrition-mindful-bites',
        category: 'Nutrition',
        title: 'Mindful Bites',
        content: 'Mindful eating improves satisfaction and reduces overeating.',
        actionItem: 'Take 10 slow, mindful bites at Iftar.',
        source: 'seed'
    },
    {
        topicId: 'nutrition-gut-friendly',
        category: 'Nutrition',
        title: 'Gut-Friendly Foods',
        content: 'Fermented foods can support digestion and comfort.',
        actionItem: 'Add yogurt, kefir, or pickled veggies today.',
        source: 'seed'
    },
    {
        topicId: 'nutrition-carb-timing',
        category: 'Nutrition',
        title: 'Carb Timing',
        content: 'A moderate portion of carbs can be part of a balanced Iftar without feeling overly heavy.',
        actionItem: 'Include a modest portion of carbs at Iftar.',
        source: 'seed'
    },
    {
        topicId: 'nutrition-potassium',
        category: 'Nutrition',
        title: 'Potassium Boost',
        content: 'Potassium supports fluid balance and muscle function.',
        actionItem: 'Add banana, potato, or leafy greens today.',
        source: 'seed'
    },
    {
        topicId: 'nutrition-magnesium-foods',
        category: 'Nutrition',
        title: 'Magnesium Foods',
        content: 'Magnesium‑rich foods support overall nutrition, especially if your intake is low.',
        actionItem: 'Add pumpkin seeds or almonds tonight.',
        source: 'seed'
    },
    {
        topicId: 'nutrition-early-dinner',
        category: 'Nutrition',
        title: 'Early Dinner',
        content: 'Finishing your main meal 2–3 hours before sleep can improve comfort for many people.',
        actionItem: 'Aim to finish your main meal by early evening.',
        source: 'seed'
    },
    {
        topicId: 'nutrition-protein-break',
        category: 'Nutrition',
        title: 'Protein First',
        content: 'Starting with protein can steady blood sugar and appetite.',
        actionItem: 'Begin Iftar with a protein-rich option.',
        source: 'seed'
    },
    {
        topicId: 'nutrition-slow-eating',
        category: 'Nutrition',
        title: 'Slow Down at Iftar',
        content: 'Slower eating may improve comfort and satiety cues.',
        actionItem: 'Take at least 20 minutes for your meal.',
        source: 'seed'
    },

    // Well-being (25)
    {
        topicId: 'wellbeing-midday-nap',
        category: 'Well-being',
        title: 'Midday Power Nap',
        content: 'A 15–20 minute nap improves alertness during long days.',
        actionItem: 'Set a 20-minute timer for a power nap.',
        source: 'seed'
    },
    {
        topicId: 'wellbeing-sleep-hygiene',
        category: 'Well-being',
        title: 'Sleep Hygiene',
        content: 'A calm sleep routine improves deep rest on split schedules.',
        actionItem: 'Dim lights and avoid screens 30 minutes before sleep.',
        source: 'seed'
    },
    {
        topicId: 'wellbeing-light-movement',
        category: 'Well-being',
        title: 'Light Movement',
        content: 'Gentle movement supports circulation without draining energy.',
        actionItem: 'Do a 10–15 minute easy walk before Iftar.',
        source: 'seed'
    },
    {
        topicId: 'wellbeing-stretching',
        category: 'Well-being',
        title: 'Stretch Breaks',
        content: 'Short stretch breaks reduce stiffness and may improve comfort.',
        actionItem: 'Stretch your shoulders and hips for 3 minutes.',
        source: 'seed'
    },
    {
        topicId: 'wellbeing-breathing',
        category: 'Well-being',
        title: 'Calm Breathing',
        content: 'Slow breathing reduces stress and improves focus.',
        actionItem: 'Try 4–6 slow breaths before Iftar.',
        source: 'seed'
    },
    {
        topicId: 'wellbeing-posture',
        category: 'Well-being',
        title: 'Posture Reset',
        content: 'Good posture can reduce stiffness and support comfortable breathing.',
        actionItem: 'Sit tall and relax your shoulders for 1 minute.',
        source: 'seed'
    },
    {
        topicId: 'wellbeing-sunlight',
        category: 'Well-being',
        title: 'Morning Sunlight',
        content: 'Morning light helps regulate your sleep cycle.',
        actionItem: 'Get 5–10 minutes of outdoor light today.',
        source: 'seed'
    },
    {
        topicId: 'wellbeing-caffeine-timing',
        category: 'Well-being',
        title: 'Caffeine Timing',
        content: 'Late caffeine can harm sleep quality.',
        actionItem: 'If you drink caffeine, keep it early evening only.',
        source: 'seed'
    },
    {
        topicId: 'wellbeing-quiet-time',
        category: 'Well-being',
        title: 'Quiet Time',
        content: 'Short quiet breaks help reduce mental fatigue.',
        actionItem: 'Take a 5-minute quiet break today.',
        source: 'seed'
    },
    {
        topicId: 'wellbeing-heat-care',
        category: 'Well-being',
        title: 'Heat Management',
        content: 'Staying cool reduces dehydration risk.',
        actionItem: 'Use a fan or cool shower in the afternoon.',
        source: 'seed'
    },
    {
        topicId: 'wellbeing-mobility',
        category: 'Well-being',
        title: 'Mobility Minute',
        content: 'Gentle mobility keeps joints comfortable.',
        actionItem: 'Try 5 minutes of light mobility drills.',
        source: 'seed'
    },
    {
        topicId: 'wellbeing-eye-rest',
        category: 'Well-being',
        title: 'Eye Rest',
        content: 'Screen breaks reduce fatigue and headaches.',
        actionItem: 'Use the 20-20-20 rule this evening.',
        source: 'seed'
    },
    {
        topicId: 'wellbeing-early-winddown',
        category: 'Well-being',
        title: 'Early Wind-Down',
        content: 'A gentle wind-down helps you sleep deeper.',
        actionItem: 'Start winding down 30 minutes earlier tonight.',
        source: 'seed'
    },
    {
        topicId: 'wellbeing-sleep-cool',
        category: 'Well-being',
        title: 'Cool Sleep',
        content: 'A cooler room can improve sleep quality.',
        actionItem: 'Lower the temperature slightly before bed.',
        source: 'seed'
    },
    {
        topicId: 'wellbeing-evening-walk',
        category: 'Well-being',
        title: 'Evening Walk',
        content: 'A gentle walk after Iftar may feel more comfortable for some people.',
        actionItem: 'Take a 10-minute walk after your meal.',
        source: 'seed'
    },
    {
        topicId: 'wellbeing-relax-ritual',
        category: 'Well-being',
        title: 'Relax Ritual',
        content: 'A short ritual helps signal your body to relax.',
        actionItem: 'Try a warm shower or reading for 10 minutes.',
        source: 'seed'
    },
    {
        topicId: 'wellbeing-noise',
        category: 'Well-being',
        title: 'Noise Control',
        content: 'Reducing noise can improve rest and focus.',
        actionItem: 'Use earplugs or white noise tonight.',
        source: 'seed'
    },
    {
        topicId: 'wellbeing-hydration-sips',
        category: 'Well-being',
        title: 'Sips, Not Gulps',
        content: 'Sipping fluids avoids stomach discomfort.',
        actionItem: 'Sip water steadily after Iftar.',
        source: 'seed'
    },
    {
        topicId: 'wellbeing-core-stability',
        category: 'Well-being',
        title: 'Core Stability',
        content: 'Light core work supports posture and stability.',
        actionItem: 'Try a 1-minute plank or gentle core routine.',
        source: 'seed'
    },
    {
        topicId: 'wellbeing-balance',
        category: 'Well-being',
        title: 'Balance Break',
        content: 'Balance exercises enhance stability and calm.',
        actionItem: 'Stand on one foot for 30 seconds each side.',
        source: 'seed'
    },
    {
        topicId: 'wellbeing-mindful-walk',
        category: 'Well-being',
        title: 'Mindful Walk',
        content: 'Mindful walking reduces stress and improves mood.',
        actionItem: 'Take 5 minutes to walk slowly and notice your steps.',
        source: 'seed'
    },
    {
        topicId: 'wellbeing-breath-count',
        category: 'Well-being',
        title: 'Breath Count',
        content: 'Counting breaths can calm a busy mind.',
        actionItem: 'Count 10 slow breaths before your next meal.',
        source: 'seed'
    },
    {
        topicId: 'wellbeing-light-stretch',
        category: 'Well-being',
        title: 'Light Stretch',
        content: 'Stretching helps reduce stiffness from long sitting.',
        actionItem: 'Stretch calves and hamstrings for 2 minutes.',
        source: 'seed'
    },
    {
        topicId: 'wellbeing-sit-stand',
        category: 'Well-being',
        title: 'Sit-Stand Switch',
        content: 'Changing posture improves circulation and focus.',
        actionItem: 'Stand for 2 minutes every hour today.',
        source: 'seed'
    },
    {
        topicId: 'wellbeing-light-exposure',
        category: 'Well-being',
        title: 'Evening Light',
        content: 'Reducing bright light at night supports melatonin.',
        actionItem: 'Dim overhead lights after dinner.',
        source: 'seed'
    },

    // Hydration (20)
    {
        topicId: 'hydration-suhoor-basics',
        category: 'Hydration',
        title: 'Hydrate Smart at Suhoor',
        content: 'Sipping water can reduce stomach discomfort compared with large gulps right before fasting.',
        actionItem: 'Sip water across the last 30 minutes of Suhoor.',
        source: 'seed'
    },
    {
        topicId: 'hydration-electrolytes',
        category: 'Hydration',
        title: 'Electrolytes Matter',
        content: 'Electrolytes can be helpful if you sweat a lot or live in hot climates; otherwise water is usually enough.',
        actionItem: 'Add a pinch of salt or electrolyte mix to water.',
        source: 'seed'
    },
    {
        topicId: 'hydration-pace',
        category: 'Hydration',
        title: 'Pace Your Water',
        content: 'Pacing fluids can feel more comfortable than drinking a lot at once.',
        actionItem: 'Drink a glass every 45–60 minutes during the evening.',
        source: 'seed'
    },
    {
        topicId: 'hydration-herbal',
        category: 'Hydration',
        title: 'Herbal Hydration',
        content: 'Herbal teas provide fluids without caffeine.',
        actionItem: 'Have an herbal tea after Iftar.',
        source: 'seed'
    },
    {
        topicId: 'hydration-fruit',
        category: 'Hydration',
        title: 'Hydrating Fruits',
        content: 'High-water fruits support hydration and minerals.',
        actionItem: 'Add watermelon or cucumber to your meal.',
        source: 'seed'
    },
    {
        topicId: 'hydration-avoid-sugary',
        category: 'Hydration',
        title: 'Skip Sugary Drinks',
        content: 'Sugary drinks can increase thirst later.',
        actionItem: 'Choose water or lightly flavored water tonight.',
        source: 'seed'
    },
    {
        topicId: 'hydration-soups',
        category: 'Hydration',
        title: 'Soup Counts',
        content: 'Soups add fluids while being easy on digestion.',
        actionItem: 'Start Iftar with a light soup.',
        source: 'seed'
    },
    {
        topicId: 'hydration-sodium-balance',
        category: 'Hydration',
        title: 'Balance Sodium',
        content: 'Balance sodium to avoid excessive thirst during the fasting hours.',
        actionItem: 'Avoid overly salty snacks this evening.',
        source: 'seed'
    },
    {
        topicId: 'hydration-caffeine',
        category: 'Hydration',
        title: 'Limit Caffeine',
        content: 'Caffeine may increase urine output in non‑habitual users; timing it earlier can help.',
        actionItem: 'Keep caffeine to early evening if you have it.',
        source: 'seed'
    },
    {
        topicId: 'hydration-morning-sips',
        category: 'Hydration',
        title: 'Morning Sips',
        content: 'Hydration at Suhoor may reduce perceived fatigue if you are dehydrated.',
        actionItem: 'Drink a full glass before your last bite.',
        source: 'seed'
    },
    {
        topicId: 'hydration-ice',
        category: 'Hydration',
        title: 'Ice Water Trick',
        content: 'Cool water can feel more refreshing and may help you drink more if you prefer it.',
        actionItem: 'Add ice and sip slowly this evening.',
        source: 'seed'
    },
    {
        topicId: 'hydration-bottle',
        category: 'Hydration',
        title: 'Keep a Bottle Nearby',
        content: 'Visibility increases hydration consistency.',
        actionItem: 'Keep a water bottle visible after Iftar.',
        source: 'seed'
    },
    {
        topicId: 'hydration-check-color',
        category: 'Hydration',
        title: 'Check Urine Color',
        content: 'Lighter color generally indicates better hydration.',
        actionItem: 'Aim for pale yellow by bedtime.',
        source: 'seed'
    },
    {
        topicId: 'hydration-pre-bed',
        category: 'Hydration',
        title: 'Pre-Bed Sip',
        content: 'A small sip before bed can help overnight comfort.',
        actionItem: 'Drink a few sips before sleep, not a full glass.',
        source: 'seed'
    },
    {
        topicId: 'hydration-avoid-spicy',
        category: 'Hydration',
        title: 'Spice and Thirst',
        content: 'Very spicy food can increase thirst the next day.',
        actionItem: 'Balance spicy meals with cooling sides.',
        source: 'seed'
    },
    {
        topicId: 'hydration-coconut',
        category: 'Hydration',
        title: 'Natural Electrolytes',
        content: 'Coconut water provides potassium but isn’t necessary for most people compared to water.',
        actionItem: 'Try coconut water if you like it.',
        source: 'seed'
    },
    {
        topicId: 'hydration-sips-intervals',
        category: 'Hydration',
        title: 'Sip Intervals',
        content: 'Frequent sips can be more comfortable than large amounts at once.',
        actionItem: 'Take 5–6 small sips every 30 minutes.',
        source: 'seed'
    },
    {
        topicId: 'hydration-mint',
        category: 'Hydration',
        title: 'Mint Refresh',
        content: 'Mint can make water more enjoyable to drink.',
        actionItem: 'Add mint or lemon to your water tonight.',
        source: 'seed'
    },
    {
        topicId: 'hydration-warm',
        category: 'Hydration',
        title: 'Warm Drinks',
        content: 'Warm beverages can be soothing after a long day.',
        actionItem: 'Have a warm herbal tea after Iftar.',
        source: 'seed'
    },
    {
        topicId: 'hydration-salty-snack',
        category: 'Hydration',
        title: 'Salted Snack Balance',
        content: 'If you eat salty snacks, pair them with extra water.',
        actionItem: 'Add one extra glass of water tonight.',
        source: 'seed'
    },

    // Mental Resilience (15)
    {
        topicId: 'mental-gratitude',
        category: 'Mental Resilience',
        title: 'Gratitude Reset',
        content: 'Gratitude shifts attention away from discomfort and into calm.',
        actionItem: 'Name three things you appreciate today.',
        source: 'seed'
    },
    {
        topicId: 'mental-patience',
        category: 'Mental Resilience',
        title: 'Patience Practice',
        content: 'Short pauses help reduce irritability when energy is low.',
        actionItem: 'Pause for 10 seconds before responding today.',
        source: 'seed'
    },
    {
        topicId: 'mental-focus',
        category: 'Mental Resilience',
        title: 'Focus Block',
        content: 'Short focus sprints can improve productivity during fasting.',
        actionItem: 'Do one 20-minute focus session today.',
        source: 'seed'
    },
    {
        topicId: 'mental-reframe',
        category: 'Mental Resilience',
        title: 'Reframe Hunger',
        content: 'Reframing discomfort as a temporary signal reduces stress.',
        actionItem: 'Label hunger as “temporary” when it appears.',
        source: 'seed'
    },
    {
        topicId: 'mental-slow-down',
        category: 'Mental Resilience',
        title: 'Slow It Down',
        content: 'Slowing speech and movement can calm the nervous system.',
        actionItem: 'Speak 10% slower for one conversation today.',
        source: 'seed'
    },
    {
        topicId: 'mental-micro-break',
        category: 'Mental Resilience',
        title: 'Micro Breaks',
        content: 'Short breaks reduce mental fatigue during long days.',
        actionItem: 'Take a 2-minute break every 90 minutes.',
        source: 'seed'
    },
    {
        topicId: 'mental-journaling',
        category: 'Mental Resilience',
        title: 'One-Line Journal',
        content: 'A single line of reflection supports mental clarity.',
        actionItem: 'Write one sentence about today’s win.',
        source: 'seed'
    },
    {
        topicId: 'mental-self-talk',
        category: 'Mental Resilience',
        title: 'Kind Self-Talk',
        content: 'Gentle inner language reduces stress and improves resilience.',
        actionItem: 'Replace one negative thought with a kinder one.',
        source: 'seed'
    },
    {
        topicId: 'mental-breathing',
        category: 'Mental Resilience',
        title: 'Breathing Reset',
        content: 'Slow breathing lowers tension and improves focus.',
        actionItem: 'Try 4 slow breaths before your next task.',
        source: 'seed'
    },
    {
        topicId: 'mental-visualize',
        category: 'Mental Resilience',
        title: 'Visualize Calm',
        content: 'Mental imagery can improve patience and mood.',
        actionItem: 'Visualize a calm place for 30 seconds.',
        source: 'seed'
    },
    {
        topicId: 'mental-digital-break',
        category: 'Mental Resilience',
        title: 'Digital Break',
        content: 'Reduced scrolling improves attention and mood.',
        actionItem: 'Take a 30-minute phone-free break today.',
        source: 'seed'
    },
    {
        topicId: 'mental-mindful-sip',
        category: 'Mental Resilience',
        title: 'Mindful Sip',
        content: 'Mindfulness reduces stress and improves emotional regulation.',
        actionItem: 'Take 3 mindful sips of water at Iftar.',
        source: 'seed'
    },
    {
        topicId: 'mental-reset',
        category: 'Mental Resilience',
        title: 'Reset Ritual',
        content: 'Simple rituals create a sense of control and calm.',
        actionItem: 'Light a candle or tidy a small space tonight.',
        source: 'seed'
    },
    {
        topicId: 'mental-boundaries',
        category: 'Mental Resilience',
        title: 'Set Gentle Boundaries',
        content: 'Protecting your energy helps you stay consistent.',
        actionItem: 'Say no to one non‑essential task today.',
        source: 'seed'
    },
    {
        topicId: 'mental-sleep-gentle',
        category: 'Mental Resilience',
        title: 'Protect Sleep',
        content: 'Rest supports mood stability and focus.',
        actionItem: 'Choose a bedtime and stick to it tonight.',
        source: 'seed'
    },

    // Community (5)
    {
        topicId: 'community-share-meal',
        category: 'Community',
        title: 'Share the Moment',
        content: 'Sharing a meal builds connection and support.',
        actionItem: 'Invite someone to share Iftar or Suhoor.',
        source: 'seed'
    },
    {
        topicId: 'community-check-in',
        category: 'Community',
        title: 'Check In',
        content: 'A quick check‑in can strengthen relationships.',
        actionItem: 'Message a friend or family member today.',
        source: 'seed'
    },
    {
        topicId: 'community-cook-together',
        category: 'Community',
        title: 'Cook Together',
        content: 'Shared cooking reduces stress and creates support.',
        actionItem: 'Prep one dish together with someone today.',
        source: 'seed'
    },
    {
        topicId: 'community-help-small',
        category: 'Community',
        title: 'Small Help',
        content: 'Small acts of help improve community wellbeing.',
        actionItem: 'Offer help with one small task today.',
        source: 'seed'
    },
    {
        topicId: 'community-table-question',
        category: 'Community',
        title: 'Table Connection',
        content: 'Shared meals are a chance to connect.',
        actionItem: 'Ask one meaningful question at dinner.',
        source: 'seed'
    }
];
