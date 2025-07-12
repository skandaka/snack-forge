// src/stores/snackStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
    Snack,
    Ingredient,
    NutritionAnalysis,
    SnackBase,
    UIState,
    UserPreferences,
    SnackHistory,
    AIRecommendation,
    TrendsAnalysis,
    ChatMessage,
    NotificationState,
    Camera3DState,
    SnackVisualization,
    AnimationState
} from '../types/snack';
import { api } from '../api/client';

interface SnackStore {
    // Current snack state
    currentSnack: Snack;
    snackHistory: SnackHistory[];
    savedSnacks: Snack[];
    favoriteSnacks: string[];

    // UI state
    ui: UIState;
    camera: Camera3DState;
    visualization: SnackVisualization;
    animation: AnimationState;
    notifications: NotificationState[];

    // User data
    userPreferences: UserPreferences;
    chatHistory: ChatMessage[];
    trendsAnalysis: TrendsAnalysis | null;

    // AI and recommendations
    currentRecommendation: AIRecommendation | null;
    aiSuggestions: string[];

    // Available data
    availableIngredients: any[];
    snackBases: SnackBase[];

    // Actions - Snack Building
    setSnackBase: (base: SnackBase) => void;
    addIngredient: (ingredient: Ingredient) => Promise<void>;
    removeIngredient: (ingredientName: string) => Promise<void>;
    updateIngredientAmount: (ingredientName: string, amount: number) => Promise<void>;
    clearSnack: () => void;

    // Actions - Nutrition
    calculateNutrition: () => Promise<void>;
    getNutritionAnalysis: () => NutritionAnalysis | null;

    // Actions - Snack Management
    saveSnack: (name: string, description?: string) => Promise<void>;
    loadSnack: (snackId: string) => Promise<void>;
    deleteSnack: (snackId: string) => Promise<void>;
    duplicateSnack: (snackId: string) => Promise<void>;
    toggleFavorite: (snackId: string) => Promise<void>;

    // Actions - AI Features
    getAIRecommendation: (preferences: any, goals: string[]) => Promise<void>;
    improveCurrentSnack: (goals: string[]) => Promise<void>;
    generateVariations: (themes: string[]) => Promise<any>;
    chatWithAI: (message: string) => Promise<void>;

    // Actions - Search and Discovery
    searchSnacks: (filters: any) => Promise<Snack[]>;
    searchIngredients: (query: string) => Promise<any[]>;
    getTrendingSnacks: () => Promise<Snack[]>;
    getRecommendedIngredients: () => Promise<any[]>;

    // Actions - Analysis
    analyzeSnackingTrends: () => Promise<void>;
    compareSnacks: (snackA: Snack, snackB: Snack) => Promise<any>;
    getIngredientSubstitutions: (ingredientName: string) => Promise<any>;

    // Actions - UI
    setActiveTab: (tab: UIState['activeTab']) => void;
    setCameraAngle: (angle: UIState['cameraAngle']) => void;
    togglePanel: (panel: 'nutrition' | 'ai' | 'ingredients') => void;
    setSelectedIngredient: (ingredient: string | null) => void;
    showNotification: (notification: Omit<NotificationState, 'id'>) => void;
    dismissNotification: (id: string) => void;

    // Actions - User Preferences
    updateUserPreferences: (preferences: Partial<UserPreferences>) => void;
    addToFavoriteIngredients: (ingredient: string) => void;
    removeFromFavoriteIngredients: (ingredient: string) => void;

    // Actions - 3D Visualization
    updateCamera: (camera: Partial<Camera3DState>) => void;
    updateVisualization: (updates: Partial<SnackVisualization>) => void;
    triggerAnimation: (type: AnimationState['animationType']) => void;

    // Actions - Data Loading
    loadAvailableIngredients: () => Promise<void>;
    loadUserSnacks: () => Promise<void>;
    initializeApp: () => Promise<void>;

    // Helper function - ADD THIS TO INTERFACE
    updateAISuggestions: () => void;
}

const defaultSnackBase: SnackBase = {
    type: 'energy-bar',
    shape: 'rectangular',
    defaultIngredients: []
};

