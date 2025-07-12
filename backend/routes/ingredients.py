from fastapi import APIRouter, HTTPException, Depends, Request, Query
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class IngredientSearchRequest(BaseModel):
    query: str = Field(..., description="Search query for ingredients")
    category: Optional[str] = Field(None, description="Filter by category")
    dietary_restrictions: Optional[List[str]] = Field(default=[], description="Dietary restrictions")
    limit: int = Field(10, ge=1, le=50, description="Maximum results to return")


class IngredientCompatibilityRequest(BaseModel):
    ingredients: List[str] = Field(..., description="List of ingredient names")
    new_ingredient: str = Field(..., description="New ingredient to check compatibility")


class NutritionComparisonRequest(BaseModel):
    ingredient_a: str = Field(..., description="First ingredient to compare")
    ingredient_b: str = Field(..., description="Second ingredient to compare")


def get_ingredient_embeddings(request: Request):
    """Dependency to get ingredient embeddings service from app state"""
    return request.app.state.ingredient_embeddings


def get_nutrition_service(request: Request):
    """Dependency to get nutrition service from app state"""
    return request.app.state.nutrition_service


@router.get("/")
async def get_all_ingredients(
        category: Optional[str] = Query(None, description="Filter by category"),
        limit: int = Query(50, ge=1, le=200, description="Maximum ingredients to return"),
        include_nutrition: bool = Query(True, description="Include nutrition data"),
        embeddings=Depends(get_ingredient_embeddings)
):
    """Get list of all available ingredients with optional filtering"""
    try:
        all_ingredients = []

        for name, data in embeddings.ingredient_data.items():
            if category and data.get("category") != category:
                continue

            ingredient_info = {
                "name": name,
                "category": data.get("category"),
                "description": data.get("description"),
                "flavor_profile": data.get("flavor_profile", []),
                "texture": data.get("texture"),
                "color": data.get("color"),
                "allergens": data.get("allergens", [])
            }

            if include_nutrition:
                ingredient_info["nutrition"] = data.get("nutrition", {})
                ingredient_info["properties"] = data.get("properties", {})

            all_ingredients.append(ingredient_info)

        # Sort alphabetically
        all_ingredients.sort(key=lambda x: x["name"])

        # Apply limit
        limited_ingredients = all_ingredients[:limit]

        return {
            "success": True,
            "data": {
                "ingredients": limited_ingredients,
                "total_available": len(embeddings.ingredient_data),
                "filtered_count": len(all_ingredients),
                "returned_count": len(limited_ingredients)
            },
            "message": f"Retrieved {len(limited_ingredients)} ingredients"
        }

    except Exception as e:
        logger.error(f"Get ingredients error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get ingredients: {str(e)}")


@router.get("/categories")
async def get_ingredient_categories(
        embeddings=Depends(get_ingredient_embeddings)
):
    """Get all available ingredient categories with counts"""
    try:
        categories = {}

        for data in embeddings.ingredient_data.values():
            category = data.get("category", "unknown")
            categories[category] = categories.get(category, 0) + 1

        category_list = [
            {"name": cat, "count": count, "description": _get_category_description(cat)}
            for cat, count in categories.items()
        ]

        # Sort by count (descending)
        category_list.sort(key=lambda x: x["count"], reverse=True)

        return {
            "success": True,
            "data": {
                "categories": category_list,
                "total_categories": len(category_list)
            },
            "message": f"Retrieved {len(category_list)} ingredient categories"
        }

    except Exception as e:
        logger.error(f"Get categories error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get categories: {str(e)}")


