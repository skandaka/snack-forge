from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class IngredientInput(BaseModel):
    name: str = Field(..., description="Ingredient name")
    amount_g: float = Field(..., gt=0, description="Amount in grams")


class NutritionCalculationRequest(BaseModel):
    ingredients: List[IngredientInput]
    serving_size_g: Optional[float] = Field(None, description="Optional serving size override")


class NutritionComparisonRequest(BaseModel):
    recipe_a: List[IngredientInput]
    recipe_b: List[IngredientInput]
    comparison_name_a: Optional[str] = "Recipe A"
    comparison_name_b: Optional[str] = "Recipe B"


class IngredientContributionRequest(BaseModel):
    ingredients: List[IngredientInput]


def get_nutrition_service(request: Request):
    """Dependency to get nutrition service from app state"""
    return request.app.state.nutrition_service


@router.post("/calculate")
async def calculate_nutrition(
        request: NutritionCalculationRequest,
        nutrition_service=Depends(get_nutrition_service)
):
    try:
        ingredients_dict = [
            {"name": ing.name, "amount_g": ing.amount_g}
            for ing in request.ingredients
        ]

        nutrition_analysis = nutrition_service.calculate_snack_nutrition(ingredients_dict)

        if request.serving_size_g:
            serving_multiplier = request.serving_size_g / nutrition_analysis["total_weight_g"]
            nutrition_per_serving = {}

            for nutrient, value in nutrition_analysis["nutrition_per_serving"].items():
                nutrition_per_serving[nutrient] = value * serving_multiplier

            nutrition_analysis["custom_serving"] = {
                "serving_size_g": request.serving_size_g,
                "nutrition": nutrition_per_serving
            }

        return {
            "success": True,
            "data": nutrition_analysis,
            "message": f"Nutrition calculated for {len(request.ingredients)} ingredients"
        }

    except Exception as e:
        logger.error(f"Nutrition calculation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Nutrition calculation failed: {str(e)}")


@router.post("/compare")
async def compare_recipes(
        request: NutritionComparisonRequest,
        nutrition_service=Depends(get_nutrition_service)
):
    try:
        recipe_a_dict = [
            {"name": ing.name, "amount_g": ing.amount_g}
            for ing in request.recipe_a
        ]
        recipe_b_dict = [
            {"name": ing.name, "amount_g": ing.amount_g}
            for ing in request.recipe_b
        ]

        comparison = nutrition_service.compare_snack_versions(recipe_a_dict, recipe_b_dict)

        comparison["recipe_names"] = {
            "recipe_a": request.comparison_name_a,
            "recipe_b": request.comparison_name_b
        }

        return {
            "success": True,
            "data": comparison,
            "message": f"Compared {request.comparison_name_a} vs {request.comparison_name_b}"
        }

    except Exception as e:
        logger.error(f"Recipe comparison error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Recipe comparison failed: {str(e)}")


@router.post("/ingredient-contribution")
async def analyze_ingredient_contribution(
        request: IngredientContributionRequest,
        nutrition_service=Depends(get_nutrition_service)
):
    try:
        ingredients_dict = [
            {"name": ing.name, "amount_g": ing.amount_g}
            for ing in request.ingredients
        ]

        contribution_analysis = nutrition_service.analyze_ingredient_contribution(ingredients_dict)

        return {
            "success": True,
            "data": contribution_analysis,
            "message": "Ingredient contribution analysis completed"
        }

    except Exception as e:
        logger.error(f"Ingredient contribution analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Contribution analysis failed: {str(e)}")


