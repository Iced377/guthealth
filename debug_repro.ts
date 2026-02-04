
import { processMealDescription } from './src/ai/flows/process-meal-description-flow';
import { analyzeFoodItem } from './src/ai/flows/fodmap-detection';

async function runTest() {
    console.log("--- TEST 1: 200g Steak ---");
    const desc1 = "200g Steak";
    const processed1 = await processMealDescription({ mealDescription: desc1 });
    console.log("Processed 1:", JSON.stringify(processed1, null, 2));

    const analysis1 = await analyzeFoodItem({
        foodItem: processed1.primaryFoodItemForAnalysis,
        ingredients: processed1.consolidatedIngredients,
        portionSize: processed1.estimatedPortionSize,
        portionUnit: processed1.estimatedPortionUnit
    });
    console.log("Calories 1:", analysis1.calories);

    console.log("\n--- TEST 2: 100g Steak ---");
    const desc2 = "100g Steak";
    const processed2 = await processMealDescription({ mealDescription: desc2 });
    console.log("Processed 2:", JSON.stringify(processed2, null, 2));

    const analysis2 = await analyzeFoodItem({
        foodItem: processed2.primaryFoodItemForAnalysis,
        ingredients: processed2.consolidatedIngredients,
        portionSize: processed2.estimatedPortionSize,
        portionUnit: processed2.estimatedPortionUnit
    });
    console.log("Calories 2:", analysis2.calories);
}

runTest();
