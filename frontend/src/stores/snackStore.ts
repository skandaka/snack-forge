import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
    Snack,
    Ingredient,
    UIState,
    UserPreferences,
    ChatMessage,
    NotificationState,
} from '../types/snack';
import { api } from '../api/client';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});


export interface SnackStore {
    currentSnack: Snack;
    snackBase: 'bar' | 'ball' | 'bowl';
    ui: UIState;
    availableIngredients: any[];
    aiSuggestions: string[];
    chatHistory: ChatMessage[];
    notifications: NotificationState[];
    userPreferences: UserPreferences;

    setSnackBase: (base: 'bar' | 'ball' | 'bowl') => void;
    addIngredient: (ingredient: Ingredient) => Promise<void>;
    clearSnack: () => void;
    saveSnack: (name: string, description?: string) => Promise<void>;
    togglePanel: (panel: keyof Pick<UIState, 'showIngredientLibrary' | 'showNutritionPanel' | 'showAICoach' | 'showTimeline'>) => void;
    showNotification: (notification: Omit<NotificationState, 'id'>) => void;
    dismissNotification: (id: string) => void;
    chatWithAI: (message: string) => Promise<void>;
    calculateNutrition: () => Promise<void>;
    updateAISuggestions: () => void;
    initializeApp: () => Promise<void>;
    improveCurrentSnack: (goals: string[]) => Promise<void>;
    getAIRecommendation: () => Promise<void>;
    loadAvailableIngredients: () => Promise<void>;
}