@router.get("/health-score/explain/{score}")
async def explain_health_score(
        score: int,
        protein: Optional[float] = None,
        fiber: Optional[float] = None,
        sugar: Optional[float] = None,
        calories: Optional[float] = None
):
    try:
        if not 0 <= score <= 100:
            raise HTTPException(status_code=400, detail="Health score must be between 0 and 100")

        nutrition_data = {
            "protein_g": protein or 0,
            "fiber_g": fiber or 0,
            "sugars_g": sugar or 0,
            "calories_per_100g": calories or 0
        }

        explanation = generate_score_explanation(score, nutrition_data)

        return {
            "success": True,
            "data": {
                "score": score,
                "explanation": explanation,
                "nutrition_context": nutrition_data
            },
            "message": "Health score explanation generated"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Health score explanation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Explanation generation failed: {str(e)}")


def generate_score_explanation(score: int, nutrition: Dict[str, float]) -> str:

    explanations = []

    if score >= 80:
        explanations.append("This is an excellent health score indicating a very nutritious snack.")
    elif score >= 60:
        explanations.append("This is a good health score showing solid nutritional value.")
    elif score >= 40:
        explanations.append("This is a moderate health score with room for improvement.")
    else:
        explanations.append("This score suggests significant nutritional improvements are needed.")

    protein = nutrition.get("protein_g", 0)
    fiber = nutrition.get("fiber_g", 0)
    sugar = nutrition.get("sugars_g", 0)

    if protein > 15:
        explanations.append("High protein content significantly boosts the score.")
    elif protein < 5:
        explanations.append("Low protein content reduces the score.")

    if fiber > 8:
        explanations.append("Excellent fiber content contributes positively.")
    elif fiber < 3:
        explanations.append("Low fiber content limits the score.")

    if sugar > 25:
        explanations.append("High sugar content significantly reduces the score.")
    elif sugar < 8:
        explanations.append("Low sugar content helps maintain a good score.")

    return " ".join(explanations)


@router.get("/targets")
async def get_nutrition_targets():
    return {
        "success": True,
        "data": {
            "daily_targets": {
                "protein_g": {"min": 46, "max": 56, "description": "For average adult"},
                "fiber_g": {"min": 25, "max": 35, "description": "Daily recommendation"},
                "sugar_g": {"max": 50, "description": "Added sugars limit"},
                "sodium_mg": {"max": 2300, "description": "Daily limit"},
                "calories": {"range": [1800, 2400], "description": "Average adult range"}
            },
            "per_snack_targets": {
                "protein_g": {"ideal": "8-15", "description": "Good protein snack"},
                "fiber_g": {"ideal": "3-8", "description": "Contributes to daily needs"},
                "sugar_g": {"limit": "15", "description": "Moderate sweetness"},
                "calories": {"range": "150-300", "description": "Satisfying snack portion"}
            },
            "health_score_ranges": {
                "excellent": {"range": "80-100", "description": "Nutritionally optimal"},
                "good": {"range": "60-79", "description": "Solid nutrition"},
                "moderate": {"range": "40-59", "description": "Room for improvement"},
                "poor": {"range": "0-39", "description": "Needs significant improvement"}
            }
        },
        "message": "Nutrition targets and guidelines"
    }


@router.get("/nutrients/info/{nutrient}")
async def get_nutrient_info(nutrient: str):

    nutrient_info = {
        "protein": {
            "function": "Building and repairing tissues, immune function, energy",
            "good_sources": ["nuts", "seeds", "protein powder", "quinoa"],
            "daily_needs": "0.8g per kg body weight",
            "benefits": ["Muscle building", "Satiety", "Metabolic support"]
        },
        "fiber": {
            "function": "Digestive health, blood sugar control, cholesterol management",
            "good_sources": ["chia seeds", "flax seeds", "oats", "berries"],
            "daily_needs": "25-35g per day",
            "benefits": ["Digestive health", "Blood sugar stability", "Heart health"]
        },
        "iron": {
            "function": "Oxygen transport, energy production, immune function",
            "good_sources": ["dark chocolate", "pumpkin seeds", "quinoa"],
            "daily_needs": "8-18mg per day",
            "benefits": ["Energy levels", "Immune support", "Cognitive function"]
        },
        "calcium": {
            "function": "Bone health, muscle function, nerve transmission",
            "good_sources": ["almonds", "sesame seeds", "fortified foods"],
            "daily_needs": "1000-1200mg per day",
            "benefits": ["Bone strength", "Muscle function", "Heart health"]
        },
        "potassium": {
            "function": "Fluid balance, muscle contractions, nerve signals",
            "good_sources": ["dates", "nuts", "coconut"],
            "daily_needs": "3500-4700mg per day",
            "benefits": ["Heart health", "Blood pressure", "Muscle function"]
        }
    }

    if nutrient.lower() not in nutrient_info:
        raise HTTPException(status_code = 404, detail = f"Information for nutrient '{nutrient}' not found")
    return {
        "success": True,
        "data": {
            "nutrient": nutrient.lower(),
            "info": nutrient_info[nutrient.lower()]
        },
        "message": f"Information about {nutrient}"
    }

    @router.post("/optimize")
    async def optimize_nutrition(
            current_recipe: List[IngredientInput],
            optimization_goals: List[str],
            nutrition_service=Depends(get_nutrition_service)
    ):
        """Optimize a recipe for specific nutritional goals"""
        try:
            ingredients_dict = [
                {"name": ing.name, "amount_g": ing.amount_g}
                for ing in current_recipe
            ]

            # Get current nutrition
            current_nutrition = nutrition_service.calculate_snack_nutrition(ingredients_dict)

            # Generate optimization suggestions
            suggestions = nutrition_service.suggest_nutritional_improvements(
                current_nutrition, optimization_goals
            )

            return {
                "success": True,
                "data": {
                    "current_nutrition": current_nutrition,
                    "optimization_goals": optimization_goals,
                    "suggestions": suggestions,
                    "potential_improvements": _calculate_potential_improvements(
                        current_nutrition, optimization_goals
                    )
                },
                "message": f"Optimization suggestions generated for {len(optimization_goals)} goals"
            }

        except Exception as e:
            logger.error(f"Nutrition optimization error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")

    def _calculate_potential_improvements(nutrition: Dict[str, Any], goals: List[str]) -> Dict[str, str]:
        """Calculate potential improvements for optimization goals"""

        improvements = {}
        current_score = nutrition.get("health_score", 0)

        for goal in goals:
            if goal == "increase_protein":
                current_protein = nutrition.get("nutrition_per_100g", {}).get("protein_g", 0)
                if current_protein < 15:
                    improvements[goal] = f"Could increase health score by 5-10 points"
                else:
                    improvements[goal] = f"Protein already optimal"

            elif goal == "reduce_sugar":
                current_sugar = nutrition.get("nutrition_per_100g", {}).get("sugars_g", 0)
                if current_sugar > 20:
                    improvements[goal] = f"Could increase health score by 8-15 points"
                else:
                    improvements[goal] = f"Sugar content already moderate"

            elif goal == "increase_fiber":
                current_fiber = nutrition.get("nutrition_per_100g", {}).get("fiber_g", 0)
                if current_fiber < 8:
                    improvements[goal] = f"Could increase health score by 6-12 points"
                else:
                    improvements[goal] = f"Fiber content already good"

            else:
                improvements[goal] = f"Potential for 3-8 point improvement"

        return improvements