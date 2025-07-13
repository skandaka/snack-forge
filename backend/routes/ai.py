from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import logging
import json

logger = logging.getLogger(__name__)

router = APIRouter()


class SnackRecommendationRequest(BaseModel):
    preferences: Dict[str, Any] = Field(..., description="User preferences")
    health_goals: List[str] = Field(..., description="Health and nutrition goals")
    dietary_restrictions: Optional[List[str]] = Field(default=[], description="Dietary restrictions")


class RecipeImprovementRequest(BaseModel):
    current_recipe: List[Dict[str, Any]] = Field(..., description="Current recipe ingredients")
    improvement_goals: List[str] = Field(..., description="Areas to improve")
    user_preferences: Optional[Dict[str, Any]] = Field(default={}, description="User taste preferences")


class ChatRequest(BaseModel):
    message: str = Field(..., description="User's message or question")
    snack_context: Optional[Dict[str, Any]] = Field(default=None, description="Current snack being discussed")
    conversation_id: Optional[str] = Field(default=None, description="Conversation session ID")


class IngredientSubstitutionRequest(BaseModel):
    ingredient_name: str = Field(..., description="Ingredient to substitute")
    dietary_restrictions: List[str] = Field(default=[], description="Dietary requirements")
    recipe_context: List[Dict[str, Any]] = Field(..., description="Full recipe context")
    substitution_reason: Optional[str] = Field(default=None, description="Reason for substitution")


class SnackVariationRequest(BaseModel):
    base_recipe: List[Dict[str, Any]] = Field(..., description="Base recipe to create variations from")
    variation_themes: List[str] = Field(..., description="Themes for variations")
    keep_base_nutrition: Optional[bool] = Field(default=False, description="Try to maintain similar nutrition")


class TrendsAnalysisRequest(BaseModel):
    user_snacks: List[Dict[str, Any]] = Field(..., description="User's historical snack data")
    analysis_period_days: Optional[int] = Field(default=30, description="Period to analyze")


def get_ai_service(request: Request):
    """Dependency to get AI service from app state"""
    return request.app.state.ai_service


def get_nutrition_service(request: Request):
    """Dependency to get nutrition service from app state"""
    return request.app.state.nutrition_service


@router.post("/recommend")
async def generate_snack_recommendation(
        request: SnackRecommendationRequest,
        ai_service=Depends(get_ai_service)
):
    try:
        enhanced_preferences = {}
        if request.preferences:
            enhanced_preferences = dict(request.preferences)
        enhanced_preferences["dietary_restrictions"] = request.dietary_restrictions or []

        try:
            recommendation = await ai_service.generate_snack_recommendation(
                enhanced_preferences, request.health_goals
            )
        except Exception as e:
            logger.error(f"AI service error: {str(e)}")
            recommendation = _create_fallback_recommendation(enhanced_preferences, request.health_goals)

        return {
            "success": True,
            "data": {
                "recommendation": recommendation,
                "preferences_used": enhanced_preferences,
                "health_goals": request.health_goals,
                "generation_method": "ai_powered" if ai_service.openai_available else "rule_based"
            },
            "message": "Snack recommendation generated successfully"
        }

    except Exception as e:
        logger.error(f"Snack recommendation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Recommendation generation failed: {str(e)}")


