/**
 * Types for DishDetailDrawer component
 */

export interface DishNutrition {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
}

export interface DishCategories {
    name: string;
    section: string;
}

export interface DishItem {
    id: string;
    name: string;
    title: string;
    price: number;
    imageUrl: string;
    rating?: number;
    shopName?: string;
    popularity?: number;
    likesCount?: number;
    reviewsCount?: number;
    ingredients?: string[];
    nutrition?: DishNutrition;
    categories: DishCategories;
    preparationTime?: number;
    description?: string;
    description_am?: string;
}

export interface DishDetailDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: DishItem | null;
    onAddToCart?: (quantity: number) => void;
    onAddRecommended?: (item: DishItem) => void;
    recommendations?: DishItem[];
}
