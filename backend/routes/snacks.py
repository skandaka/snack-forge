from fastapi import APIRouter, HTTPException, Depends, Request, Query
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import logging
import json
from datetime import datetime, timedelta
import uuid

logger = logging.getLogger(__name__)

router = APIRouter()


class SnackRecipe(BaseModel):
    name: str = Field(..., description="Snack name")
    description: Optional[str] = Field(None, description="Recipe description")
    ingredients: List[Dict[str, Any]] = Field(..., description="List of ingredients with amounts")
    instructions: Optional[List[str]] = Field(None, description="Preparation instructions")
    tags: Optional[List[str]] = Field(default=[], description="Recipe tags")
    prep_time_minutes: Optional[int] = Field(None, description="Preparation time")
    servings: Optional[int] = Field(default=1, description="Number of servings")
    difficulty_level: Optional[str] = Field(default="easy", description="Difficulty level")


class SnackSaveRequest(BaseModel):
    recipe: SnackRecipe
    user_id: Optional[str] = Field(None, description="User identifier")
    is_favorite: Optional[bool] = Field(default=False, description="Mark as favorite")


class SnackUpdateRequest(BaseModel):
    snack_id: str = Field(..., description="Snack ID to update")
    updates: Dict[str, Any] = Field(..., description="Fields to update")


class SnackRatingRequest(BaseModel):
    snack_id: str = Field(..., description="Snack ID to rate")
    rating: int = Field(..., ge=1, le=5, description="Rating from 1-5")
    review: Optional[str] = Field(None, description="Optional review text")
    user_id: Optional[str] = Field(None, description="User identifier")


class SnackSearchRequest(BaseModel):
    query: Optional[str] = Field(None, description="Search query")
    ingredients: Optional[List[str]] = Field(None, description="Must contain ingredients")
    exclude_ingredients: Optional[List[str]] = Field(None, description="Must not contain ingredients")
    dietary_restrictions: Optional[List[str]] = Field(None, description="Dietary requirements")
    max_prep_time: Optional[int] = Field(None, description="Maximum prep time in minutes")
    min_health_score: Optional[int] = Field(None, description="Minimum health score")
    tags: Optional[List[str]] = Field(None, description="Required tags")


def get_nutrition_service(request: Request):
    """Dependency to get nutrition service from app state"""
    return request.app.state.nutrition_service


def get_ai_service(request: Request):
    """Dependency to get AI service from app state"""
    return request.app.state.ai_service


# In-memory storage for demo (replace with database in production)
snack_database = {}
user_favorites = {}
snack_ratings = {}


@router.post("/save")
async def save_snack_recipe(
        request: SnackSaveRequest,
        nutrition_service=Depends(get_nutrition_service)
):
    """Save a new snack recipe with nutrition analysis"""
    try:
        # Generate unique ID
        snack_id = str(uuid.uuid4())

        # Calculate nutrition for the recipe
        nutrition_analysis = nutrition_service.calculate_snack_nutrition(
            request.recipe.ingredients
        )

        # Create complete snack record
        snack_record = {
            "id": snack_id,
            "name": request.recipe.name,
            "description": request.recipe.description,
            "ingredients": request.recipe.ingredients,
            "instructions": request.recipe.instructions or [],
            "tags": request.recipe.tags,
            "prep_time_minutes": request.recipe.prep_time_minutes,
            "servings": request.recipe.servings,
            "difficulty_level": request.recipe.difficulty_level,
            "nutrition_analysis": nutrition_analysis,
            "health_score": nutrition_analysis["health_score"],
            "created_date": datetime.now().isoformat(),
            "updated_date": datetime.now().isoformat(),
            "created_by": request.user_id,
            "is_public": True,
            "version": 1,
            "rating_average": 0,
            "rating_count": 0
        }

        # Save to database
        snack_database[snack_id] = snack_record

        # Add to favorites if requested
        if request.is_favorite and request.user_id:
            if request.user_id not in user_favorites:
                user_favorites[request.user_id] = []
            user_favorites[request.user_id].append(snack_id)

        return {
            "success": True,
            "data": {
                "snack_id": snack_id,
                "snack": snack_record,
                "added_to_favorites": request.is_favorite
            },
            "message": f"Snack '{request.recipe.name}' saved successfully"
        }

    except Exception as e:
        logger.error(f"Save snack error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save snack: {str(e)}")