@router.post("/search")
async def search_ingredients(
        request: IngredientSearchRequest,
        embeddings=Depends(get_ingredient_embeddings)
):
    """Search for ingredients using semantic similarity"""
    try:
        # Perform semantic search
        search_results = embeddings.search_ingredients(request.query, top_k=request.limit * 2)

        filtered_results = []
        for ingredient_name, similarity in search_results:
            ingredient_data = embeddings.ingredient_data.get(ingredient_name)
            if not ingredient_data:
                continue

            # Apply category filter
            if request.category and ingredient_data.get("category") != request.category:
                continue

            # Apply dietary restrictions
            if request.dietary_restrictions:
                if not _meets_dietary_restrictions_ingredient(ingredient_data, request.dietary_restrictions):
                    continue

            result = {
                "name": ingredient_name,
                "similarity_score": similarity,
                "category": ingredient_data.get("category"),
                "description": ingredient_data.get("description"),
                "flavor_profile": ingredient_data.get("flavor_profile", []),
                "nutrition_highlights": _get_nutrition_highlights(ingredient_data),
                "allergens": ingredient_data.get("allergens", [])
            }

            filtered_results.append(result)

            if len(filtered_results) >= request.limit:
                break

        return {
            "success": True,
            "data": {
                "results": filtered_results,
                "query": request.query,
                "filters_applied": {
                    "category": request.category,
                    "dietary_restrictions": request.dietary_restrictions
                }
            },
            "message": f"Found {len(filtered_results)} matching ingredients"
        }

    except Exception as e:
        logger.error(f"Search ingredients error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ingredient search failed: {str(e)}")


