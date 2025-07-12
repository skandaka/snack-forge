// src/api/client.ts
import axios from "axios";

const API_BASE = 'http://localhost:8000'

export const api = {
    calculateNutrition: (ingredients: Ingredient[]) =>
        axios.post(`${API_BASE}/nutrition/calculate`, { ingredients }),

    getAIRecommendation: (snack: Snack, goal: string) =>
        axios.post(`${API_BASE}/ai/recommend`, { snack, goal }),

    findSimilarIngredients: (ingredient: string) =>
        axios.get(`${API_BASE}/ingredients/similar/${ingredient}`)
}