const defaultUIState: UIState = {
    selectedIngredient: null,
    showNutritionPanel: true,
    showAICoach: true,
    showIngredientLibrary: true,
    isLoading: false,
    error: null,
    activeTab: 'build',
    cameraAngle: 'default'
};

const defaultCamera: Camera3DState = {
    position: [5, 5, 5],
    target: [0, 0, 0],
    zoom: 1,
    angle: 0,
    autoRotate: true
};

const defaultVisualization: SnackVisualization = {
    baseModel: 'energy-bar',
    ingredientModels: [],
    lighting: {
        ambient: 0.4,
        directional: {
            intensity: 1,
            position: [10, 10, 5]
        }
    },
    materials: {}
};

const defaultUserPreferences: UserPreferences = {
    flavors: ['sweet'],
    dietary_restrictions: [],
    texture: 'mixed',
    prep_time: 'quick',
    health_goals: ['balanced'],
    favorite_ingredients: [],
    allergens_to_avoid: []
};

export const useSnackStore = create<SnackStore>()(
    devtools(
        persist(
            (set, get) => ({
                // Initial state
                currentSnack: {
                    name: 'Custom Snack',
                    base: defaultSnackBase,
                    ingredients: [],
                    tags: [],
                    servings: 1
                },
                snackHistory: [],
                savedSnacks: [],
                favoriteSnacks: [],

                ui: defaultUIState,
                camera: defaultCamera,
                visualization: defaultVisualization,
                animation: { isAnimating: false, animationType: 'ingredient-add', progress: 0 },
                notifications: [],

                userPreferences: defaultUserPreferences,
                chatHistory: [],
                trendsAnalysis: null,

                currentRecommendation: null,
                aiSuggestions: [],

                availableIngredients: [],
                snackBases: [
                    {
                        type: 'energy-bar',
                        shape: 'rectangular',
                        defaultIngredients: [
                            { name: 'oats', amount_g: 40 },
                            { name: 'dates', amount_g: 30 }
                        ]
                    },
                    {
                        type: 'protein-ball',
                        shape: 'sphere',
                        defaultIngredients: [
                            { name: 'almonds', amount_g: 30 },
                            { name: 'protein_powder_plant', amount_g: 25 }
                        ]
                    },
                    {
                        type: 'granola-cluster',
                        shape: 'organic',
                        defaultIngredients: [
                            { name: 'oats', amount_g: 50 },
                            { name: 'honey', amount_g: 15 }
                        ]
                    }
                ],

                // Snack Building Actions
                setSnackBase: (base) => {
                    set((state) => ({
                        currentSnack: {
                            ...state.currentSnack,
                            base,
                            ingredients: [...base.defaultIngredients]
                        },
                        visualization: {
                            ...state.visualization,
                            baseModel: base.type,
                            ingredientModels: []
                        }
                    }));

                    // Recalculate nutrition with new base
                    get().calculateNutrition();
                },

                addIngredient: async (ingredient) => {
                    const state = get();

                    // Check if ingredient already exists
                    const existingIndex = state.currentSnack.ingredients.findIndex(
                        (ing) => ing.name === ingredient.name
                    );

                    if (existingIndex >= 0) {
                        // Update existing ingredient amount
                        const updatedIngredients = [...state.currentSnack.ingredients];
                        updatedIngredients[existingIndex].amount_g += ingredient.amount_g;

                        set((state) => ({
                            currentSnack: {
                                ...state.currentSnack,
                                ingredients: updatedIngredients
                            }
                        }));
                    } else {
                        // Add new ingredient
                        set((state) => ({
                            currentSnack: {
                                ...state.currentSnack,
                                ingredients: [...state.currentSnack.ingredients, ingredient]
                            }
                        }));
                    }

                    // Trigger animation
                    get().triggerAnimation('ingredient-add');

                    // Recalculate nutrition
                    await get().calculateNutrition();

                    // Show success notification
                    get().showNotification({
                        type: 'success',
                        message: `Added ${ingredient.name} to your snack!`
                    });
                },

                removeIngredient: async (ingredientName) => {
                    set((state) => ({
                        currentSnack: {
                            ...state.currentSnack,
                            ingredients: state.currentSnack.ingredients.filter(
                                (ing) => ing.name !== ingredientName
                            )
                        }
                    }));

                    get().triggerAnimation('ingredient-remove');
                    await get().calculateNutrition();

                    get().showNotification({
                        type: 'info',
                        message: `Removed ${ingredientName} from your snack`
                    });
                },

                updateIngredientAmount: async (ingredientName, amount) => {
                    if (amount <= 0) {
                        return get().removeIngredient(ingredientName);
                    }

                    set((state) => ({
                        currentSnack: {
                            ...state.currentSnack,
                            ingredients: state.currentSnack.ingredients.map((ing) =>
                                ing.name === ingredientName ? { ...ing, amount_g: amount } : ing
                            )
                        }
                    }));

                    await get().calculateNutrition();
                },

                clearSnack: () => {
                    set((state) => ({
                        currentSnack: {
                            ...state.currentSnack,
                            ingredients: [],
                            nutrition: undefined
                        }
                    }));
                },

                // Nutrition Actions
                calculateNutrition: async () => {
                    const state = get();

                    if (state.currentSnack.ingredients.length === 0) {
                        set((currentState) => ({
                            currentSnack: {
                                ...currentState.currentSnack,
                                nutrition: undefined
                            }
                        }));
                        return;
                    }

                    set((currentState) => ({
                        ui: { ...currentState.ui, isLoading: true }
                    }));

                    try {
                        const response = await api.calculateNutrition({
                            ingredients: state.currentSnack.ingredients
                        });

                        if (response.data.success) {
                            set((currentState) => ({
                                currentSnack: {
                                    ...currentState.currentSnack,
                                    nutrition: response.data.data
                                },
                                ui: { ...currentState.ui, isLoading: false }
                            }));

                            // Update AI suggestions based on nutrition
                            get().updateAISuggestions();
                        }
                    } catch (error) {
                        console.error('Nutrition calculation failed:', error);
                        set((currentState) => ({
                            ui: {
                                ...currentState.ui,
                                isLoading: false,
                                error: 'Failed to calculate nutrition'
                            }
                        }));
                    }
                },

                getNutritionAnalysis: () => {
                    return get().currentSnack.nutrition || null;
                },

                // Snack Management Actions
                saveSnack: async (name, description) => {
                    const state = get();

                    try {
                        const snackToSave = {
                            ...state.currentSnack,
                            name,
                            description,
                            created_date: new Date().toISOString()
                        };

                        const response = await api.saveSnack({
                            recipe: snackToSave,
                            user_id: 'demo-user', // In real app, get from auth
                            is_favorite: false
                        });

                        if (response.data.success) {
                            const savedSnack = response.data.data.snack;

                            set((currentState) => ({
                                savedSnacks: [...currentState.savedSnacks, savedSnack],
                                snackHistory: [
                                    {
                                        snack: savedSnack,
                                        created_date: savedSnack.created_date!,
                                        health_score: savedSnack.nutrition?.health_score || 0
                                    },
                                    ...currentState.snackHistory
                                ]
                            }));

                            get().showNotification({
                                type: 'success',
                                message: `Snack "${name}" saved successfully!`
                            });
                        }
                    } catch (error) {
                        console.error('Save snack failed:', error);
                        get().showNotification({
                            type: 'error',
                            message: 'Failed to save snack'
                        });
                    }
                },

                loadSnack: async (snackId) => {
                    try {
                        const response = await api.getSnackDetails(snackId);

                        if (response.data.success) {
                            const snack = response.data.data.snack;

                            set({
                                currentSnack: snack
                            });

                            get().showNotification({
                                type: 'success',
                                message: `Loaded snack "${snack.name}"`
                            });
                        }
                    } catch (error) {
                        console.error('Load snack failed:', error);
                        get().showNotification({
                            type: 'error',
                            message: 'Failed to load snack'
                        });
                    }
                },

                deleteSnack: async (snackId) => {
                    try {
                        await api.deleteSnack(snackId);

                        set((state) => ({
                            savedSnacks: state.savedSnacks.filter(s => s.id !== snackId),
                            favoriteSnacks: state.favoriteSnacks.filter(id => id !== snackId)
                        }));

                        get().showNotification({
                            type: 'success',
                            message: 'Snack deleted successfully'
                        });
                    } catch (error) {
                        console.error('Delete snack failed:', error);
                        get().showNotification({
                            type: 'error',
                            message: 'Failed to delete snack'
                        });
                    }
                },

                duplicateSnack: async (snackId) => {
                    try {
                        const response = await api.duplicateSnack(snackId);

                        if (response.data.success) {
                            const duplicatedSnack = response.data.data.duplicate_snack;

                            set((state) => ({
                                savedSnacks: [...state.savedSnacks, duplicatedSnack]
                            }));

                            get().showNotification({
                                type: 'success',
                                message: 'Snack duplicated successfully!'
                            });
                        }
                    } catch (error) {
                        console.error('Duplicate snack failed:', error);
                        get().showNotification({
                            type: 'error',
                            message: 'Failed to duplicate snack'
                        });
                    }
                },

                toggleFavorite: async (snackId) => {
                    const state = get();
                    const isFavorite = state.favoriteSnacks.includes(snackId);

                    try {
                        await api.toggleFavorite(snackId, 'demo-user');

                        set((currentState) => ({
                            favoriteSnacks: isFavorite
                                ? currentState.favoriteSnacks.filter(id => id !== snackId)
                                : [...currentState.favoriteSnacks, snackId]
                        }));

                        get().showNotification({
                            type: 'success',
                            message: isFavorite ? 'Removed from favorites' : 'Added to favorites'
                        });
                    } catch (error) {
                        console.error('Toggle favorite failed:', error);
                        get().showNotification({
                            type: 'error',
                            message: 'Failed to update favorites'
                        });
                    }
                },

                // AI Actions
                getAIRecommendation: async (preferences, goals) => {
                    set((state) => ({
                        ui: { ...state.ui, isLoading: true }
                    }));

                    try {
                        const response = await api.getAIRecommendation({
                            preferences,
                            health_goals: goals
                        });

                        if (response.data.success) {
                            set((state) => ({
                                currentRecommendation: response.data.data.recommendation,
                                ui: { ...state.ui, isLoading: false }
                            }));
                        }
                    } catch (error) {
                        console.error('AI recommendation failed:', error);
                        set((state) => ({
                            ui: {
                                ...state.ui,
                                isLoading: false,
                                error: 'Failed to get AI recommendation'
                            }
                        }));
                    }
                },

                improveCurrentSnack: async (goals) => {
                    const state = get();

                    try {
                        const response = await api.improveRecipe({
                            current_recipe: state.currentSnack.ingredients,
                            improvement_goals: goals
                        });

                        if (response.data.success) {
                            const improvements = response.data.data.improvements;

                            set((currentState) => ({
                                aiSuggestions: improvements.suggested_changes.map((change: any) =>
                                    `${change.type}: ${change.reason}`
                                )
                            }));

                            get().showNotification({
                                type: 'info',
                                message: 'AI suggestions updated! Check the coach panel.'
                            });
                        }
                    } catch (error) {
                        console.error('Improve snack failed:', error);
                        get().showNotification({
                            type: 'error',
                            message: 'Failed to get improvement suggestions'
                        });
                    }
                },

                generateVariations: async (themes) => {
                    const state = get();

                    try {
                        const response = await api.generateVariations({
                            base_recipe: state.currentSnack.ingredients,
                            variation_themes: themes
                        });

                        if (response.data.success) {
                            return response.data.data.variations;
                        }
                    } catch (error) {
                        console.error('Generate variations failed:', error);
                        get().showNotification({
                            type: 'error',
                            message: 'Failed to generate variations'
                        });
                    }

                    return null;
                },

                chatWithAI: async (message) => {
                    const state = get();

                    try {
                        const response = await api.chatWithAI({
                            message,
                            snack_context: state.currentSnack.nutrition
                        });

                        if (response.data.success) {
                            const chatMessage: ChatMessage = {
                                id: Date.now().toString(),
                                message,
                                response: response.data.data.response,
                                timestamp: new Date(),
                                context: state.currentSnack
                            };

                            set((currentState) => ({
                                chatHistory: [...currentState.chatHistory, chatMessage]
                            }));
                        }
                    } catch (error) {
                        console.error('AI chat failed:', error);
                        get().showNotification({
                            type: 'error',
                            message: 'Failed to chat with AI'
                        });
                    }
                },

                // Search Actions
                searchSnacks: async (filters) => {
                    try {
                        const response = await api.searchSnacks(filters);

                        if (response.data.success) {
                            return response.data.data.snacks;
                        }
                    } catch (error) {
                        console.error('Search snacks failed:', error);
                        get().showNotification({
                            type: 'error',
                            message: 'Search failed'
                        });
                    }

                    return [];
                },

                searchIngredients: async (query) => {
                    try {
                        const response = await api.searchIngredients({ query });

                        if (response.data.success) {
                            return response.data.data.results;
                        }
                    } catch (error) {
                        console.error('Search ingredients failed:', error);
                    }

                    return [];
                },

                getTrendingSnacks: async () => {
                    try {
                        const response = await api.getTrendingSnacks();

                        if (response.data.success) {
                            return response.data.data.trending_snacks;
                        }
                    } catch (error) {
                        console.error('Get trending failed:', error);
                    }

                    return [];
                },

                getRecommendedIngredients: async () => {
                    try {
                        const response = await api.getTrendingIngredients();

                        if (response.data.success) {
                            return response.data.data.trending_ingredients;
                        }
                    } catch (error) {
                        console.error('Get recommended ingredients failed:', error);
                    }

                    return [];
                },

                // Analysis Actions
                analyzeSnackingTrends: async () => {
                    const state = get();

                    try {
                        const response = await api.analyzeSnackingTrends({
                            user_snacks: state.snackHistory.map(h => h.snack)
                        });

                        if (response.data.success) {
                            set({
                                trendsAnalysis: response.data.data.trends
                            });
                        }
                    } catch (error) {
                        console.error('Analyze trends failed:', error);
                        get().showNotification({
                            type: 'error',
                            message: 'Failed to analyze trends'
                        });
                    }
                },

                compareSnacks: async (snackA, snackB) => {
                    try {
                        const response = await api.compareSnacks({
                            recipe_a: snackA.ingredients,
                            recipe_b: snackB.ingredients
                        });

                        if (response.data.success) {
                            return response.data.data;
                        }
                    } catch (error) {
                        console.error('Compare snacks failed:', error);
                    }

                    return null;
                },

                getIngredientSubstitutions: async (ingredientName) => {
                    const state = get();

                    try {
                        const response = await api.getIngredientSubstitutions({
                            ingredient_name: ingredientName,
                            dietary_restrictions: state.userPreferences.dietary_restrictions,
                            recipe_context: state.currentSnack.ingredients
                        });

                        if (response.data.success) {
                            return response.data.data;
                        }
                    } catch (error) {
                        console.error('Get substitutions failed:', error);
                    }

                    return null;
                },

                // UI Actions
                setActiveTab: (tab) => {
                    set((state) => ({
                        ui: { ...state.ui, activeTab: tab }
                    }));
                },

                setCameraAngle: (angle) => {
                    set((state) => ({
                        ui: { ...state.ui, cameraAngle: angle }
                    }));
                },

                togglePanel: (panel) => {
                    set((state) => ({
                        ui: {
                            ...state.ui,
                            showNutritionPanel: panel === 'nutrition' ? !state.ui.showNutritionPanel : state.ui.showNutritionPanel,
                            showAICoach: panel === 'ai' ? !state.ui.showAICoach : state.ui.showAICoach,
                            showIngredientLibrary: panel === 'ingredients' ? !state.ui.showIngredientLibrary : state.ui.showIngredientLibrary
                        }
                    }));
                },

                setSelectedIngredient: (ingredient) => {
                    set((state) => ({
                        ui: { ...state.ui, selectedIngredient: ingredient }
                    }));
                },

                showNotification: (notification) => {
                    const id = Date.now().toString();
                    const fullNotification = { ...notification, id };

                    set((state) => ({
                        notifications: [...state.notifications, fullNotification]
                    }));

                    // Auto-dismiss after duration
                    setTimeout(() => {
                        get().dismissNotification(id);
                    }, notification.duration || 5000);
                },

                dismissNotification: (id) => {
                    set((state) => ({
                        notifications: state.notifications.filter(n => n.id !== id)
                    }));
                },

                // User Preferences Actions
                updateUserPreferences: (preferences) => {
                    set((state) => ({
                        userPreferences: { ...state.userPreferences, ...preferences }
                    }));
                },

                addToFavoriteIngredients: (ingredient) => {
                    set((state) => ({
                        userPreferences: {
                            ...state.userPreferences,
                            favorite_ingredients: [...state.userPreferences.favorite_ingredients, ingredient]
                        }
                    }));
                },

                removeFromFavoriteIngredients: (ingredient) => {
                    set((state) => ({
                        userPreferences: {
                            ...state.userPreferences,
                            favorite_ingredients: state.userPreferences.favorite_ingredients.filter(i => i !== ingredient)
                        }
                    }));
                },

                // 3D Visualization Actions
                updateCamera: (camera) => {
                    set((state) => ({
                        camera: { ...state.camera, ...camera }
                    }));
                },

                updateVisualization: (updates) => {
                    set((state) => ({
                        visualization: { ...state.visualization, ...updates }
                    }));
                },

                triggerAnimation: (type) => {
                    set((state) => ({
                        animation: {
                            isAnimating: true,
                            animationType: type,
                            progress: 0
                        }
                    }));

                    // Simple animation simulation
                    let progress = 0;
                    const interval = setInterval(() => {
                        progress += 0.1;
                        if (progress >= 1) {
                            clearInterval(interval);
                            set((state) => ({
                                animation: { ...state.animation, isAnimating: false, progress: 1 }
                            }));
                        } else {
                            set((state) => ({
                                animation: { ...state.animation, progress }
                            }));
                        }
                    }, 50);
                },

                // Data Loading Actions
                loadAvailableIngredients: async () => {
                    try {
                        const response = await api.getAvailableIngredients();

                        if (response.data.success) {
                            set({
                                availableIngredients: response.data.data.ingredients
                            });
                        }
                    } catch (error) {
                        console.error('Load ingredients failed:', error);
                    }
                },

                loadUserSnacks: async () => {
                    try {
                        const response = await api.getUserSnacks();

                        if (response.data.success) {
                            set({
                                savedSnacks: response.data.data.snacks
                            });
                        }
                    } catch (error) {
                        console.error('Load user snacks failed:', error);
                    }
                },

                initializeApp: async () => {
                    const actions = [
                        get().loadAvailableIngredients(),
                        get().loadUserSnacks()
                    ];

                    await Promise.all(actions);

                    get().showNotification({
                        type: 'success',
                        message: 'Welcome to SnackSmith! Ready to create healthy snacks.'
                    });
                },

                // Helper function to update AI suggestions - FIXED
                updateAISuggestions: () => {
                    const state = get();
                    const nutrition = state.currentSnack.nutrition;

                    if (!nutrition) return;

                    const suggestions: string[] = []; // EXPLICIT TYPE ANNOTATION

                    if (nutrition.health_score < 60) {
                        suggestions.push('Try adding more nutrient-dense ingredients');
                    }

                    if (nutrition.nutrition_per_100g.protein_g < 10) {
                        suggestions.push('Consider adding protein powder or nuts');
                    }

                    if (nutrition.nutrition_per_100g.fiber_g < 5) {
                        suggestions.push('Add chia seeds or oats for more fiber');
                    }

                    if (nutrition.nutrition_per_100g.sugars_g > 20) {
                        suggestions.push('Try reducing sweeteners for better health');
                    }

                    set((currentState) => ({
                        aiSuggestions: suggestions
                    }));
                }
            }),
            {
                name: 'snack-store',
                partialize: (state) => ({
                    userPreferences: state.userPreferences,
                    favoriteSnacks: state.favoriteSnacks,
                    snackHistory: state.snackHistory.slice(0, 50), // Keep only recent 50
                    savedSnacks: state.savedSnacks
                })
            }
        ),
        { name: 'SnackStore' }
    )
);