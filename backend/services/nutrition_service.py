import json
import logging
from typing import Dict, List, Any, Optional, Tuple
import numpy as np
from models.health_scorer import HealthScorer

logger = logging.getLogger(__name__)


class NutritionService:
    def __init__(self, health_scorer: HealthScorer):
        self.health_scorer = health_scorer
        self.ingredient_database = self._load_ingredient_database()

    def _load_ingredient_database(self) -> Dict[str, Dict[str, Any]]:
        """Load ingredient nutrition database"""
        try:
            with open("data/ingredients.json", "r") as f:
                return json.load(f)
        except FileNotFoundError:
            logger.warning("Ingredient database not found, using empty database")
            return {}

    def calculate_snack_nutrition(self, ingredients: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate complete nutrition for a snack recipe"""
        if not ingredients:
            return self._empty_nutrition()

        total_nutrition = self._initialize_nutrition_totals()
        total_weight = 0
        ingredient_details = []
        allergens = set()

        for ingredient in ingredients:
            name = ingredient.get("name", "").lower()
            amount_g = ingredient.get("amount_g", 0)

            if name not in self.ingredient_database:
                logger.warning(f"Ingredient '{name}' not found in database")
                continue

            ingredient_data = self.ingredient_database[name]
            nutrition_per_100g = ingredient_data["nutrition"]

            # Calculate nutrition for this amount
            multiplier = amount_g / 100.0
            ingredient_nutrition = {}

            for nutrient, value_per_100g in nutrition_per_100g.items():
                contribution = value_per_100g * multiplier
                total_nutrition[nutrient] += contribution
                ingredient_nutrition[nutrient] = contribution

            # Add allergens
            allergens.update(ingredient_data.get("allergens", []))

            # Store ingredient details
            ingredient_details.append({
                "name": name,
                "amount_g": amount_g,
                "nutrition": ingredient_nutrition,
                "properties": ingredient_data.get("properties", {}),
                "category": ingredient_data.get("category", "unknown")
            })

            total_weight += amount_g

        # Calculate per-serving and per-100g values
        nutrition_per_serving = total_nutrition.copy()
        nutrition_per_100g = {}

        if total_weight > 0:
            for nutrient, total_value in total_nutrition.items():
                nutrition_per_100g[nutrient] = (total_value / total_weight) * 100
        else:
            nutrition_per_100g = total_nutrition.copy()

        # Calculate health score
        health_analysis = self.health_scorer.predict_health_score(nutrition_per_100g)

        # Calculate additional metrics
        macros = self._calculate_macros(nutrition_per_serving)
        glycemic_load = self._calculate_glycemic_load(ingredient_details, total_weight)
        sustainability_score = self._calculate_sustainability_score(ingredient_details)

        return {
            "nutrition_per_serving": nutrition_per_serving,
            "nutrition_per_100g": nutrition_per_100g,
            "total_weight_g": total_weight,
            "health_score": health_analysis["health_score"],
            "health_confidence": health_analysis["confidence"],
            "health_explanation": health_analysis["explanation"],
            "macros": macros,
            "allergens": list(allergens),
            "glycemic_load": glycemic_load,
            "sustainability_score": sustainability_score,
            "ingredient_breakdown": ingredient_details,
            "nutritional_highlights": self._generate_nutritional_highlights(nutrition_per_100g, ingredient_details),
            "recommendations": self._generate_recommendations(nutrition_per_100g, ingredient_details)
        }

    def _initialize_nutrition_totals(self) -> Dict[str, float]:
        """Initialize nutrition totals dictionary"""
        return {
            "calories_per_100g": 0.0,
            "protein_g": 0.0,
            "total_fat_g": 0.0,
            "saturated_fat_g": 0.0,
            "carbohydrates_g": 0.0,
            "sugars_g": 0.0,
            "fiber_g": 0.0,
            "sodium_mg": 0.0,
            "potassium_mg": 0.0,
            "vitamin_c_mg": 0.0,
            "calcium_mg": 0.0,
            "iron_mg": 0.0
        }

    def _empty_nutrition(self) -> Dict[str, Any]:
        """Return empty nutrition data"""
        return {
            "nutrition_per_serving": self._initialize_nutrition_totals(),
            "nutrition_per_100g": self._initialize_nutrition_totals(),
            "total_weight_g": 0,
            "health_score": 0,
            "health_confidence": 0,
            "health_explanation": "No ingredients provided",
            "macros": {"protein_percent": 0, "carb_percent": 0, "fat_percent": 0},
            "allergens": [],
            "glycemic_load": 0,
            "sustainability_score": 0,
            "ingredient_breakdown": [],
            "nutritional_highlights": [],
            "recommendations": []
        }

    def _calculate_macros(self, nutrition: Dict[str, float]) -> Dict[str, float]:
        """Calculate macronutrient percentages"""
        protein_calories = nutrition["protein_g"] * 4
        carb_calories = nutrition["carbohydrates_g"] * 4
        fat_calories = nutrition["total_fat_g"] * 9
        total_calories = max(protein_calories + carb_calories + fat_calories, 1)

        return {
            "protein_percent": round((protein_calories / total_calories) * 100, 1),
            "carb_percent": round((carb_calories / total_calories) * 100, 1),
            "fat_percent": round((fat_calories / total_calories) * 100, 1),
            "protein_calories": protein_calories,
            "carb_calories": carb_calories,
            "fat_calories": fat_calories
        }

    def _calculate_glycemic_load(self, ingredients: List[Dict[str, Any]], total_weight: float) -> float:
        """Calculate estimated glycemic load"""
        total_gl = 0

        for ingredient in ingredients:
            carbs = ingredient["nutrition"].get("carbohydrates_g", 0)
            properties = ingredient.get("properties", {})
            gi = properties.get("glycemic_index", 50)  # Default moderate GI

            # Glycemic Load = (GI × Carbs) / 100
            gl = (gi * carbs) / 100
            total_gl += gl

        return round(total_gl, 1)

    def _calculate_sustainability_score(self, ingredients: List[Dict[str, Any]]) -> float:
        """Calculate weighted sustainability score"""
        if not ingredients:
            return 0

        total_score = 0
        total_weight = 0

        for ingredient in ingredients:
            weight = ingredient["amount_g"]
            properties = ingredient.get("properties", {})
            sustainability = properties.get("sustainability_score", 0.5)

            total_score += sustainability * weight
            total_weight += weight

        return round((total_score / max(total_weight, 1)) * 100, 1)

    def _generate_nutritional_highlights(self, nutrition: Dict[str, float], ingredients: List[Dict[str, Any]]) -> List[str]:
        """Generate key nutritional highlights"""
        highlights = []

        # Protein analysis
        protein = nutrition.get("protein_g", 0)
        if protein > 20:
            highlights.append(f"Excellent protein source ({protein:.1f}g per 100g)")
        elif protein > 10:
            highlights.append(f"Good protein content ({protein:.1f}g per 100g)")

        # Fiber analysis
        fiber = nutrition.get("fiber_g", 0)
        if fiber > 15:
            highlights.append(f"Very high fiber content ({fiber:.1f}g per 100g)")
        elif fiber > 8:
            highlights.append(f"High fiber content ({fiber:.1f}g per 100g)")
        elif fiber > 3:
            highlights.append(f"Good fiber source ({fiber:.1f}g per 100g)")

        # Sugar analysis
        sugar = nutrition.get("sugars_g", 0)
        if sugar < 5:
            highlights.append("Low sugar content")
        elif sugar > 25:
            highlights.append(f"High sugar content ({sugar:.1f}g per 100g)")

        # Antioxidant analysis
        antioxidant_ingredients = [ing for ing in ingredients
                                   if ing.get("properties", {}).get("antioxidant_score", 0) > 70]
        if antioxidant_ingredients:
            names = [ing["name"] for ing in antioxidant_ingredients]
            highlights.append(f"Rich in antioxidants from {', '.join(names)}")

        # Healthy fats
        healthy_fat_ingredients = [ing for ing in ingredients
                                   if ing["category"] in ["nuts_seeds"] and
                                   ing.get("properties", {}).get("processing_level", 5) <= 2]
        if healthy_fat_ingredients:
            highlights.append("Contains healthy unsaturated fats")

        # Micronutrients
        iron = nutrition.get("iron_mg", 0)
        calcium = nutrition.get("calcium_mg", 0)
        potassium = nutrition.get("potassium_mg", 0)

        if iron > 5:
            highlights.append(f"Good source of iron ({iron:.1f}mg per 100g)")
        if calcium > 100:
            highlights.append(f"Good source of calcium ({calcium:.0f}mg per 100g)")
        if potassium > 500:
            highlights.append(f"High in potassium ({potassium:.0f}mg per 100g)")

        return highlights[:5]  # Limit to top 5 highlights

    def _generate_recommendations(self, nutrition: Dict[str, float], ingredients: List[Dict[str, Any]]) -> List[str]:
        """Generate improvement recommendations"""
        recommendations = []

        # Protein recommendations
        protein = nutrition.get("protein_g", 0)
        if protein < 8:
            recommendations.append("Consider adding protein powder, nuts, or seeds to increase protein content")

        # Fiber recommendations
        fiber = nutrition.get("fiber_g", 0)
        if fiber < 3:
            recommendations.append("Add more fiber with chia seeds, flax seeds, or oats")

        # Sugar recommendations
        sugar = nutrition.get("sugars_g", 0)
        if sugar > 20:
            recommendations.append("Consider reducing added sweeteners or using lower-sugar alternatives like stevia")

        # Sodium recommendations
        sodium = nutrition.get("sodium_mg", 0)
        if sodium > 400:
            recommendations.append("Consider reducing sodium content for better heart health")

        # Processing level recommendations
        high_processing = [ing for ing in ingredients
                           if ing.get("properties", {}).get("processing_level", 0) > 3]
        if len(high_processing) > len(ingredients) * 0.5:
            recommendations.append("Try incorporating more whole food ingredients to reduce processing")

        # Antioxidant recommendations
        antioxidant_total = sum(ing.get("properties", {}).get("antioxidant_score", 0)
                                for ing in ingredients) / max(len(ingredients), 1)
        if antioxidant_total < 50:
            recommendations.append("Add berries, dark chocolate, or cinnamon to boost antioxidant content")

        # Balance recommendations
        macros = self._calculate_macros(nutrition)
        if macros["fat_percent"] > 60:
            recommendations.append("Consider adding more protein or complex carbs to balance macronutrients")
        elif macros["carb_percent"] > 70:
            recommendations.append("Add healthy fats or protein to slow sugar absorption")

        return recommendations[:4]  # Limit to top 4 recommendations

    def analyze_ingredient_contribution(self, ingredients: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze each ingredient's contribution to overall nutrition"""
        total_nutrition = self.calculate_snack_nutrition(ingredients)
        total_calories = total_nutrition["nutrition_per_serving"]["calories_per_100g"]

        contributions = []

        for ingredient_detail in total_nutrition["ingredient_breakdown"]:
            name = ingredient_detail["name"]
            nutrition = ingredient_detail["nutrition"]
            calories = nutrition["calories_per_100g"]

            contribution = {
                "name": name,
                "calorie_contribution_percent": round((calories / max(total_calories, 1)) * 100, 1),
                "protein_contribution_g": nutrition["protein_g"],
                "fiber_contribution_g": nutrition["fiber_g"],
                "sugar_contribution_g": nutrition["sugars_g"],
                "key_benefits": self._get_ingredient_benefits(name)
            }

            contributions.append(contribution)

        # Sort by calorie contribution
        contributions.sort(key=lambda x: x["calorie_contribution_percent"], reverse=True)

        return {
            "ingredient_contributions": contributions,
            "total_ingredients": len(contributions),
            "primary_contributor": contributions[0]["name"] if contributions else None
        }

    def _get_ingredient_benefits(self, ingredient_name: str) -> List[str]:
        """Get key health benefits of an ingredient"""
        if ingredient_name not in self.ingredient_database:
            return []

        data = self.ingredient_database[ingredient_name]
        nutrition = data["nutrition"]
        properties = data.get("properties", {})

        benefits = []

        # High protein
        if nutrition["protein_g"] > 15:
            benefits.append("High protein")

        # High fiber
        if nutrition["fiber_g"] > 10:
            benefits.append("High fiber")

        # Antioxidants
        if properties.get("antioxidant_score", 0) > 70:
            benefits.append("Rich antioxidants")

        # Healthy fats
        if (nutrition["total_fat_g"] > 10 and
                nutrition["saturated_fat_g"] / max(nutrition["total_fat_g"], 1) < 0.3):
            benefits.append("Healthy fats")

        # Low glycemic
        if properties.get("glycemic_index", 100) < 35:
            benefits.append("Low glycemic")

        # Micronutrients
        if nutrition["iron_mg"] > 3:
            benefits.append("Iron source")
        if nutrition["calcium_mg"] > 100:
            benefits.append("Calcium source")
        if nutrition["potassium_mg"] > 400:
            benefits.append("Potassium source")

        return benefits[:3]  # Limit to top 3 benefits

    def suggest_nutritional_improvements(self, current_nutrition: Dict[str, Any],
                                         health_goals: List[str]) -> Dict[str, Any]:
        """Suggest specific improvements based on health goals"""
        suggestions = {
            "ingredient_additions": [],
            "ingredient_substitutions": [],
            "portion_adjustments": [],
            "general_tips": []
        }

        current_score = current_nutrition.get("health_score", 0)
        nutrition = current_nutrition.get("nutrition_per_100g", {})

        for goal in health_goals:
            if goal == "increase_protein":
                if nutrition.get("protein_g", 0) < 15:
                    suggestions["ingredient_additions"].extend([
                        "Add protein powder for +15-20g protein",
                        "Include Greek yogurt powder for natural protein boost",
                        "Mix in hemp seeds for complete amino acids"
                    ])

            elif goal == "reduce_sugar":
                if nutrition.get("sugars_g", 0) > 15:
                    suggestions["ingredient_substitutions"].extend([
                        "Replace dates with stevia-sweetened alternatives",
                        "Use unsweetened cocoa powder instead of chocolate chips",
                        "Substitute maple syrup with monk fruit sweetener"
                    ])

            elif goal == "increase_fiber":
                if nutrition.get("fiber_g", 0) < 8:
                    suggestions["ingredient_additions"].extend([
                        "Add chia seeds for +10g fiber per tablespoon",
                        "Include psyllium husk for soluble fiber",
                        "Mix in ground flax seeds for omega-3s and fiber"
                    ])

            elif goal == "keto_friendly":
                carbs = nutrition.get("carbohydrates_g", 0)
                if carbs > 20:
                    suggestions["ingredient_substitutions"].extend([
                        "Replace oats with almond flour",
                        "Use MCT oil instead of honey",
                        "Substitute fruits with small amounts of berries"
                    ])

            elif goal == "increase_antioxidants":
                suggestions["ingredient_additions"].extend([
                    "Add goji berries for vitamin C and zeaxanthin",
                    "Include raw cacao for flavonoids",
                    "Mix in turmeric powder for curcumin"
                ])

            elif goal == "post_workout":
                protein = nutrition.get("protein_g", 0)
                carbs = nutrition.get("carbohydrates_g", 0)
                if protein < 20 or carbs < 30:
                    suggestions["ingredient_additions"].extend([
                        "Add whey protein for fast absorption",
                        "Include banana powder for quick carbs",
                        "Mix in BCAAs for muscle recovery"
                    ])

        # Remove duplicates and limit suggestions
        for category in suggestions:
            suggestions[category] = list(dict.fromkeys(suggestions[category]))[:3]

        # Add general tips based on current nutrition
        if current_score < 60:
            suggestions["general_tips"].extend([
                "Focus on whole food ingredients",
                "Aim for balanced macronutrients",
                "Consider reducing processing level"
            ])

        return suggestions

    def compare_snack_versions(self, version_a: List[Dict[str, Any]],
                               version_b: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Compare two versions of a snack recipe"""
        nutrition_a = self.calculate_snack_nutrition(version_a)
        nutrition_b = self.calculate_snack_nutrition(version_b)

        comparison = {
            "version_a": nutrition_a,
            "version_b": nutrition_b,
            "differences": {},
            "winner_by_metric": {},
            "overall_recommendation": ""
        }

        # Compare key metrics
        metrics = [
            "health_score", "protein_g", "fiber_g", "sugars_g",
            "calories_per_100g", "sustainability_score"
        ]

        for metric in metrics:
            if metric == "health_score":
                val_a = nutrition_a.get(metric, 0)
                val_b = nutrition_b.get(metric, 0)
            else:
                val_a = nutrition_a.get("nutrition_per_100g", {}).get(metric, 0)
                val_b = nutrition_b.get("nutrition_per_100g", {}).get(metric, 0)

            diff = val_b - val_a
            diff_percent = (diff / max(val_a, 0.1)) * 100

            comparison["differences"][metric] = {
                "absolute_difference": round(diff, 2),
                "percent_difference": round(diff_percent, 1),
                "version_a_value": round(val_a, 2),
                "version_b_value": round(val_b, 2)
            }

            # Determine winner (higher is better except for sugars and calories)
            if metric in ["sugars_g", "calories_per_100g"]:
                comparison["winner_by_metric"][metric] = "A" if val_a < val_b else "B"
            else:
                comparison["winner_by_metric"][metric] = "A" if val_a > val_b else "B"

        # Overall recommendation
        a_wins = sum(1 for winner in comparison["winner_by_metric"].values() if winner == "A")
        b_wins = sum(1 for winner in comparison["winner_by_metric"].values() if winner == "B")

        if a_wins > b_wins:
            comparison["overall_recommendation"] = "Version A is nutritionally superior"
        elif b_wins > a_wins:
            comparison["overall_recommendation"] = "Version B is nutritionally superior"
        else:
            comparison["overall_recommendation"] = "Both versions are nutritionally similar"

        return comparison