@router.post("/improve")
async def improve_recipe(
        request: RecipeImprovementRequest,
        ai_service=Depends(get_ai_service)
):
    try:
        if not request.current_recipe:
            raise HTTPException(status_code=400, detail="Current recipe is required")

        formatted_recipe = []
        for ingredient in request.current_recipe:
            if isinstance(ingredient, dict) and 'name' in ingredient and 'amount_g' in ingredient:
                formatted_recipe.append({
                    'name': str(ingredient['name']),
                    'amount_g': float(ingredient['amount_g'])
                })
            else:
                logger.warning(f"Invalid ingredient format: {ingredient}")
                continue

        if not formatted_recipe:
            raise HTTPException(status_code=400, detail="No valid ingredients found in recipe")

        try:
            improvements = await ai_service.improve_snack_recipe(
                formatted_recipe, request.improvement_goals
            )
        except Exception as e:
            logger.error(f"AI improvement error: {str(e)}")
            improvements = _create_fallback_improvements(request.improvement_goals)

        if request.user_preferences:
            improvements["preference_notes"] = _generate_preference_notes(
                improvements, request.user_preferences
            )

        return {
            "success": True,
            "data": {
                "improvements": improvements,
                "original_recipe": formatted_recipe,
                "goals": request.improvement_goals,
                "implementation_tips": _generate_implementation_tips(improvements)
            },
            "message": f"Recipe improvements generated for {len(request.improvement_goals)} goals"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Recipe improvement error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Recipe improvement failed: {str(e)}")


@router.post("/chat")
async def chat_with_nutritionist(
        request: ChatRequest,
        ai_service=Depends(get_ai_service)
):
    try:
        if not request.message or not request.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")

        try:
            response = await ai_service.chat_about_nutrition(
                request.message, request.snack_context
            )
        except Exception as e:
            logger.error(f"AI chat error: {str(e)}")
            response = _create_fallback_chat_response(request.message)

        # Generate follow-up suggestions if appropriate
        follow_ups = _generate_follow_up_suggestions(request.message, response)

        return {
            "success": True,
            "data": {
                "response": response,
                "conversation_id": request.conversation_id,
                "follow_up_suggestions": follow_ups,
                "context_used": request.snack_context is not None
            },
            "message": "Chat response generated"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat response failed: {str(e)}")


@router.post("/substitute")
async def suggest_substitutions(
        request: IngredientSubstitutionRequest,
        ai_service=Depends(get_ai_service)
):
    try:
        if not request.ingredient_name or not request.ingredient_name.strip():
            raise HTTPException(status_code=400, detail="Ingredient name is required")

        formatted_context = []
        for item in request.recipe_context:
            if isinstance(item, dict) and 'name' in item:
                formatted_context.append({
                    'name': str(item['name']),
                    'amount_g': float(item.get('amount_g', 25))
                })

        try:
            substitutions = await ai_service.suggest_ingredient_substitutions(
                request.ingredient_name.strip(),
                request.dietary_restrictions or [],
                formatted_context
            )
        except Exception as e:
            logger.error(f"AI substitution error: {str(e)}")
            substitutions = _create_fallback_substitutions(request.ingredient_name)

        if substitutions and isinstance(substitutions, dict) and 'suggestions' in substitutions:
            substitutions["context_analysis"] = _analyze_substitution_context(
                request.ingredient_name, formatted_context, request.substitution_reason
            )

        return {
            "success": True,
            "data": substitutions,
            "message": f"Found {len(substitutions.get('suggestions', []))} substitution options"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Substitution suggestion error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Substitution suggestions failed: {str(e)}")


@router.get("/goals")
async def get_available_goals():
    return {
        "success": True,
        "data": {
            "health_goals": [
                "increase_protein",
                "reduce_sugar",
                "increase_fiber",
                "keto_friendly",
                "increase_antioxidants",
                "post_workout",
                "pre_workout",
                "weight_management",
                "heart_healthy",
                "diabetic_friendly",
                "anti_inflammatory",
                "energy_boost"
            ],
            "improvement_goals": [
                "increase_protein",
                "reduce_sugar",
                "increase_fiber",
                "reduce_calories",
                "increase_healthy_fats",
                "reduce_sodium",
                "increase_vitamins",
                "improve_taste",
                "better_texture",
                "longer_shelf_life"
            ],
            "variation_themes": [
                "tropical",
                "chocolate_lovers",
                "protein_packed",
                "antioxidant_rich",
                "low_sugar",
                "crunchy",
                "creamy",
                "spiced",
                "energizing",
                "kid_friendly",
                "gourmet",
                "seasonal"
            ],
            "dietary_restrictions": [
                "vegan",
                "vegetarian",
                "gluten_free",
                "nut_free",
                "dairy_free",
                "soy_free",
                "keto",
                "paleo",
                "low_carb",
                "low_fat"
            ]
        },
        "message": "Available goals and options"
    }


# Helper functions for fallback responses

def _create_fallback_recommendation(preferences: Dict[str, Any], goals: List[str]) -> Dict[str, Any]:
    base_ingredients = [
        {"name": "oats", "amount_g": 40},
        {"name": "almonds", "amount_g": 30},
        {"name": "dates", "amount_g": 25}
    ]

    if "increase_protein" in goals:
        base_ingredients.append({"name": "protein_powder_plant", "amount_g": 20})

    if "antioxidant_rich" in goals or "increase_antioxidants" in goals:
        base_ingredients.append({"name": "blueberries_dried", "amount_g": 15})

    if "keto_friendly" in goals:
        base_ingredients = [ing for ing in base_ingredients if ing["name"] != "oats"]
        base_ingredients.append({"name": "coconut_flakes", "amount_g": 25})

    return {
        "name": "Healthy Energy Bites",
        "description": "Nutritious energy bites based on your preferences",
        "ingredients": base_ingredients,
        "instructions": [
            "Pulse oats in food processor until roughly chopped",
            "Add nuts and process briefly",
            "Add dates and process until mixture sticks together",
            "Form into small balls",
            "Refrigerate for 30 minutes"
        ],
        "prep_time_minutes": 15,
        "key_benefits": ["Natural energy", "Protein rich", "Fiber source"]
    }


def _create_fallback_improvements(goals: List[str]) -> Dict[str, Any]:
    suggestions = []

    if "increase_protein" in goals:
        suggestions.append({
            "type": "add",
            "ingredient": "protein_powder_plant",
            "amount_g": 20,
            "reason": "Boost protein content for muscle support"
        })

    if "increase_fiber" in goals:
        suggestions.append({
            "type": "add",
            "ingredient": "chia_seeds",
            "amount_g": 15,
            "reason": "Add fiber for digestive health"
        })

    if "reduce_sugar" in goals:
        suggestions.append({
            "type": "reduce",
            "ingredient": "dates",
            "new_amount_g": 15,
            "reason": "Lower natural sugar content"
        })

    return {
        "suggested_changes": suggestions,
        "expected_improvements": [f"Addresses {goal.replace('_', ' ')}" for goal in goals],
        "estimated_new_score": 75
    }


def _create_fallback_substitutions(ingredient_name: str) -> Dict[str, Any]:

    substitution_map = {
        "almonds": ["walnuts", "cashews"],
        "walnuts": ["almonds", "cashews"],
        "cashews": ["almonds", "walnuts"],
        "dates": ["maple_syrup", "honey"],
        "honey": ["dates", "maple_syrup"],
        "maple_syrup": ["honey", "dates"],
        "oats": ["quinoa"],
        "quinoa": ["oats"],
        "protein_powder_whey": ["protein_powder_plant"],
        "protein_powder_plant": ["protein_powder_whey"],
        "chia_seeds": ["flax_seeds"],
        "flax_seeds": ["chia_seeds"]
    }

    suggestions = []
    potential_subs = substitution_map.get(ingredient_name, [])

    for sub in potential_subs:
        suggestions.append({
            "name": sub,
            "similarity": 0.8,
            "reason": "Similar nutritional profile and culinary use",
            "nutrition_comparison": {
                "protein_g": "similar",
                "fiber_g": "similar",
                "calories_per_100g": "similar"
            }
        })

    return {
        "original_ingredient": ingredient_name,
        "suggestions": suggestions[:3],
        "substitution_tips": [
            "Start with a 1:1 ratio and adjust to taste",
            "Consider texture differences when substituting"
        ]
    }


def _create_fallback_chat_response(message: str) -> str:
    message_lower = message.lower()

    if any(word in message_lower for word in ["protein", "muscle"]):
        return "Protein is essential for muscle building and repair. Good snack sources include nuts, seeds, protein powder, and legumes. Aim for 15-20g protein in post-workout snacks."

    elif any(word in message_lower for word in ["sugar", "sweet"]):
        return "Natural sugars from fruits like dates are generally better than refined sugars. Try pairing sweet ingredients with protein and fiber to slow absorption."

    elif any(word in message_lower for word in ["fiber", "digestion"]):
        return "Fiber supports digestive health and helps you feel full. Great sources for snacks include chia seeds, flax seeds, oats, and berries. Aim for 3-5g fiber per snack."

    elif any(word in message_lower for word in ["fat", "healthy", "omega"]):
        return "Healthy fats from nuts, seeds, and avocados provide sustained energy and support nutrient absorption. Omega-3 rich foods like walnuts and chia seeds are especially beneficial."

    else:
        return "I'd be happy to help you create healthier snacks! Consider focusing on whole food ingredients and balancing protein, healthy fats, and fiber for the most nutritious options."


def _generate_preference_notes(improvements: Dict[str, Any], preferences: Dict[str, Any]) -> List[str]:
    notes = []

    if not improvements or not preferences:
        return notes

    favorite_flavors = preferences.get("flavors", [])

    if "sweet" in favorite_flavors and any(
            "reduce" in str(change) for change in improvements.get("suggested_changes", [])):
        notes.append("Some changes may reduce sweetness - consider adding naturally sweet ingredients like dates")

    if "crunchy" in preferences.get("texture", ""):
        notes.append("Consider adding nuts or seeds to maintain crunchy texture")

    return notes


def _generate_implementation_tips(improvements: Dict[str, Any]) -> List[str]:
    tips = [
        "Make one change at a time to see how it affects taste and texture",
        "Start with smaller amounts of new ingredients and adjust to preference",
        "Keep notes on successful modifications for future reference"
    ]

    if not improvements:
        return tips

    changes = improvements.get("suggested_changes", [])

    if any(change.get("type") == "substitute" for change in changes):
        tips.append("When substituting ingredients, consider texture and moisture differences")

    if any(change.get("type") == "add" for change in changes):
        tips.append("New ingredients may require adjusting binding agents or liquids")

    return tips


def _generate_follow_up_suggestions(user_message: str, ai_response: str) -> List[str]:
    message_lower = user_message.lower()

    if "protein" in message_lower:
        return [
            "How much protein should I aim for?",
            "What are the best plant-based proteins?",
            "Can I have too much protein?"
        ]
    elif "sugar" in message_lower:
        return [
            "What are healthy sugar alternatives?",
            "How does sugar affect energy?",
            "What's the difference between natural and added sugars?"
        ]
    elif "fiber" in message_lower:
        return [
            "What are the benefits of fiber?",
            "How can I increase fiber gradually?",
            "Which ingredients have the most fiber?"
        ]
    else:
        return [
            "Can you help me create a custom recipe?",
            "What's the healthiest snack for my goals?",
            "How do I balance taste and nutrition?"
        ]


def _analyze_substitution_context(ingredient: str, recipe: List[Dict[str, Any]], reason: Optional[str]) -> Dict[
    str, Any]:

    analysis = {
        "recipe_size": len(recipe),
        "substitution_impact": "low" if len(recipe) > 5 else "medium",
        "ingredient_role": "primary" if any(ing["name"] == ingredient for ing in recipe) else "secondary"
    }

    if reason:
        analysis["substitution_reason"] = reason
        if "allergy" in reason.lower():
            analysis["priority"] = "high"
        elif "taste" in reason.lower():
            analysis["priority"] = "medium"
        else:
            analysis["priority"] = "low"

    return analysis