@router.get("/{ingredient_name}")
async def get_ingredient_details(
        ingredient_name: str,
        include_similar: bool = Query(True, description="Include similar ingredients"),
        include_substitutions: bool = Query(True, description="Include substitution suggestions"),
        embeddings=Depends(get_ingredient_embeddings)
):
    """Get detailed information about a specific ingredient"""
    try:
        ingredient_data = embeddings.get_ingredient_data(ingredient_name)

        if not ingredient_data:
            raise HTTPException(status_code=404, detail=f"Ingredient '{ingredient_name}' not found")

        response_data = {
            "name": ingredient_name,
            "category": ingredient_data.get("category"),
            "description": ingredient_data.get("description"),
            "nutrition": ingredient_data.get("nutrition", {}),
            "properties": ingredient_data.get("properties", {}),
            "flavor_profile": ingredient_data.get("flavor_profile", []),
            "texture": ingredient_data.get("texture"),
            "color": ingredient_data.get("color"),
            "allergens": ingredient_data.get("allergens", []),
            "health_benefits": _generate_health_benefits(ingredient_data),
            "usage_tips": _generate_usage_tips(ingredient_name, ingredient_data)
        }

        # Add similar ingredients
        if include_similar:
            similar = embeddings.find_similar_ingredients(ingredient_name, top_k=8)
            response_data["similar_ingredients"] = [
                {
                    "name": name,
                    "similarity": float(similarity),
                    "category": embeddings.ingredient_data.get(name, {}).get("category"),
                    "description": embeddings.ingredient_data.get(name, {}).get("description")
                }
                for name, similarity in similar
            ]

        # Add substitution suggestions
        if include_substitutions:
            substitutions = embeddings.suggest_substitutions(ingredient_name)
            response_data["substitutions"] = substitutions

        return {
            "success": True,
            "data": response_data,
            "message": f"Retrieved details for '{ingredient_name}'"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get ingredient details error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get ingredient details: {str(e)}")


@router.post("/similar")
async def find_similar_ingredients(
        ingredient_name: str = Field(..., description="Base ingredient"),
        count: int = Field(5, ge=1, le=20, description="Number of similar ingredients to return"),
        dietary_restrictions: List[str] = Field(default=[], description="Dietary restrictions to consider"),
        embeddings=Depends(get_ingredient_embeddings)
):
    """Find ingredients similar to a given ingredient"""
    try:
        similar_ingredients = embeddings.find_similar_ingredients(ingredient_name, top_k=count * 2)

        if not similar_ingredients:
            return {
                "success": True,
                "data": {"similar_ingredients": []},
                "message": f"No similar ingredients found for '{ingredient_name}'"
            }

        # Filter by dietary restrictions
        filtered_similar = []
        for name, similarity in similar_ingredients:
            ingredient_data = embeddings.ingredient_data.get(name)
            if not ingredient_data:
                continue

            if dietary_restrictions:
                if not _meets_dietary_restrictions_ingredient(ingredient_data, dietary_restrictions):
                    continue

            filtered_similar.append({
                "name": name,
                "similarity_score": float(similarity),
                "category": ingredient_data.get("category"),
                "reason": _generate_similarity_reason(ingredient_name, name, embeddings),
                "nutrition_comparison": _compare_nutrition_brief(ingredient_name, name, embeddings)
            })

            if len(filtered_similar) >= count:
                break

        return {
            "success": True,
            "data": {
                "base_ingredient": ingredient_name,
                "similar_ingredients": filtered_similar,
                "dietary_restrictions_applied": dietary_restrictions
            },
            "message": f"Found {len(filtered_similar)} similar ingredients"
        }

    except Exception as e:
        logger.error(f"Find similar ingredients error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to find similar ingredients: {str(e)}")


@router.post("/substitute")
async def get_substitution_suggestions(
        ingredient_name: str = Field(..., description="Ingredient to substitute"),
        dietary_restrictions: List[str] = Field(default=[], description="Dietary requirements"),
        recipe_context: Optional[List[str]] = Field(default=None, description="Other ingredients in recipe"),
        substitution_reason: Optional[str] = Field(default=None, description="Reason for substitution"),
        embeddings=Depends(get_ingredient_embeddings)
):
    """Get intelligent substitution suggestions for an ingredient"""
    try:
        # Get base substitutions
        substitutions = embeddings.suggest_substitutions(ingredient_name, dietary_restrictions)

        # Enhance with context analysis if recipe provided
        if recipe_context:
            for substitution in substitutions:
                substitution["context_analysis"] = _analyze_recipe_context(
                    substitution["name"], recipe_context, embeddings
                )

        # Add substitution ratios and preparation notes
        enhanced_substitutions = []
        for sub in substitutions:
            enhanced_sub = sub.copy()
            enhanced_sub.update({
                "substitution_ratio": _get_substitution_ratio(ingredient_name, sub["name"]),
                "preparation_notes": _get_preparation_notes(ingredient_name, sub["name"]),
                "expected_changes": _predict_recipe_changes(ingredient_name, sub["name"], embeddings)
            })
            enhanced_substitutions.append(enhanced_sub)

        return {
            "success": True,
            "data": {
                "original_ingredient": ingredient_name,
                "substitutions": enhanced_substitutions,
                "substitution_reason": substitution_reason,
                "dietary_restrictions": dietary_restrictions,
                "context_considered": recipe_context is not None
            },
            "message": f"Found {len(enhanced_substitutions)} substitution options"
        }

    except Exception as e:
        logger.error(f"Get substitutions error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get substitutions: {str(e)}")


@router.post("/compatibility")
async def check_ingredient_compatibility(
        request: IngredientCompatibilityRequest,
        embeddings=Depends(get_ingredient_embeddings)
):
    """Check how well a new ingredient fits with existing ingredients"""
    try:
        existing_ingredients = request.ingredients
        new_ingredient = request.new_ingredient

        # Check if new ingredient exists
        if new_ingredient not in embeddings.ingredient_data:
            raise HTTPException(status_code=404, detail=f"Ingredient '{new_ingredient}' not found")

        compatibility_scores = []
        flavor_conflicts = []
        allergen_additions = []

        new_ingredient_data = embeddings.ingredient_data[new_ingredient]
        new_allergens = set(new_ingredient_data.get("allergens", []))
        new_flavors = set(new_ingredient_data.get("flavor_profile", []))

        # Analyze compatibility with each existing ingredient
        for existing_ingredient in existing_ingredients:
            if existing_ingredient not in embeddings.ingredient_data:
                continue

            # Calculate similarity score
            similar_ingredients = embeddings.find_similar_ingredients(existing_ingredient, top_k=20)
            similarity_score = 0

            for similar_name, similarity in similar_ingredients:
                if similar_name == new_ingredient:
                    similarity_score = similarity
                    break

            compatibility_scores.append({
                "existing_ingredient": existing_ingredient,
                "compatibility_score": float(similarity_score),
                "compatibility_level": _get_compatibility_level(similarity_score)
            })

        # Check for flavor conflicts
        existing_flavors = set()
        for ingredient in existing_ingredients:
            if ingredient in embeddings.ingredient_data:
                existing_flavors.update(embeddings.ingredient_data[ingredient].get("flavor_profile", []))

        conflicting_flavors = _find_flavor_conflicts(existing_flavors, new_flavors)
        if conflicting_flavors:
            flavor_conflicts = list(conflicting_flavors)

        # Check allergen additions
        existing_allergens = set()
        for ingredient in existing_ingredients:
            if ingredient in embeddings.ingredient_data:
                existing_allergens.update(embeddings.ingredient_data[ingredient].get("allergens", []))

        added_allergens = new_allergens - existing_allergens
        if added_allergens:
            allergen_additions = list(added_allergens)

        # Calculate overall compatibility
        avg_compatibility = sum(cs["compatibility_score"] for cs in compatibility_scores) / len(
            compatibility_scores) if compatibility_scores else 0

        # Generate recommendations
        recommendations = _generate_compatibility_recommendations(
            avg_compatibility, flavor_conflicts, allergen_additions, new_ingredient_data
        )

        return {
            "success": True,
            "data": {
                "new_ingredient": new_ingredient,
                "existing_ingredients": existing_ingredients,
                "overall_compatibility": float(avg_compatibility),
                "compatibility_level": _get_compatibility_level(avg_compatibility),
                "individual_compatibility": compatibility_scores,
                "flavor_conflicts": flavor_conflicts,
                "allergen_additions": allergen_additions,
                "recommendations": recommendations
            },
            "message": f"Compatibility analysis completed for '{new_ingredient}'"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Compatibility check error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Compatibility check failed: {str(e)}")


@router.post("/compare")
async def compare_ingredients(
        request: NutritionComparisonRequest,
        embeddings=Depends(get_ingredient_embeddings)
):
    """Compare nutrition and properties of two ingredients"""
    try:
        ingredient_a_data = embeddings.get_ingredient_data(request.ingredient_a)
        ingredient_b_data = embeddings.get_ingredient_data(request.ingredient_b)

        if not ingredient_a_data:
            raise HTTPException(status_code=404, detail=f"Ingredient '{request.ingredient_a}' not found")
        if not ingredient_b_data:
            raise HTTPException(status_code=404, detail=f"Ingredient '{request.ingredient_b}' not found")

        # Compare nutrition
        nutrition_a = ingredient_a_data.get("nutrition", {})
        nutrition_b = ingredient_b_data.get("nutrition", {})

        nutrition_comparison = {}
        key_nutrients = ["calories_per_100g", "protein_g", "total_fat_g", "carbohydrates_g",
                         "sugars_g", "fiber_g", "sodium_mg", "potassium_mg", "calcium_mg", "iron_mg"]

        for nutrient in key_nutrients:
            val_a = nutrition_a.get(nutrient, 0)
            val_b = nutrition_b.get(nutrient, 0)

            if val_a == 0 and val_b == 0:
                difference = "equal"
                percent_diff = 0
            else:
                percent_diff = ((val_b - val_a) / max(val_a, 0.1)) * 100
                if abs(percent_diff) < 10:
                    difference = "similar"
                elif val_b > val_a:
                    difference = "higher_in_b"
                else:
                    difference = "higher_in_a"

            nutrition_comparison[nutrient] = {
                "ingredient_a_value": val_a,
                "ingredient_b_value": val_b,
                "percent_difference": round(percent_diff, 1),
                "comparison": difference
            }

        # Compare properties
        properties_a = ingredient_a_data.get("properties", {})
        properties_b = ingredient_b_data.get("properties", {})

        properties_comparison = {
            "health_scores": {
                "ingredient_a": properties_a.get("antioxidant_score", 0),
                "ingredient_b": properties_b.get("antioxidant_score", 0)
            },
            "processing_levels": {
                "ingredient_a": properties_a.get("processing_level", 0),
                "ingredient_b": properties_b.get("processing_level", 0)
            },
            "sustainability": {
                "ingredient_a": properties_a.get("sustainability_score", 0),
                "ingredient_b": properties_b.get("sustainability_score", 0)
            }
        }

        # Compare allergens and dietary considerations
        allergens_a = set(ingredient_a_data.get("allergens", []))
        allergens_b = set(ingredient_b_data.get("allergens", []))

        allergen_comparison = {
            "common_allergens": list(allergens_a & allergens_b),
            "unique_to_a": list(allergens_a - allergens_b),
            "unique_to_b": list(allergens_b - allergens_a)
        }

        # Generate summary and recommendations
        summary = _generate_comparison_summary(
            request.ingredient_a, request.ingredient_b,
            nutrition_comparison, properties_comparison, allergen_comparison
        )

        return {
            "success": True,
            "data": {
                "ingredient_a": {
                    "name": request.ingredient_a,
                    "category": ingredient_a_data.get("category"),
                    "description": ingredient_a_data.get("description")
                },
                "ingredient_b": {
                    "name": request.ingredient_b,
                    "category": ingredient_b_data.get("category"),
                    "description": ingredient_b_data.get("description")
                },
                "nutrition_comparison": nutrition_comparison,
                "properties_comparison": properties_comparison,
                "allergen_comparison": allergen_comparison,
                "summary": summary
            },
            "message": f"Comparison completed between '{request.ingredient_a}' and '{request.ingredient_b}'"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Compare ingredients error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ingredient comparison failed: {str(e)}")


@router.get("/recommendations/trending")
async def get_trending_ingredients(
        category: Optional[str] = Query(None, description="Filter by category"),
        period: str = Query("week", description="Time period (week/month/quarter)"),
        limit: int = Query(10, ge=1, le=50, description="Number of ingredients to return")
):
    """Get trending ingredients based on usage patterns"""
    try:
        # This would typically pull from usage analytics
        # For demo purposes, we'll return ingredients with high health scores

        # Mock trending calculation based on health properties
        trending_ingredients = []

        # Get ingredient embeddings service (simplified for demo)
        # In real implementation, you'd inject this properly

        return {
            "success": True,
            "data": {
                "trending_ingredients": [
                    {
                        "name": "chia_seeds",
                        "trend_score": 95,
                        "category": "nuts_seeds",
                        "reason": "High omega-3 content and fiber",
                        "growth_percent": 23.5
                    },
                    {
                        "name": "dark_chocolate_70",
                        "trend_score": 88,
                        "category": "chocolate",
                        "reason": "Antioxidant benefits",
                        "growth_percent": 18.2
                    },
                    {
                        "name": "protein_powder_plant",
                        "trend_score": 85,
                        "category": "protein",
                        "reason": "Plant-based protein demand",
                        "growth_percent": 31.7
                    }
                ][:limit],
                "period": period,
                "category_filter": category
            },
            "message": f"Retrieved {min(3, limit)} trending ingredients"
        }

    except Exception as e:
        logger.error(f"Get trending ingredients error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get trending ingredients: {str(e)}")


# Helper functions

def _get_category_description(category: str) -> str:
    """Get description for ingredient category"""
    descriptions = {
        "nuts_seeds": "Nutrient-dense nuts and seeds, rich in healthy fats and protein",
        "fruits": "Fresh and dried fruits providing natural sweetness and vitamins",
        "chocolate": "Various forms of chocolate and cocoa products",
        "grains": "Whole grains and cereals providing complex carbohydrates",
        "protein": "Concentrated protein sources and supplements",
        "sweeteners": "Natural and alternative sweetening options",
        "coconut": "Coconut-derived products with unique nutritional profiles",
        "spices": "Flavor enhancers with potential health benefits",
        "flavorings": "Natural extracts and flavoring agents"
    }
    return descriptions.get(category, "Various ingredients in this category")


def _meets_dietary_restrictions_ingredient(ingredient_data: Dict[str, Any], restrictions: List[str]) -> bool:
    """Check if ingredient meets dietary restrictions"""
    allergens = set(ingredient_data.get("allergens", []))

    for restriction in restrictions:
        if restriction == "vegan":
            if any(allergen in allergens for allergen in ["milk", "eggs", "honey"]):
                return False
        elif restriction == "gluten_free":
            if "gluten" in allergens:
                return False
        elif restriction == "nut_free":
            if any("nut" in allergen for allergen in allergens):
                return False
        elif restriction == "dairy_free":
            if "milk" in allergens:
                return False
        elif restriction == "soy_free":
            if "soy" in allergens:
                return False

    return True


def _get_nutrition_highlights(ingredient_data: Dict[str, Any]) -> List[str]:
    """Get key nutrition highlights for an ingredient"""
    nutrition = ingredient_data.get("nutrition", {})
    highlights = []

    if nutrition.get("protein_g", 0) > 15:
        highlights.append("High protein")
    if nutrition.get("fiber_g", 0) > 10:
        highlights.append("High fiber")
    if ingredient_data.get("properties", {}).get("antioxidant_score", 0) > 70:
        highlights.append("Rich in antioxidants")
    if nutrition.get("iron_mg", 0) > 3:
        highlights.append("Good iron source")
    if nutrition.get("calcium_mg", 0) > 100:
        highlights.append("High calcium")

    return highlights[:3]  # Limit to top 3


def _generate_health_benefits(ingredient_data: Dict[str, Any]) -> List[str]:
    """Generate health benefits for an ingredient"""
    benefits = []
    nutrition = ingredient_data.get("nutrition", {})
    properties = ingredient_data.get("properties", {})

    if nutrition.get("protein_g", 0) > 10:
        benefits.append("Supports muscle building and repair")
    if nutrition.get("fiber_g", 0) > 5:
        benefits.append("Promotes digestive health")
    if properties.get("antioxidant_score", 0) > 60:
        benefits.append("Provides antioxidant protection")
    if nutrition.get("potassium_mg", 0) > 300:
        benefits.append("Supports heart health")
    if properties.get("glycemic_index", 100) < 35:
        benefits.append("Helps maintain stable blood sugar")

    return benefits


def _generate_usage_tips(ingredient_name: str, ingredient_data: Dict[str, Any]) -> List[str]:
    """Generate usage tips for an ingredient"""
    tips = []
    category = ingredient_data.get("category", "")
    texture = ingredient_data.get("texture", "")

    if category == "nuts_seeds":
        tips.append("Soak overnight for easier blending")
        tips.append("Toast lightly to enhance flavor")
    elif category == "fruits":
        tips.append("Combine with protein for balanced nutrition")
        if "dried" in ingredient_name:
            tips.append("Use sparingly as natural sweetener")
    elif category == "protein":
        tips.append("Mix gradually to avoid clumping")
        tips.append("Combine with liquid ingredients first")
    elif category == "spices":
        tips.append("Start with small amounts and adjust to taste")
        tips.append("Mix well to distribute evenly")

    if texture == "powdery":
        tips.append("Sift to prevent lumps")
    elif texture == "sticky":
        tips.append("Wet hands when handling")

    return tips[:3]  # Limit to 3 tips


def _generate_similarity_reason(ingredient_a: str, ingredient_b: str, embeddings) -> str:
    """Generate reason for ingredient similarity"""
    data_a = embeddings.ingredient_data.get(ingredient_a, {})
    data_b = embeddings.ingredient_data.get(ingredient_b, {})

    # Check category similarity
    if data_a.get("category") == data_b.get("category"):
        return f"Same category ({data_a.get('category')})"

    # Check flavor similarity
    flavors_a = set(data_a.get("flavor_profile", []))
    flavors_b = set(data_b.get("flavor_profile", []))
    common_flavors = flavors_a & flavors_b

    if common_flavors:
        return f"Similar {', '.join(common_flavors)} flavor"

    # Check texture similarity
    if data_a.get("texture") == data_b.get("texture"):
        return f"Similar {data_a.get('texture')} texture"

    return "Complementary nutritional profile"


def _compare_nutrition_brief(ingredient_a: str, ingredient_b: str, embeddings) -> str:
    """Brief nutrition comparison between ingredients"""
    data_a = embeddings.ingredient_data.get(ingredient_a, {})
    data_b = embeddings.ingredient_data.get(ingredient_b, {})

    nutrition_a = data_a.get("nutrition", {})
    nutrition_b = data_b.get("nutrition", {})

    protein_a = nutrition_a.get("protein_g", 0)
    protein_b = nutrition_b.get("protein_g", 0)

    if protein_b > protein_a * 1.5:
        return "Higher protein content"
    elif protein_a > protein_b * 1.5:
        return "Lower protein content"

    calories_a = nutrition_a.get("calories_per_100g", 0)
    calories_b = nutrition_b.get("calories_per_100g", 0)

    if calories_b > calories_a * 1.2:
        return "Higher calorie density"
    elif calories_a > calories_b * 1.2:
        return "Lower calorie density"

    return "Similar nutritional profile"


def _analyze_recipe_context(ingredient_name: str, recipe_context: List[str], embeddings) -> str:
    """Analyze how ingredient fits in recipe context"""
    ingredient_data = embeddings.ingredient_data.get(ingredient_name, {})
    category = ingredient_data.get("category", "")

    context_categories = []
    for context_ingredient in recipe_context:
        if context_ingredient in embeddings.ingredient_data:
            context_categories.append(embeddings.ingredient_data[context_ingredient].get("category"))

    if category in context_categories:
        return f"Complements existing {category} ingredients"
    elif category == "protein" and "nuts_seeds" in context_categories:
        return "Adds protein to existing healthy fats"
    elif category == "fruits" and "nuts_seeds" in context_categories:
        return "Adds natural sweetness to nutty base"
    else:
        return "Adds nutritional variety to recipe"


def _get_substitution_ratio(original: str, substitute: str) -> str:
    """Get substitution ratio guidance"""
    # Simplified substitution ratios
    if "powder" in original and "powder" in substitute:
        return "1:1 ratio"
    elif "honey" in original and "maple_syrup" in substitute:
        return "Use 3/4 amount of maple syrup"
    elif "dates" in original and any(sweetener in substitute for sweetener in ["honey", "maple"]):
        return "Use 1/2 the amount"
    else:
        return "Start with 3/4 amount and adjust"


def _get_preparation_notes(original: str, substitute: str) -> str:
    """Get preparation notes for substitution"""
    if "liquid" in original and "powder" in substitute:
        return "May need to add extra liquid to maintain consistency"
    elif "powder" in original and "liquid" in substitute:
        return "May need to reduce other liquids slightly"
    elif "nuts" in original and "seeds" in substitute:
        return "Consider soaking seeds for softer texture"
    else:
        return "Monitor texture and adjust other ingredients as needed"


def _predict_recipe_changes(original: str, substitute: str, embeddings) -> Dict[str, str]:
    """Predict how substitution will change the recipe"""
    orig_data = embeddings.ingredient_data.get(original, {})
    sub_data = embeddings.ingredient_data.get(substitute, {})

    changes = {}

    # Flavor changes
    orig_flavors = set(orig_data.get("flavor_profile", []))
    sub_flavors = set(sub_data.get("flavor_profile", []))

    if orig_flavors != sub_flavors:
        new_flavors = sub_flavors - orig_flavors
        if new_flavors:
            changes["flavor"] = f"Will add {', '.join(new_flavors)} notes"
        else:
            changes["flavor"] = "Similar flavor profile"

    # Texture changes
    orig_texture = orig_data.get("texture", "")
    sub_texture = sub_data.get("texture", "")

    if orig_texture != sub_texture:
        changes["texture"] = f"Texture will be more {sub_texture}"

    # Nutrition changes
    orig_protein = orig_data.get("nutrition", {}).get("protein_g", 0)
    sub_protein = sub_data.get("nutrition", {}).get("protein_g", 0)

    if sub_protein > orig_protein * 1.2:
        changes["nutrition"] = "Will increase protein content"
    elif orig_protein > sub_protein * 1.2:
        changes["nutrition"] = "Will decrease protein content"

    return changes


def _get_compatibility_level(score: float) -> str:
    """Convert compatibility score to level description"""
    if score >= 0.8:
        return "excellent"
    elif score >= 0.6:
        return "good"
    elif score >= 0.4:
        return "moderate"
    else:
        return "low"


def _find_flavor_conflicts(existing_flavors: set, new_flavors: set) -> set:
    """Find potential flavor conflicts"""
    conflicts = set()

    # Define conflicting flavor pairs
    conflict_pairs = {
        ("sweet", "bitter"),
        ("mild", "intense"),
        ("floral", "earthy")
    }

    for existing_flavor in existing_flavors:
        for new_flavor in new_flavors:
            for pair in conflict_pairs:
                if (existing_flavor in pair and new_flavor in pair and
                        existing_flavor != new_flavor):
                    conflicts.add((existing_flavor, new_flavor))

    return conflicts


def _generate_compatibility_recommendations(avg_score: float, conflicts: List, allergens: List,
                                            new_ingredient_data: Dict) -> List[str]:
    """Generate recommendations based on compatibility analysis"""
    recommendations = []

    if avg_score >= 0.7:
        recommendations.append("This ingredient should work well in your recipe")
    elif avg_score >= 0.4:
        recommendations.append("This ingredient could work but may change the flavor profile")
    else:
        recommendations.append("Consider if this ingredient fits your desired flavor profile")

    if conflicts:
        recommendations.append("Be mindful of potential flavor conflicts - start with small amounts")

    if allergens:
        recommendations.append(f"Note: This will add {', '.join(allergens)} allergen(s) to your recipe")

    # Add usage tip based on ingredient properties
    category = new_ingredient_data.get("category", "")
    if category == "spices":
        recommendations.append("Use sparingly - a little goes a long way with spices")
    elif category == "protein":
        recommendations.append("This will boost the protein content significantly")

    return recommendations


def _generate_comparison_summary(ingredient_a: str, ingredient_b: str, nutrition_comp: Dict, properties_comp: Dict, allergen_comp: Dict) -> Dict[str, str]:
    """Generate summary of ingredient comparison"""
    summary = {}

    # Determine which ingredient is more nutritious overall
    protein_comparison = nutrition_comp.get("protein_g", {}).get("comparison", "equal")
    fiber_comparison = nutrition_comp.get("fiber_g", {}).get("comparison", "equal")
    sugar_comparison = nutrition_comp.get("sugars_g", {}).get("comparison", "equal")

    nutrition_winner = "tie"
    if protein_comparison == "higher_in_b" and fiber_comparison != "higher_in_a":
        nutrition_winner = ingredient_b
    elif protein_comparison == "higher_in_a" and fiber_comparison != "higher_in_b":
        nutrition_winner = ingredient_a
    elif fiber_comparison == "higher_in_b" and protein_comparison != "higher_in_a":
        nutrition_winner = ingredient_b
    elif fiber_comparison == "higher_in_a" and protein_comparison != "higher_in_b":
        nutrition_winner = ingredient_a

    if nutrition_winner == "tie":
        summary["nutrition"] = f"Both {ingredient_a} and {ingredient_b} offer similar nutritional benefits"
    else:
        summary["nutrition"] = f"{nutrition_winner} has better overall nutrition profile"

    # Health properties summary
    antioxidant_a = properties_comp["health_scores"]["ingredient_a"]
    antioxidant_b = properties_comp["health_scores"]["ingredient_b"]

    if antioxidant_a > antioxidant_b * 1.2:
        summary["antioxidants"] = f"{ingredient_a} provides significantly more antioxidants"
    elif antioxidant_b > antioxidant_a * 1.2:
        summary["antioxidants"] = f"{ingredient_b} provides significantly more antioxidants"
    else:
        summary["antioxidants"] = "Both ingredients provide similar antioxidant benefits"

    # Processing level summary
    processing_a = properties_comp["processing_levels"]["ingredient_a"]
    processing_b = properties_comp["processing_levels"]["ingredient_b"]

    if processing_a < processing_b:
        summary["processing"] = f"{ingredient_a} is less processed and more natural"
    elif processing_b < processing_a:
        summary["processing"] = f"{ingredient_b} is less processed and more natural"
    else:
        summary["processing"] = "Both ingredients have similar processing levels"

    # Allergen summary
    unique_a = allergen_comp["unique_to_a"]
    unique_b = allergen_comp["unique_to_b"]

    if unique_a and not unique_b:
        summary["allergens"] = f"{ingredient_a} contains additional allergens ({', '.join(unique_a)})"
    elif unique_b and not unique_a:
        summary["allergens"] = f"{ingredient_b} contains additional allergens ({', '.join(unique_b)})"
    elif unique_a and unique_b:
        summary["allergens"] = "Both ingredients have unique allergen considerations"
    else:
        summary["allergens"] = "Both ingredients have similar allergen profiles"

    # Overall recommendation
    if nutrition_winner != "tie" and not unique_a and not unique_b:
        summary["recommendation"] = f"Choose {nutrition_winner} for better nutrition"
    elif processing_a < processing_b and not unique_a:
        summary["recommendation"] = f"Choose {ingredient_a} for less processed option"
    elif processing_b < processing_a and not unique_b:
        summary["recommendation"] = f"Choose {ingredient_b} for less processed option"
    else:
        summary["recommendation"] = "Both ingredients are viable options - choose based on taste preference"

    return summary