const defaultUIState: UIState = {
    selectedIngredient: null,
    showNutritionPanel: true,
    showAICoach: true,
    showIngredientLibrary: true,
    showTimeline: false,
    isLoading: false,
    error: null,
    activeTab: 'build',
    cameraAngle: 'default'
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
        (set, get) => ({
            currentSnack: {
                name: 'Custom Snack',
                base: { type: 'energy-bar', shape: 'rectangular', defaultIngredients: [] },
                ingredients: [],
            },
            snackBase: 'bar',
            ui: defaultUIState,
            availableIngredients: [],
            aiSuggestions: [],
            chatHistory: [],
            notifications: [],
            userPreferences: defaultUserPreferences,

            setSnackBase: (base) => set({ snackBase: base }),

            addIngredient: async (ingredient) => {
                set((state) => {
                    const existing = state.currentSnack.ingredients.find(i => i.name === ingredient.name);
                    if (existing) {
                        return { currentSnack: { ...state.currentSnack, ingredients: state.currentSnack.ingredients.map(i => i.name === ingredient.name ? { ...i, amount_g: i.amount_g + ingredient.amount_g } : i) } };
                    }
                    return { currentSnack: { ...state.currentSnack, ingredients: [...state.currentSnack.ingredients, ingredient] } };
                });
                await get().calculateNutrition();
            },

            clearSnack: () => {
                set({
                    currentSnack: {
                        name: 'New Custom Snack',
                        base: { type: 'energy-bar', shape: 'rectangular', defaultIngredients: [] },
                        ingredients: [],
                        nutrition: undefined
                    },
                    aiSuggestions: []
                });
                get().showNotification({ type: 'info', message: 'New snack created.' });
            },

            saveSnack: async (name, description) => {
                get().showNotification({ type: 'success', message: `Snack "${name}" saved!` });
            },

            togglePanel: (panel) => {
                set((state) => ({
                    ui: { ...state.ui, [panel]: !state.ui[panel] }
                }));
            },

            showNotification: (notification) => {
                const id = Date.now().toString();
                set(state => ({ notifications: [...state.notifications, { ...notification, id }] }));
                setTimeout(() => get().dismissNotification(id), 4000);
            },

            dismissNotification: (id) => {
                set(state => ({ notifications: state.notifications.filter(n => n.id !== id) }));
            },

            calculateNutrition: async () => {
                const { currentSnack } = get();
                if (currentSnack.ingredients.length === 0) {
                    set({ currentSnack: { ...currentSnack, nutrition: undefined }, aiSuggestions: [] });
                    return;
                }
                set(state => ({ ui: { ...state.ui, isLoading: true } }));
                try {
                    const response = await api.calculateNutrition({ ingredients: currentSnack.ingredients });
                    if (response.data.success) {
                        set(state => ({
                            currentSnack: { ...state.currentSnack, nutrition: response.data.data },
                            ui: { ...state.ui, isLoading: false }
                        }));
                        get().updateAISuggestions();
                    }
                } catch (error) {
                    console.error('Nutrition calculation failed:', error);
                    set(state => ({ ui: { ...state.ui, isLoading: false, error: 'Failed to calculate nutrition' } }));
                }
            },

            updateAISuggestions: () => {
                const { currentSnack } = get();
                if (!currentSnack.nutrition) {
                    set({ aiSuggestions: [] });
                    return;
                };
                const suggestions: string[] = [];
                if (currentSnack.nutrition.health_score < 70) {
                    suggestions.push('Consider adding a superfood like Chia Seeds for a nutrient boost.');
                }
                if (currentSnack.nutrition.nutrition_per_100g.protein_g < 15) {
                    suggestions.push('Increase protein with nuts or protein powder for better satiety.');
                }
                if (currentSnack.nutrition.nutrition_per_100g.sugars_g > 25) {
                    suggestions.push('Try reducing high-sugar ingredients like dried fruits or sweeteners.');
                }
                if (currentSnack.nutrition.nutrition_per_100g.fiber_g < 8) {
                    suggestions.push('Boost fiber content with oats or flax seeds for digestive health.');
                }
                set({ aiSuggestions: suggestions });
            },

            chatWithAI: async (message) => {
                const state = get();
                const snackContext = JSON.stringify(state.currentSnack.ingredients.map(i => ({name: i.name, amount: i.amount_g})));
                const prompt = `You are a helpful and concise nutrition coach.
                Current Snack Ingredients: ${snackContext}
                User's question: "${message}"
                Provide a helpful response.`;

                try {
                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    const text = response.text();
                    const chatMessage: ChatMessage = { id: Date.now().toString(), message, response: text, timestamp: new Date() };
                    set(s => ({ chatHistory: [...s.chatHistory, chatMessage] }));
                } catch (error) {
                    get().showNotification({ type: 'error', message: 'AI chat failed. Check your API key.' });
                }
            },

            improveCurrentSnack: async (goals) => {
                const state = get();
                const snackContext = JSON.stringify(state.currentSnack.ingredients.map(i => ({name: i.name, amount: i.amount_g})));
                const goalText = goals.join(', ');
                const prompt = `Given these ingredients: ${snackContext}. Modify them to achieve this goal: "${goalText}".
                Respond with ONLY a JSON object with an "ingredients" key (an array of objects with "name" and "amount_g") and a "reason" key (a short string explaining the change).
                Example: {"ingredients": [{"name": "almonds", "amount_g": 30}], "reason": "Increased almonds for protein."}`;

                get().showNotification({ type: 'info', message: `AI is optimizing for: ${goalText}` });

                try {
                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    const text = response.text().replace(/```json|```/g, "").trim();
                    const aiResponse = JSON.parse(text);

                    set(s => ({ currentSnack: { ...s.currentSnack, ingredients: aiResponse.ingredients } }));
                    await get().calculateNutrition();

                    const chatMessage: ChatMessage = {
                        id: Date.now().toString(),
                        message: `Improve my snack to: ${goalText}`,
                        response: `Done! ${aiResponse.reason}`,
                        timestamp: new Date()
                    };
                    set(s => ({ chatHistory: [...s.chatHistory, chatMessage] }));
                } catch (error) {
                    get().showNotification({ type: 'error', message: 'AI failed to improve snack.' });
                }
            },

            getAIRecommendation: async () => {
                const state = get();
                const preferencesContext = JSON.stringify(state.userPreferences);
                const prompt = `You are a recipe developer. Based on these preferences: ${preferencesContext}, invent a new healthy snack.
                Respond with ONLY a JSON object with a "name" (string) and "ingredients" (an array of objects with "name" and "amount_g").
                Example: {"name": "Zesty Lemon Protein Bites", "ingredients": [{"name": "cashews", "amount_g": 50}]}`;

                get().showNotification({ type: 'info', message: 'Generating a new AI snack...' });

                try {
                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    const text = response.text().replace(/```json|```/g, "").trim();
                    const newSnackData = JSON.parse(text);

                    set(s => ({ currentSnack: { ...s.currentSnack, name: newSnackData.name, ingredients: newSnackData.ingredients } }));
                    await get().calculateNutrition();

                    const chatMessage: ChatMessage = {
                        id: Date.now().toString(),
                        message: "Suggest a new snack for me.",
                        response: `Here is a new recipe for "${newSnackData.name}". I've added the ingredients for you.`,
                        timestamp: new Date()
                    };
                    set(s => ({ chatHistory: [...s.chatHistory, chatMessage] }));
                } catch (error) {
                    get().showNotification({ type: 'error', message: 'AI failed to generate a recommendation.' });
                }
            },

            loadAvailableIngredients: async () => {
                try {
                    const response = await api.getAvailableIngredients();
                    if (response.data.success) {
                        set({ availableIngredients: response.data.data.ingredients });
                    }
                } catch (error) {
                    console.error("Failed to load ingredients:", error);
                }
            },

            initializeApp: async () => {
                await get().loadAvailableIngredients();
            },
        }),
        { name: 'snack-smith-store' }
    )
);