import {
    Coffee, Beer, Wine, Sandwich, Pizza, Soup, Egg, Beef, Apple, Carrot,
    Leaf, Cake, IceCream, Fish, Drumstick, Wheat, Milk, Utensils,
    Croissant, Cherry, Banana, Grape, Citrus, Cookie, Candy,
    Donut, Martini, Nut, Popcorn, Salad, Bean, Bone
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const getFoodIcon = (name: string): LucideIcon => {
    const lowerName = name.toLowerCase();

    // Beverages
    if (lowerName.includes('coffee') || lowerName.includes('latte') || lowerName.includes('espresso') || lowerName.includes('cappuccino') || lowerName.includes('tea')) return Coffee;
    if (lowerName.includes('beer') || lowerName.includes('ale') || lowerName.includes('lager') || lowerName.includes('stout')) return Beer;
    if (lowerName.includes('wine') || lowerName.includes('merlot') || lowerName.includes('cabernet') || lowerName.includes('chardonnay')) return Wine;
    if (lowerName.includes('cocktail') || lowerName.includes('martini') || lowerName.includes('vodka') || lowerName.includes('gin') || lowerName.includes('whiskey')) return Martini;
    if (lowerName.includes('milk') || lowerName.includes('yogurt') || lowerName.includes('cream') || lowerName.includes('shake')) return Milk;

    // Main Dishes
    if (lowerName.includes('pizza') || lowerName.includes('slice')) return Pizza;
    if (lowerName.includes('sandwich') || lowerName.includes('burger') || lowerName.includes('sub') || lowerName.includes('wrap')) return Sandwich;
    if (lowerName.includes('soup') || lowerName.includes('stew') || lowerName.includes('chowder') || lowerName.includes('chili') || lowerName.includes('broth')) return Soup;
    if (lowerName.includes('salad') || lowerName.includes('greens') || lowerName.includes('lettuce')) return Salad;

    // Proteins
    if (lowerName.includes('egg') || lowerName.includes('omelet') || lowerName.includes('scramble')) return Egg;
    if (lowerName.includes('beef') || lowerName.includes('steak') || lowerName.includes('burger') || lowerName.includes('meat')) return Beef;
    if (lowerName.includes('chicken') || lowerName.includes('turkey') || lowerName.includes('duck') || lowerName.includes('wing')) return Drumstick;
    if (lowerName.includes('fish') || lowerName.includes('salmon') || lowerName.includes('tuna') || lowerName.includes('cod') || lowerName.includes('sushi') || lowerName.includes('seafood')) return Fish;
    if (lowerName.includes('pork') || lowerName.includes('bacon') || lowerName.includes('ham') || lowerName.includes('ribs')) return Bone; // Using Bone for ribs/meat on bone
    if (lowerName.includes('bean') || lowerName.includes('lentil') || lowerName.includes('chickpea') || lowerName.includes('hummus')) return Bean;

    // Fruts & Veg
    if (lowerName.includes('apple') || lowerName.includes('pear')) return Apple;
    if (lowerName.includes('banana') || lowerName.includes('plantain')) return Banana;
    if (lowerName.includes('grape') || lowerName.includes('raisin') || lowerName.includes('wine')) return Grape; // Wine matches above first, this catches grapes
    if (lowerName.includes('orange') || lowerName.includes('lemon') || lowerName.includes('lime') || lowerName.includes('citrus')) return Citrus;
    if (lowerName.includes('cherry') || lowerName.includes('berry')) return Cherry;
    if (lowerName.includes('carrot') || lowerName.includes('veg')) return Carrot;
    if (lowerName.includes('spinach') || lowerName.includes('cale') || lowerName.includes('green')) return Leaf;
    if (lowerName.includes('nut') || lowerName.includes('almond') || lowerName.includes('cashew') || lowerName.includes('peanut')) return Nut;

    // Grains & Baked
    if (lowerName.includes('bread') || lowerName.includes('toast') || lowerName.includes('bagel') || lowerName.includes('pasta') || lowerName.includes('noodle') || lowerName.includes('rice') || lowerName.includes('grain') || lowerName.includes('oat') || lowerName.includes('cereal')) return Wheat;
    if (lowerName.includes('croissant') || lowerName.includes('pastry') || lowerName.includes('muffin')) return Croissant;

    // Sweets
    if (lowerName.includes('cake') || lowerName.includes('pie') || lowerName.includes('brownie') || lowerName.includes('cupcake')) return Cake;
    if (lowerName.includes('ice cream') || lowerName.includes('gelato') || lowerName.includes('sorbet')) return IceCream;
    if (lowerName.includes('cookie') || lowerName.includes('biscuit')) return Cookie;
    if (lowerName.includes('candy') || lowerName.includes('sweet') || lowerName.includes('chocolate')) return Candy;
    if (lowerName.includes('donut') || lowerName.includes('doughnut')) return Donut;
    if (lowerName.includes('popcorn') || lowerName.includes('corn')) return Popcorn;

    // Default
    return Utensils;
};
