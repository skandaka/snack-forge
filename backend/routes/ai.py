from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import logging

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
    """Generate AI-powered snack recommendations based on user preferences"""
    try:
        # Combine dietary restrictions with preferences
        enhanced_preferences = request.preferences.copy()
        enhanced_preferences["dietary_restrictions"] = request.dietary_restrictions

        # Generate recommendation
        recommendation = await ai_service.generate_snack_recommendation(
            enhanced_preferences, request.health_goals
        )

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
    """Get AI-powered suggestions to improve an existing recipe"""
    try:
        improvements = await ai_service.improve_snack_recipe(
            request.current_recipe, request.improvement_goals
        )

        # Add user preference considerations
        if request.user_preferences:
            improvements["preference_notes"] = _generate_preference_notes(
                improvements, request.user_preferences
            )

        return {
            "success": True,
            "data": {
                "improvements": improvements,
                "original_recipe": request.current_recipe,
                "goals": request.improvement_goals,
                "implementation_tips": _generate_implementation_tips(improvements)
            },
            "message": f"Recipe improvements generated for {len(request.improvement_goals)} goals"
        }

    except Exception as e:
        logger.error(f"Recipe improvement error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Recipe improvement failed: {str(e)}")


@router.post("/chat")
async def chat_with_nutritionist(
        request: ChatRequest,
        ai_service=Depends(get_ai_service)
):
    """Chat with AI nutritionist about snacks and nutrition"""
    try:
        response = await ai_service.chat_about_nutrition(
            request.message, request.snack_context
        )

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

    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat response failed: {str(e)}")


@router.post("/substitute")
async def suggest_substitutions(
        request: IngredientSubstitutionRequest,
        ai_service=Depends(get_ai_service)
):
    """Get intelligent ingredient substitution suggestions"""
    try:
        substitutions = await ai_service.suggest_ingredient_substitutions(
            request.ingredient_name,
            request.dietary_restrictions,
            request.recipe_context
        )

        # Add contextual analysis
        substitutions["context_analysis"] = _analyze_substitution_context(
            request.ingredient_name, request.recipe_context, request.substitution_reason
        )

        return {
            "success": True,
            "data": substitutions,
            "message": f"Found {len(substitutions.get('suggestions', []))} substitution options"
        }

    except Exception as e:
        logger.error(f"Substitution suggestion error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Substitution suggestions failed: {str(e)}")


@router.post("/variations")
async def create_recipe_variations(
        request: SnackVariationRequest,
        ai_service=Depends(get_ai_service)
):
    """Generate creative variations of a base recipe"""
    try:
        variations = await ai_service.generate_snack_variations(
            request.base_recipe, request.variation_themes
        )

        # Add difficulty and time estimates
        for theme, variation in variations.get("variations", {}).items():
            variation["difficulty_level"] = _estimate_difficulty(variation)
            variation["prep_time_estimate"] = _estimate_prep_time(variation)

        return {
            "success": True,
            "data": {
                "variations": variations,
                "themes_requested": request.variation_themes,
                "base_recipe": request.base_recipe,
                "nutrition_maintained": request.keep_base_nutrition
            },
            "message": f"Generated {len(request.variation_themes)} recipe variations"
        }

    except Exception as e:
        logger.error(f"Recipe variation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Recipe variation failed: {str(e)}")


@router.post("/analyze-trends")
async def analyze_snacking_trends(
        request: TrendsAnalysisRequest,
        ai_service=Depends(get_ai_service)
):
    """Analyze user's snacking patterns and provide insights"""
    try:
        trends = await ai_service.analyze_snack_trends(request.user_snacks)

        # Add time-based analysis if dates are available
        if any("created_date" in snack for snack in request.user_snacks):
            trends["temporal_analysis"] = _analyze_temporal_patterns(
                request.user_snacks, request.analysis_period_days
            )

        return {
            "success": True,
            "data": {
                "trends": trends,
                "analysis_period": request.analysis_period_days,
                "snacks_analyzed": len(request.user_snacks),
                "personalized_goals": _generate_personalized_goals(trends)
            },
            "message": "Snacking trends analysis completed"
        }

    except Exception as e:
        logger.error(f"Trends analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Trends analysis failed: {str(e)}")


