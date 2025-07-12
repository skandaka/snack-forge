// src/api/client.ts
import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import {
    APIResponse,
    PaginatedResponse,
    Ingredient,
    NutritionAnalysis,
    Snack,
    SearchFilters,
    IngredientData,
    IngredientCompatibility
} from '../types/snack';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Type-safe error interface
interface APIError {
    detail?: string;
    message?: string;
}

class APIClient {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Request interceptor for authentication
        this.client.interceptors.request.use(
            (config) => {
                // Add authentication token if available
                if (typeof window !== 'undefined') {
                    const token = localStorage.getItem('auth_token');
                    if (token) {
                        config.headers.Authorization = `Bearer ${token}`;
                    }
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => response,
            (error: AxiosError) => {
                // Handle common errors with proper type checking
                if (error.response) {
                    const status = error.response.status;

                    if (status === 401) {
                        // Unauthorized - redirect to login or refresh token
                        if (typeof window !== 'undefined') {
                            localStorage.removeItem('auth_token');
                        }
                    } else if (status === 403) {
                        console.error('Forbidden: You do not have permission to access this resource');
                    } else if (status >= 500) {
                        console.error('Server error:', error.response.data);
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    // Nutrition API methods
    async calculateNutrition(data: {
        ingredients: Ingredient[];
        serving_size_g?: number;
    }): Promise<AxiosResponse<APIResponse<NutritionAnalysis>>> {
        return this.client.post('/nutrition/calculate', data);
    }

    async compareSnacks(data: {
        recipe_a: Ingredient[];
        recipe_b: Ingredient[];
        comparison_name_a?: string;
        comparison_name_b?: string;
    }): Promise<AxiosResponse<APIResponse<any>>> {
        return this.client.post('/nutrition/compare', data);
    }

    async analyzeIngredientContribution(data: {
        ingredients: Ingredient[];
    }): Promise<AxiosResponse<APIResponse<any>>> {
        return this.client.post('/nutrition/ingredient-contribution', data);
    }

    async getNutritionTargets(): Promise<AxiosResponse<APIResponse<any>>> {
        return this.client.get('/nutrition/targets');
    }

    async getNutrientInfo(nutrient: string): Promise<AxiosResponse<APIResponse<any>>> {
        return this.client.get(`/nutrition/nutrients/info/${encodeURIComponent(nutrient)}`);
    }

    async optimizeNutrition(data: {
        current_recipe: Ingredient[];
        optimization_goals: string[];
    }): Promise<AxiosResponse<APIResponse<any>>> {
        return this.client.post('/nutrition/optimize', data);
    }

    // AI API methods
    async getAIRecommendation(data: {
        preferences: any;
        health_goals: string[];
        dietary_restrictions?: string[];
    }): Promise<AxiosResponse<APIResponse<any>>> {
        return this.client.post('/ai/recommend', data);
    }

    async improveRecipe(data: {
        current_recipe: Ingredient[];
        improvement_goals: string[];
        user_preferences?: any;
    }): Promise<AxiosResponse<APIResponse<any>>> {
        return this.client.post('/ai/improve', data);
    }

    async chatWithAI(data: {
        message: string;
        snack_context?: any;
        conversation_id?: string;
    }): Promise<AxiosResponse<APIResponse<any>>> {
        return this.client.post('/ai/chat', data);
    }

    async getIngredientSubstitutions(data: {
        ingredient_name: string;
        dietary_restrictions?: string[];
        recipe_context?: Ingredient[];
        substitution_reason?: string;
    }): Promise<AxiosResponse<APIResponse<any>>> {
        return this.client.post('/ai/substitute', data);
    }

    async generateVariations(data: {
        base_recipe: Ingredient[];
        variation_themes: string[];
        keep_base_nutrition?: boolean;
    }): Promise<AxiosResponse<APIResponse<any>>> {
        return this.client.post('/ai/variations', data);
    }

    async analyzeSnackingTrends(data: {
        user_snacks: any[];
        analysis_period_days?: number;
    }): Promise<AxiosResponse<APIResponse<any>>> {
        return this.client.post('/ai/analyze-trends', data);
    }

    async explainHealthScore(nutrition_data: any): Promise<AxiosResponse<APIResponse<any>>> {
        return this.client.post('/ai/explain-score', nutrition_data);
    }

    async getAvailableGoals(): Promise<AxiosResponse<APIResponse<any>>> {
        return this.client.get('/ai/goals');
    }

    // Snacks API methods
    async saveSnack(data: {
        recipe: any;
        user_id?: string;
        is_favorite?: boolean;
    }): Promise<AxiosResponse<APIResponse<any>>> {
        return this.client.post('/snacks/save', data);
    }

    async getSnackLibrary(params: {
        user_id?: string;
        limit?: number;
        offset?: number;
        sort_by?: string;
        sort_order?: string;
        include_nutrition?: boolean;
    } = {}): Promise<AxiosResponse<APIResponse<PaginatedResponse<Snack>>>> {
        return this.client.get('/snacks/library', { params });
    }

    async getSnackDetails(
        snackId: string,
        params: {
            include_similar?: boolean;
            user_id?: string;
        } = {}
    ): Promise<AxiosResponse<APIResponse<any>>> {
        return this.client.get(`/snacks/${encodeURIComponent(snackId)}`, { params });
    }

    async searchSnacks(data: SearchFilters): Promise<AxiosResponse<APIResponse<any>>> {
        return this.client.post('/snacks/search', data);
    }

    async updateSnack(data: {
        snack_id: string;
        updates: any;
    }): Promise<AxiosResponse<APIResponse<any>>> {
        return this.client.put('/snacks/update', data);
    }

    async deleteSnack(
        snackId: string,
        userId?: string
    ): Promise<AxiosResponse<APIResponse<any>>> {
        const params = userId ? { user_id: userId } : {};
        return this.client.delete(`/snacks/${encodeURIComponent(snackId)}`, { params });
    }

    async rateSnack(data: {
        snack_id: string;
        rating: number;
        review?: string;
        user_id?: string;
    }): Promise<AxiosResponse<APIResponse<any>>> {
        return this.client.post('/snacks/rate', data);
    }

    async toggleFavorite(
        snackId: string,
        userId: string
    ): Promise<AxiosResponse<APIResponse<any>>> {
        return this.client.post(`/snacks/${encodeURIComponent(snackId)}/favorite`, null, {
            params: { user_id: userId }
        });
    }

    async getUserFavorites(
        userId: string,
        includeNutrition: boolean = true
    ): Promise<AxiosResponse<APIResponse<any>>> {
        return this.client.get(`/snacks/user/${encodeURIComponent(userId)}/favorites`, {
            params: { include_nutrition: includeNutrition }
        });
    }

    async getTrendingSnacks(params: {
        period_days?: number;
        limit?: number;
    } = {}): Promise<AxiosResponse<APIResponse<any>>> {
        return this.client.get('/snacks/trending', { params });
    }

    async duplicateSnack(
        snackId: string,
        params: {
            user_id?: string;
            name_suffix?: string;
        } = {}
    ): Promise<AxiosResponse<APIResponse<any>>> {
        return this.client.post(`/snacks/${encodeURIComponent(snackId)}/duplicate`, null, { params });
    }

    // Ingredients API methods
    async getAvailableIngredients(params: {
        category?: string;
        limit?: number;
        include_nutrition?: boolean;
    } = {}): Promise<AxiosResponse<APIResponse<any>>> {
        return this.client.get('/ingredients', { params });
    }

    async getIngredientCategories(): Promise<AxiosResponse<APIResponse<any>>> {
        return this.client.get('/ingredients/categories');
    }

    async searchIngredients(data: {
        query: string;
        category?: string;
        dietary_restrictions?: string[];
        limit?: number;
    }): Promise<AxiosResponse<APIResponse<any>>> {
        return this.client.post('/ingredients/search', data);
    }

    async getIngredientDetails(
        ingredientName: string,
        params: {
            include_similar?: boolean;
            include_substitutions?: boolean;
        } = {}
    ): Promise<AxiosResponse<APIResponse<any>>> {
        return this.client.get(`/ingredients/${encodeURIComponent(ingredientName)}`, { params });
    }

    async findSimilarIngredients(data: {
        ingredient_name: string;
        count?: number;
        dietary_restrictions?: string[];
    }): Promise<AxiosResponse<APIResponse<any>>> {
        return this.client.post('/ingredients/similar', data);
    }

    async getSubstitutionSuggestions(data: {
        ingredient_name: string;
        dietary_restrictions?: string[];
        recipe_context?: string[];
        substitution_reason?: string;
    }): Promise<AxiosResponse<APIResponse<any>>> {
        return this.client.post('/ingredients/substitute', data);
    }

    async checkIngredientCompatibility(data: {
        ingredients: string[];
        new_ingredient: string;
    }): Promise<AxiosResponse<APIResponse<IngredientCompatibility>>> {
        return this.client.post('/ingredients/compatibility', data);
    }

    async compareIngredients(data: {
        ingredient_a: string;
        ingredient_b: string;
    }): Promise<AxiosResponse<APIResponse<any>>> {
        return this.client.post('/ingredients/compare', data);
    }

    async getTrendingIngredients(params: {
        category?: string;
        period?: string;
        limit?: number;
    } = {}): Promise<AxiosResponse<APIResponse<any>>> {
        return this.client.get('/ingredients/recommendations/trending', { params });
    }

    // User and preferences methods
    async getUserSnacks(userId?: string): Promise<AxiosResponse<APIResponse<any>>> {
        if (userId) {
            return this.getSnackLibrary({ user_id: userId });
        }
        // Return demo snacks if no user ID
        return this.client.get('/snacks/library', { params: { limit: 20 } });
    }

    async updateUserPreferences(data: any): Promise<AxiosResponse<APIResponse<any>>> {
        // This would typically be a user preferences endpoint
        // For now, we'll store in localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem('user_preferences', JSON.stringify(data));
        }
        return Promise.resolve({
            data: { success: true, data: data, message: 'Preferences updated' }
        } as AxiosResponse<APIResponse<any>>);
    }

    async getUserPreferences(): Promise<AxiosResponse<APIResponse<any>>> {
        // For now, return from localStorage
        let preferences = {};
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('user_preferences');
            preferences = stored ? JSON.parse(stored) : {};
        }

        return Promise.resolve({
            data: {
                success: true,
                data: preferences,
                message: 'Preferences retrieved'
            }
        } as AxiosResponse<APIResponse<any>>);
    }

    // Health and analytics methods
    async getHealthInsights(userId?: string): Promise<AxiosResponse<APIResponse<any>>> {
        // Mock implementation - would call analytics endpoint
        return Promise.resolve({
            data: {
                success: true,
                data: {
                    average_health_score: 75,
                    total_snacks_created: 12,
                    favorite_categories: ['nuts_seeds', 'fruits'],
                    improvement_areas: ['increase_fiber', 'reduce_sugar']
                },
                message: 'Health insights retrieved'
            }
        } as AxiosResponse<APIResponse<any>>);
    }

    // Utility methods
    async healthCheck(): Promise<AxiosResponse<APIResponse<any>>> {
        return this.client.get('/health');
    }

    // Error handling utilities with proper type safety
    handleError(error: AxiosError): string {
        if (error.response) {
            // Server responded with error status
            const status = error.response.status;
            const data = error.response.data as APIError;

            if (status === 400) {
                return data?.detail || data?.message || 'Invalid request data';
            } else if (status === 401) {
                return 'Authentication required';
            } else if (status === 403) {
                return 'Permission denied';
            } else if (status === 404) {
                return 'Resource not found';
            } else if (status === 429) {
                return 'Too many requests. Please try again later.';
            } else if (status >= 500) {
                return 'Server error. Please try again later.';
            }

            return data?.detail || data?.message || `Error ${status}`;
        } else if (error.request) {
            // Network error
            return 'Network error. Please check your connection.';
        } else {
            // Other error
            return error.message || 'An unexpected error occurred';
        }
    }

    // Request cancellation
    private cancelTokens: Map<string, AbortController> = new Map();

    cancelRequest(requestId: string): void {
        const controller = this.cancelTokens.get(requestId);
        if (controller) {
            controller.abort();
            this.cancelTokens.delete(requestId);
        }
    }

    // Cache management (simple in-memory cache)
    private cache: Map<string, { data: any; expiry: number }> = new Map();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    private getCacheKey(endpoint: string, params?: any): string {
        return `${endpoint}${params ? `-${JSON.stringify(params)}` : ''}`;
    }

    private getFromCache<T>(key: string): T | null {
        const cached = this.cache.get(key);
        if (cached && cached.expiry > Date.now()) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    private setCache<T>(key: string, data: T): void {
        this.cache.set(key, {
            data,
            expiry: Date.now() + this.CACHE_TTL
        });
    }

    // Cached versions of frequently called methods
    async getCachedIngredientDetails(ingredientName: string): Promise<AxiosResponse<APIResponse<any>>> {
        const cacheKey = this.getCacheKey(`ingredient-${ingredientName}`);
        const cached = this.getFromCache<AxiosResponse<APIResponse<any>>>(cacheKey);

        if (cached) {
            return cached;
        }

        const result = await this.getIngredientDetails(ingredientName);
        this.setCache(cacheKey, result);
        return result;
    }

    async getCachedNutritionTargets(): Promise<AxiosResponse<APIResponse<any>>> {
        const cacheKey = this.getCacheKey('nutrition-targets');
        const cached = this.getFromCache<AxiosResponse<APIResponse<any>>>(cacheKey);

        if (cached) {
            return cached;
        }

        const result = await this.getNutritionTargets();
        this.setCache(cacheKey, result);
        return result;
    }

    // Clear cache
    clearCache(): void {
        this.cache.clear();
    }
}

// Create and export singleton instance
export const api = new APIClient();

// Export the class for testing or custom instances
export { APIClient };

// Helper functions for common operations
export const nutritionHelpers = {
    formatNutrientValue: (value: number, unit: string): string => {
        if (unit === 'g') {
            return `${value.toFixed(1)}g`;
        } else if (unit === 'mg') {
            return value < 1000 ? `${Math.round(value)}mg` : `${(value / 1000).toFixed(1)}g`;
        }
        return `${value.toFixed(1)}${unit}`;
    },

    calculateCaloriesFromMacros: (protein: number, carbs: number, fat: number): number => {
        return (protein * 4) + (carbs * 4) + (fat * 9);
    },

    getHealthScoreColor: (score: number): string => {
        if (score >= 80) return '#10B981'; // green
        if (score >= 60) return '#F59E0B'; // yellow
        if (score >= 40) return '#F97316'; // orange
        return '#EF4444'; // red
    },

    getMacroPercentages: (protein: number, carbs: number, fat: number) => {
        const total = protein + carbs + fat;
        if (total === 0) return { protein: 0, carbs: 0, fat: 0 };

        return {
            protein: Math.round((protein / total) * 100),
            carbs: Math.round((carbs / total) * 100),
            fat: Math.round((fat / total) * 100)
        };
    }
};

// Type guards for API responses
export const typeGuards = {
    isAPIResponse: <T>(response: any): response is APIResponse<T> => {
        return response && typeof response.success === 'boolean' && 'data' in response && 'message' in response;
    },

    isNutritionAnalysis: (data: any): data is NutritionAnalysis => {
        return data &&
            'nutrition_per_serving' in data &&
            'nutrition_per_100g' in data &&
            'health_score' in data;
    },

    isPaginatedResponse: <T>(data: any): data is PaginatedResponse<T> => {
        return data && 'items' in data && 'pagination' in data;
    }
};