@router.get("/library")
async def get_snack_library(
        user_id: Optional[str] = Query(None, description="User ID for personalized results"),
        limit: int = Query(20, ge=1, le=100, description="Number of snacks to return"),
        offset: int = Query(0, ge=0, description="Offset for pagination"),
        sort_by: str = Query("created_date", description="Sort field"),
        sort_order: str = Query("desc", description="Sort order (asc/desc)"),
        include_nutrition: bool = Query(True, description="Include nutrition analysis")
):
    """Get paginated snack library with filtering options"""
    try:
        # Get all snacks (in production, this would be a database query)
        all_snacks = list(snack_database.values())

        # Filter by user if specified
        if user_id:
            all_snacks = [s for s in all_snacks if s.get("created_by") == user_id]

        # Sort snacks
        reverse_sort = sort_order.lower() == "desc"
        if sort_by == "health_score":
            all_snacks.sort(key=lambda x: x.get("health_score", 0), reverse=reverse_sort)
        elif sort_by == "rating":
            all_snacks.sort(key=lambda x: x.get("rating_average", 0), reverse=reverse_sort)
        elif sort_by == "name":
            all_snacks.sort(key=lambda x: x.get("name", ""), reverse=reverse_sort)
        else:  # created_date
            all_snacks.sort(key=lambda x: x.get("created_date", ""), reverse=reverse_sort)

        # Apply pagination
        total_count = len(all_snacks)
        paginated_snacks = all_snacks[offset:offset + limit]

        # Remove nutrition analysis if not requested
        if not include_nutrition:
            for snack in paginated_snacks:
                snack.pop("nutrition_analysis", None)

        return {
            "success": True,
            "data": {
                "snacks": paginated_snacks,
                "pagination": {
                    "total_count": total_count,
                    "limit": limit,
                    "offset": offset,
                    "has_next": offset + limit < total_count,
                    "has_previous": offset > 0
                },
                "sort": {
                    "field": sort_by,
                    "order": sort_order
                }
            },
            "message": f"Retrieved {len(paginated_snacks)} snacks"
        }

    except Exception as e:
        logger.error(f"Get library error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve library: {str(e)}")