@router.post("/explain-score")
async def explain_health_score_detailed(
        nutrition_data: Dict[str, Any],
        ai_service=Depends(get_ai_service)
):
    """Get detailed AI explanation of health score"""
    try:
        explanation = await ai_service.explain_health_score(nutrition_data)

        # Add improvement roadmap
        improvement_roadmap = _create_improvement_roadmap(nutrition_data)

        return {
            "success": True,
            "data": {
                "explanation": explanation,
                "health_score": nutrition_data.get("health_score", 0),
                "improvement_roadmap": improvement_roadmap,
                "key_factors": _extract_key_factors(nutrition_data)
            },
            "message": "Health score explanation generated"
        }

    except Exception as e:
        logger.error(f"Health score explanation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Score explanation failed: {str(e)}")


@router.get("/goals")
async def get_available_goals():
    """Get list of available health and improvement goals"""
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


# Helper functions

def _generate_preference_notes(improvements: Dict[str, Any], preferences: Dict[str, Any]) -> List[str]:
    """Generate notes about how improvements align with user preferences"""
    notes = []

    favorite_flavors = preferences.get("flavors", [])
    texture_pref = preferences.get("texture", "")

    if "suggested_changes" in improvements:
        for change in improvements["suggested_changes"]:
            if change["type"] == "substitute":
                if any(flavor in change["replacement"].lower() for flavor in favorite_flavors):
                    notes.append(
                        f"Substituting {change['original']} with {change['replacement']} aligns with your {favorite_flavors} preference")

            if change["type"] == "add" and texture_pref:
                if texture_pref in change["ingredient"].lower():
                    notes.append(f"Adding {change['ingredient']} maintains your preferred {texture_pref} texture")

    return notes


def _generate_implementation_tips(improvements: Dict[str, Any]) -> List[str]:
    """Generate practical tips for implementing improvements"""
    tips = []

    if "suggested_changes" in improvements:
        change_types = [change["type"] for change in improvements["suggested_changes"]]

        if "substitute" in change_types:
            tips.append("When substituting ingredients, start with smaller amounts and adjust to taste")

        if "add" in change_types:
            tips.append("Add new ingredients gradually to maintain the snack's texture and binding")

        if "reduce" in change_types:
            tips.append("When reducing ingredients, you may need to add binding agents or adjust liquid ratios")

    tips.append("Make one change at a time to see how it affects taste and texture")
    tips.append("Keep notes on successful modifications for future reference")

    return tips


def _generate_follow_up_suggestions(user_message: str, ai_response: str) -> List[str]:
    """Generate follow-up question suggestions"""

    message_lower = user_message.lower()
    suggestions = []

    if "protein" in message_lower:
        suggestions.extend([
            "How much protein should I aim for in a snack?",
            "What are the best plant-based protein sources?",
            "Can I have too much protein?"
        ])

    elif "sugar" in message_lower:
        suggestions.extend([
            "What are the healthiest natural sweeteners?",
            "How does sugar affect energy levels?",
            "What's the difference between natural and added sugars?"
        ])

    elif "fiber" in message_lower:
        suggestions.extend([
            "What are the benefits of different types of fiber?",
            "How can I increase fiber without digestive issues?",
            "Which ingredients have the most fiber?"
        ])

    else:
        suggestions.extend([
            "Can you help me create a custom snack recipe?",
            "What's the healthiest snack for my goals?",
            "How do I balance taste and nutrition?"
        ])

    return suggestions[:3]  # Limit to 3 suggestions


