export interface Ingredient {
    name: string;
    amount_g: number;
    nutrition?: NutritionData;
    properties?: IngredientProperties;
    category?: string;
}

export interface NutritionData {
    calories_per_100g: number;
    protein_g: number;
    total_fat_g: number;
    saturated_fat_g: number;
    carbohydrates_g: number;
    sugars_g: number;
    fiber_g: number;
    sodium_mg: number;
    potassium_mg: number;
    vitamin_c_mg: number;
    calcium_mg: number;
    iron_mg: number;
}

export interface IngredientProperties {
    glycemic_index: number;
    antioxidant_score: number;
    processing_level: number;
    artificial_additives: number;
    preservatives: number;
    allergen_count: number;
    organic_score: number;
    sustainability_score: number;
}

export interface IngredientData {
    name: string;
    category: string;
    nutrition: NutritionData;
    properties: IngredientProperties;
    allergens: string[];
    flavor_profile: string[];
    texture: string;
    color: string;
    description: string;
}

export interface MacroBreakdown {
    protein_percent: number;
    carb_percent: number;
    fat_percent: number;
    protein_calories: number;
    carb_calories: number;
    fat_calories: number;
}

export interface NutritionAnalysis {
    nutrition_per_serving: NutritionData;
    nutrition_per_100g: NutritionData;
    total_weight_g: number;
    health_score: number;
    health_confidence: number;
    health_explanation: string;
    macros: MacroBreakdown;
    allergens: string[];
    glycemic_load: number;
    sustainability_score: number;
    ingredient_breakdown: IngredientBreakdown[];
    nutritional_highlights: string[];
    recommendations: string[];
}

export interface IngredientBreakdown {
    name: string;
    amount_g: number;
    nutrition: NutritionData;
    properties: IngredientProperties;
    category: string;
}

export interface SnackBase {
    type: 'energy-bar' | 'protein-ball' | 'granola-cluster' | 'smoothie-bowl' | 'trail-mix';
    shape: 'rectangular' | 'sphere' | 'organic' | 'bowl' | 'scattered';
    defaultIngredients: Ingredient[];
}

export interface Snack {
    id?: string;
    name: string;
    description?: string;
    base: SnackBase;
    ingredients: Ingredient[];
    nutrition?: NutritionAnalysis;
    instructions?: string[];
    tags?: string[];
    prep_time_minutes?: number;
    servings?: number;
    difficulty_level?: 'easy' | 'medium' | 'hard';
    created_date?: string;
    updated_date?: string;
    created_by?: string;
    is_favorite?: boolean;
    rating_average?: number;
    rating_count?: number;
    version?: number;
}

export interface SnackHistory {
    snack: Snack;
    created_date: string;
    health_score: number;
}

export interface AIRecommendation {
    name: string;
    description: string;
    ingredients: Ingredient[];
    instructions: string[];
    prep_time_minutes: number;
    key_benefits: string[];
    nutrition_analysis?: NutritionAnalysis;
    health_score?: number;
}

export interface IngredientSubstitution {
    name: string;
    similarity: number;
    reason: string;
    nutrition_comparison: {
        [key: string]: 'similar' | 'higher' | 'lower';
    };
    ai_analysis?: string;
}

export interface SnackVariation {
    name: string;
    description: string;
    ingredients: Ingredient[];
    theme_highlights: string[];
    flavor_profile: string;
    nutrition_analysis?: NutritionAnalysis;
    health_score?: number;
    comparison_with_base?: any;
    difficulty_level?: string;
    prep_time_estimate?: string;
}

export interface UserPreferences {
    flavors: string[];
    dietary_restrictions: string[];
    texture: string;
    prep_time: string;
    health_goals: string[];
    favorite_ingredients: string[];
    allergens_to_avoid: string[];
}

export interface TrendsAnalysis {
    average_health_score: number;
    protein_trend: {
        trend: 'increasing' | 'decreasing' | 'stable';
        average: number;
        change_percent: number;
    };
    fiber_trend: {
        trend: 'increasing' | 'decreasing' | 'stable';
        average: number;
        change_percent: number;
    };
    sugar_trend: {
        trend: 'increasing' | 'decreasing' | 'stable';
        average: number;
        change_percent: number;
    };
    favorite_ingredients: Array<{
        name: string;
        frequency: number;
        percentage: number;
    }>;
    nutritional_gaps: string[];
    improvement_suggestions: string[];
    ai_insights: string;
}

export interface Camera3DState {
    position: [number, number, number];
    target: [number, number, number];
    zoom: number;
    angle: number;
    autoRotate: boolean;
}

export interface SnackVisualization {
    baseModel: string;
    ingredientModels: Array<{
        ingredient: string;
        model: string;
        position: [number, number, number];
        scale: [number, number, number];
        rotation: [number, number, number];
    }>;
    lighting: {
        ambient: number;
        directional: {
            intensity: number;
            position: [number, number, number];
        };
    };
    materials: {
        [ingredientName: string]: {
            color: string;
            roughness: number;
            metalness: number;
            opacity: number;
        };
    };
}

export interface UIState {
    selectedIngredient: string | null;
    showNutritionPanel: boolean;
    showAICoach: boolean;
    showIngredientLibrary: boolean;
    isLoading: boolean;
    error: string | null;
    activeTab: 'build' | 'analyze' | 'improve' | 'variations';
    cameraAngle: 'default' | 'top' | 'side' | 'beauty';
}

export interface APIResponse<T> {
    success: boolean;
    data: T;
    message: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    pagination: {
        total_count: number;
        limit: number;
        offset: number;
        has_next: boolean;
        has_previous: boolean;
    };
}

export interface SearchFilters {
    query?: string;
    ingredients?: string[];
    exclude_ingredients?: string[];
    dietary_restrictions?: string[];
    max_prep_time?: number;
    min_health_score?: number;
    tags?: string[];
    category?: string;
}

export interface IngredientCompatibility {
    new_ingredient: string;
    existing_ingredients: string[];
    overall_compatibility: number;
    compatibility_level: 'excellent' | 'good' | 'moderate' | 'low';
    individual_compatibility: Array<{
        existing_ingredient: string;
        compatibility_score: number;
        compatibility_level: string;
    }>;
    flavor_conflicts: string[];
    allergen_additions: string[];
    recommendations: string[];
}

export interface ChatMessage {
    id: string;
    message: string;
    response: string;
    timestamp: Date;
    context?: Snack;
}

export interface NotificationState {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    id: string;
    duration?: number;
}

// Animation and visual states
export interface AnimationState {
    isAnimating: boolean;
    animationType: 'ingredient-add' | 'ingredient-remove' | 'rotation' | 'transition';
    progress: number;
}

export interface ParticleEffect {
    type: 'add-ingredient' | 'health-boost' | 'mixing';
    position: [number, number, number];
    particles: Array<{
        position: [number, number, number];
        velocity: [number, number, number];
        life: number;
        color: string;
    }>;
}

// Export utility types
export type HealthScoreRange = 'excellent' | 'good' | 'moderate' | 'poor';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type SnackCategory = 'energy' | 'protein' | 'healthy' | 'sweet' | 'savory';
export type PreparationMethod = 'no-bake' | 'baked' | 'frozen' | 'dehydrated';
export type TextureType = 'crunchy' | 'chewy' | 'creamy' | 'mixed';