@router.get("/{snack_id}")
async def get_snack_details(
        snack_id: str,
        include_similar: bool = Query(False, description="Include similar snacks"),
        user_id: Optional[str] = Query(None, description="User ID for personalized data")
):
    """Get detailed information about a specific snack"""
    try:
        if snack_id not in snack_database:
            raise HTTPException(status_code=404, detail="Snack not found")

        snack = snack_database[snack_id].copy()

        # Add user-specific data
        if user_id:
            snack["is_favorite"] = (
                    user_id in user_favorites and
                    snack_id in user_favorites[user_id]
            )
            snack["user_rating"] = _get_user_rating(snack_id, user_id)

        response_data = {"snack": snack}

        # Add similar snacks if requested
        if include_similar:
            similar_snacks = _find_similar_snacks(snack, limit=5)
            response_data["similar_snacks"] = similar_snacks

        return {
            "success": True,
            "data": response_data,
            "message": f"Retrieved snack '{snack['name']}'"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get snack details error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get snack details: {str(e)}")


@router.post("/search")
async def search_snacks(
        request: SnackSearchRequest,
        nutrition_service=Depends(get_nutrition_service)
):
    """Advanced search for snacks with multiple criteria"""
    try:
        # Get all snacks
        all_snacks = list(snack_database.values())
        filtered_snacks = []

        for snack in all_snacks:
            # Text search
            if request.query:
                query_lower = request.query.lower()
                if not any(query_lower in field.lower() for field in [
                    snack.get("name", ""),
                    snack.get("description", ""),
                    " ".join(snack.get("tags", []))
                ]):
                    continue

            # Ingredient requirements
            if request.ingredients:
                snack_ingredients = [ing["name"] for ing in snack["ingredients"]]
                if not all(req_ing in snack_ingredients for req_ing in request.ingredients):
                    continue

            # Exclude ingredients
            if request.exclude_ingredients:
                snack_ingredients = [ing["name"] for ing in snack["ingredients"]]
                if any(excl_ing in snack_ingredients for excl_ing in request.exclude_ingredients):
                    continue

            # Dietary restrictions
            if request.dietary_restrictions:
                if not _meets_dietary_restrictions(snack, request.dietary_restrictions):
                    continue

            # Prep time filter
            if request.max_prep_time:
                prep_time = snack.get("prep_time_minutes", 0)
                if prep_time > request.max_prep_time:
                    continue

            # Health score filter
            if request.min_health_score:
                health_score = snack.get("health_score", 0)
                if health_score < request.min_health_score:
                    continue

            # Tags filter
            if request.tags:
                snack_tags = snack.get("tags", [])
                if not all(req_tag in snack_tags for req_tag in request.tags):
                    continue

            filtered_snacks.append(snack)

        # Sort by relevance (health score for now)
        filtered_snacks.sort(key=lambda x: x.get("health_score", 0), reverse=True)

        return {
            "success": True,
            "data": {
                "snacks": filtered_snacks,
                "search_criteria": request.dict(),
                "results_count": len(filtered_snacks)
            },
            "message": f"Found {len(filtered_snacks)} matching snacks"
        }

    except Exception as e:
        logger.error(f"Search snacks error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.put("/update")
async def update_snack(
        request: SnackUpdateRequest,
        nutrition_service=Depends(get_nutrition_service)
):
    """Update an existing snack recipe"""
    try:
        if request.snack_id not in snack_database:
            raise HTTPException(status_code=404, detail="Snack not found")

        snack = snack_database[request.snack_id]

        # Update fields
        for field, value in request.updates.items():
            if field in ["id", "created_date", "created_by"]:
                continue  # Don't allow updating these fields
            snack[field] = value

        # Recalculate nutrition if ingredients changed
        if "ingredients" in request.updates:
            nutrition_analysis = nutrition_service.calculate_snack_nutrition(
                snack["ingredients"]
            )
            snack["nutrition_analysis"] = nutrition_analysis
            snack["health_score"] = nutrition_analysis["health_score"]

        # Update metadata
        snack["updated_date"] = datetime.now().isoformat()
        snack["version"] = snack.get("version", 1) + 1

        return {
            "success": True,
            "data": {"snack": snack},
            "message": f"Snack '{snack['name']}' updated successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update snack error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update snack: {str(e)}")


@router.delete("/{snack_id}")
async def delete_snack(
        snack_id: str,
        user_id: Optional[str] = Query(None, description="User ID for authorization")
):
    """Delete a snack recipe"""
    try:
        if snack_id not in snack_database:
            raise HTTPException(status_code=404, detail="Snack not found")

        snack = snack_database[snack_id]

        # Check authorization (simplified)
        if user_id and snack.get("created_by") != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this snack")

        # Remove from database
        deleted_snack = snack_database.pop(snack_id)

        # Remove from all user favorites
        for user_favs in user_favorites.values():
            if snack_id in user_favs:
                user_favs.remove(snack_id)

        # Remove ratings
        snack_ratings.pop(snack_id, None)

        return {
            "success": True,
            "data": {"deleted_snack_name": deleted_snack["name"]},
            "message": f"Snack '{deleted_snack['name']}' deleted successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete snack error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete snack: {str(e)}")


@router.post("/rate")
async def rate_snack(request: SnackRatingRequest):
    """Rate and review a snack"""
    try:
        if request.snack_id not in snack_database:
            raise HTTPException(status_code=404, detail="Snack not found")

        # Store rating
        if request.snack_id not in snack_ratings:
            snack_ratings[request.snack_id] = []

        rating_record = {
            "user_id": request.user_id,
            "rating": request.rating,
            "review": request.review,
            "created_date": datetime.now().isoformat()
        }

        # Update existing rating or add new one
        user_rating_index = None
        for i, rating in enumerate(snack_ratings[request.snack_id]):
            if rating.get("user_id") == request.user_id:
                user_rating_index = i
                break

        if user_rating_index is not None:
            snack_ratings[request.snack_id][user_rating_index] = rating_record
        else:
            snack_ratings[request.snack_id].append(rating_record)

        # Update snack's average rating
        all_ratings = [r["rating"] for r in snack_ratings[request.snack_id]]
        snack_database[request.snack_id]["rating_average"] = sum(all_ratings) / len(all_ratings)
        snack_database[request.snack_id]["rating_count"] = len(all_ratings)

        return {
            "success": True,
            "data": {
                "rating": rating_record,
                "new_average": snack_database[request.snack_id]["rating_average"],
                "total_ratings": len(all_ratings)
            },
            "message": "Rating saved successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Rate snack error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to rate snack: {str(e)}")


@router.post("/{snack_id}/favorite")
async def toggle_favorite(
        snack_id: str,
        user_id: str = Query(..., description="User ID")
):
    """Add or remove snack from user's favorites"""
    try:
        if snack_id not in snack_database:
            raise HTTPException(status_code=404, detail="Snack not found")

        if user_id not in user_favorites:
            user_favorites[user_id] = []

        is_favorite = snack_id in user_favorites[user_id]

        if is_favorite:
            user_favorites[user_id].remove(snack_id)
            action = "removed from"
        else:
            user_favorites[user_id].append(snack_id)
            action = "added to"

        return {
            "success": True,
            "data": {
                "snack_id": snack_id,
                "is_favorite": not is_favorite,
                "favorites_count": len(user_favorites[user_id])
            },
            "message": f"Snack {action} favorites"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Toggle favorite error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update favorites: {str(e)}")


@router.get("/user/{user_id}/favorites")
async def get_user_favorites(
        user_id: str,
        include_nutrition: bool = Query(True, description="Include nutrition analysis")
):
    """Get user's favorite snacks"""
    try:
        favorite_ids = user_favorites.get(user_id, [])
        favorite_snacks = []

        for snack_id in favorite_ids:
            if snack_id in snack_database:
                snack = snack_database[snack_id].copy()
                if not include_nutrition:
                    snack.pop("nutrition_analysis", None)
                favorite_snacks.append(snack)

        return {
            "success": True,
            "data": {
                "favorites": favorite_snacks,
                "count": len(favorite_snacks)
            },
            "message": f"Retrieved {len(favorite_snacks)} favorite snacks"
        }

    except Exception as e:
        logger.error(f"Get favorites error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get favorites: {str(e)}")


@router.get("/trending")
async def get_trending_snacks(
        period_days: int = Query(7, ge=1, le=365, description="Period in days"),
        limit: int = Query(10, ge=1, le=50, description="Number of snacks to return")
):
    """Get trending snacks based on recent activity"""
    try:
        # Get snacks created in the period
        cutoff_date = datetime.now() - timedelta(days=period_days)

        trending_snacks = []
        for snack in snack_database.values():
            created_date = datetime.fromisoformat(snack["created_date"].replace('Z', '+00:00'))
            if created_date >= cutoff_date:
                # Calculate trend score based on ratings, health score, and recency
                trend_score = (
                        snack.get("rating_average", 0) * 20 +
                        snack.get("health_score", 0) * 0.5 +
                        snack.get("rating_count", 0) * 5
                )
                snack_copy = snack.copy()
                snack_copy["trend_score"] = trend_score
                trending_snacks.append(snack_copy)

        # Sort by trend score
        trending_snacks.sort(key=lambda x: x["trend_score"], reverse=True)
        trending_snacks = trending_snacks[:limit]

        return {
            "success": True,
            "data": {
                "trending_snacks": trending_snacks,
                "period_days": period_days,
                "count": len(trending_snacks)
            },
            "message": f"Retrieved {len(trending_snacks)} trending snacks"
        }

    except Exception as e:
        logger.error(f"Get trending error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get trending snacks: {str(e)}")


@router.post("/{snack_id}/duplicate")
async def duplicate_snack(
        snack_id: str,
        user_id: Optional[str] = Query(None, description="User ID for the duplicate"),
        name_suffix: str = Query(" (Copy)", description="Suffix for duplicate name")
):
    """Create a duplicate of an existing snack"""
    try:
        if snack_id not in snack_database:
            raise HTTPException(status_code=404, detail="Snack not found")

        original_snack = snack_database[snack_id]

        # Create duplicate
        new_snack_id = str(uuid.uuid4())
        duplicate_snack = original_snack.copy()

        # Update duplicate metadata
        duplicate_snack.update({
            "id": new_snack_id,
            "name": original_snack["name"] + name_suffix,
            "created_date": datetime.now().isoformat(),
            "updated_date": datetime.now().isoformat(),
            "created_by": user_id,
            "version": 1,
            "rating_average": 0,
            "rating_count": 0
        })

        # Save duplicate
        snack_database[new_snack_id] = duplicate_snack

        return {
            "success": True,
            "data": {
                "original_snack_id": snack_id,
                "duplicate_snack_id": new_snack_id,
                "duplicate_snack": duplicate_snack
            },
            "message": f"Snack duplicated as '{duplicate_snack['name']}'"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Duplicate snack error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to duplicate snack: {str(e)}")


# Helper functions

def _get_user_rating(snack_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    """Get user's rating for a snack"""
    if snack_id not in snack_ratings:
        return None

    for rating in snack_ratings[snack_id]:
        if rating.get("user_id") == user_id:
            return rating

    return None


def _find_similar_snacks(target_snack: Dict[str, Any], limit: int = 5) -> List[Dict[str, Any]]:
    """Find snacks similar to the target snack"""
    target_ingredients = set(ing["name"] for ing in target_snack["ingredients"])
    target_tags = set(target_snack.get("tags", []))
    target_health_score = target_snack.get("health_score", 0)

    similar_snacks = []

    for snack_id, snack in snack_database.items():
        if snack_id == target_snack["id"]:
            continue

        # Calculate similarity score
        snack_ingredients = set(ing["name"] for ing in snack["ingredients"])
        snack_tags = set(snack.get("tags", []))

        # Ingredient similarity (Jaccard index)
        ingredient_similarity = len(target_ingredients & snack_ingredients) / len(
            target_ingredients | snack_ingredients) if target_ingredients | snack_ingredients else 0

        # Tag similarity
        tag_similarity = len(target_tags & snack_tags) / len(
            target_tags | snack_tags) if target_tags | snack_tags else 0

        # Health score similarity (normalized)
        health_diff = abs(target_health_score - snack.get("health_score", 0))
        health_similarity = max(0, 1 - (health_diff / 100))

        # Combined similarity score
        similarity_score = (ingredient_similarity * 0.5 + tag_similarity * 0.3 + health_similarity * 0.2)

        snack_copy = snack.copy()
        snack_copy["similarity_score"] = similarity_score
        similar_snacks.append(snack_copy)

    # Sort by similarity and return top results
    similar_snacks.sort(key=lambda x: x["similarity_score"], reverse=True)
    return similar_snacks[:limit]


def _meets_dietary_restrictions(snack: Dict[str, Any], restrictions: List[str]) -> bool:
    """Check if snack meets dietary restrictions"""
    nutrition_analysis = snack.get("nutrition_analysis", {})
    allergens = set(nutrition_analysis.get("allergens", []))

    for restriction in restrictions:
        if restriction == "vegan":
            if any(allergen in allergens for allergen in ["milk", "eggs", "honey"]):
                return False
        elif restriction == "vegetarian":
            # Most snacks are vegetarian by default in this context
            pass
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
        elif restriction == "keto":
            nutrition = nutrition_analysis.get("nutrition_per_100g", {})
            carbs = nutrition.get("carbohydrates_g", 0)
            if carbs > 20:  # Simplified keto check
                return False
        elif restriction == "low_sugar":
            nutrition = nutrition_analysis.get("nutrition_per_100g", {})
            sugar = nutrition.get("sugars_g", 0)
            if sugar > 15:  # Simplified low sugar check
                return False

    return True