def _analyze_substitution_context(ingredient: str, recipe: List[Dict[str, Any]], reason: Optional[str]) -> Dict[
    str, Any]:
    """Analyze the context for ingredient substitution"""

    total_ingredients = len(recipe)
    ingredient_categories = {}

    # Categorize existing ingredients (simplified)
    for ing in recipe:
        name = ing["name"].lower()
        if any(x in name for x in ["nut", "almond", "walnut", "cashew"]):
            ingredient_categories["nuts"] = ingredient_categories.get("nuts", 0) + 1
        elif any(x in name for x in ["fruit", "berry", "date", "cranberry"]):
            ingredient_categories["fruits"] = ingredient_categories.get("fruits", 0) + 1
        elif any(x in name for x in ["protein", "powder"]):
            ingredient_categories["protein"] = ingredient_categories.get("protein", 0) + 1

    analysis = {
        "recipe_size": total_ingredients,
        "ingredient_distribution": ingredient_categories,
        "substitution_impact": "low" if total_ingredients > 5 else "high",
        "category_balance": len(ingredient_categories) >= 3
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


def _estimate_difficulty(variation: Dict[str, Any]) -> str:
    """Estimate difficulty level of a recipe variation"""

    ingredient_count = len(variation.get("ingredients", []))

    if ingredient_count <= 4:
        return "easy"
    elif ingredient_count <= 7:
        return "medium"
    else:
        return "hard"


def _estimate_prep_time(variation: Dict[str, Any]) -> str:
    """Estimate preparation time for a recipe variation"""

    ingredient_count = len(variation.get("ingredients", []))

    # Simple estimation based on ingredient count
    if ingredient_count <= 3:
        return "5-10 minutes"
    elif ingredient_count <= 6:
        return "10-15 minutes"
    else:
        return "15-20 minutes"


def _analyze_temporal_patterns(user_snacks: List[Dict[str, Any]], period_days: int) -> Dict[str, Any]:
    """Analyze temporal patterns in snacking habits"""

    # This would need proper date parsing in a real implementation
    return {
        "frequency": "analysis_placeholder",
        "peak_days": "analysis_placeholder",
        "health_score_trend": "analysis_placeholder",
        "ingredient_variety_trend": "analysis_placeholder"
    }


def _generate_personalized_goals(trends: Dict[str, Any]) -> List[str]:
    """Generate personalized goals based on trends analysis"""

    goals = []
    avg_score = trends.get("average_health_score", 50)
    gaps = trends.get("nutritional_gaps", [])

    if avg_score < 60:
        goals.append("Improve overall snack nutrition quality")

    if "protein" in gaps:
        goals.append("Increase protein intake in snacks")

    if "fiber" in gaps:
        goals.append("Add more high-fiber ingredients")

    # Always add a variety goal
    goals.append("Experiment with new healthy ingredients")

    return goals[:4]  # Limit to 4 goals


def _create_improvement_roadmap(nutrition_data: Dict[str, Any]) -> Dict[str, List[str]]:
    """Create step-by-step improvement roadmap"""

    score = nutrition_data.get("health_score", 0)
    nutrition = nutrition_data.get("nutrition_per_100g", {})

    roadmap = {
        "immediate": [],
        "short_term": [],
        "long_term": []
    }

    # Immediate improvements (this week)
    if nutrition.get("sugars_g", 0) > 25:
        roadmap["immediate"].append("Reduce sweetener amounts by 25%")

    if nutrition.get("protein_g", 0) < 8:
        roadmap["immediate"].append("Add 1-2 tbsp protein powder or nuts")

    # Short-term improvements (this month)
    if nutrition.get("fiber_g", 0) < 5:
        roadmap["short_term"].append("Experiment with chia seeds, flax, or oats")

    roadmap["short_term"].append("Try 2-3 new healthy ingredients")

    # Long-term improvements (ongoing)
    roadmap["long_term"].append("Build a repertoire of 10+ go-to healthy snacks")
    roadmap["long_term"].append("Learn to balance macronutrients intuitively")

    return roadmap


def _extract_key_factors(nutrition_data: Dict[str, Any]) -> Dict[str, str]:
    """Extract key factors affecting health score"""

    nutrition = nutrition_data.get("nutrition_per_100g", {})
    factors = {}

    protein = nutrition.get("protein_g", 0)
    if protein > 15:
        factors["protein"] = "excellent"
    elif protein > 8:
        factors["protein"] = "good"
    else:
        factors["protein"] = "needs_improvement"

    fiber = nutrition.get("fiber_g", 0)
    if fiber > 10:
        factors["fiber"] = "excellent"
    elif fiber > 5:
        factors["fiber"] = "good"
    else:
        factors["fiber"] = "needs_improvement"

    sugar = nutrition.get("sugars_g", 0)
    if sugar < 10:
        factors["sugar"] = "excellent"
    elif sugar < 20:
        factors["sugar"] = "moderate"
    else:
        factors["sugar"] = "high"

    return factors