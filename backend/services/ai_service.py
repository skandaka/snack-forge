# backend/services/ai_service.py
import logging
from typing import Dict, List, Any, Optional
import json
import asyncio
from services.nutrition_service import NutritionService

logger = logging.getLogger(__name__)


class AIService:
    def __init__(self, openai_api_key: Optional[str], nutrition_service: NutritionService,
                 embeddings=None):
        self.nutrition_service = nutrition_service
        self.embeddings = embeddings

        # Check if OpenAI is available
        self.openai_available = False
        if openai_api_key:
            try:
                import openai
                openai.api_key = openai_api_key
                self.openai_available = True
                logger.info("OpenAI API initialized successfully")
            except ImportError:
                logger.warning("OpenAI package not available, using fallback responses")
            except Exception as e:
                logger.error(f"OpenAI initialization failed: {str(e)}")
        else:
            logger.warning("OpenAI API key not provided, AI features will be limited")

        self.conversation_history = []
        self.max_history_length = 10

    async def generate_snack_recommendation(self, user_preferences: Dict[str, Any],
                                            health_goals: List[str]) -> Dict[str, Any]:
        """Generate a complete snack recommendation based on user preferences"""

        try:
            if self.openai_available:
                # Try AI-powered recommendation
                recommendation = await self._ai_recommendation(user_preferences, health_goals)
            else:
                # Use fallback recommendation
                recommendation = self._fallback_recommendation(user_preferences, health_goals)

            # Enhance recommendation with nutritional analysis if ingredients are provided
            if "ingredients" in recommendation and recommendation["ingredients"]:
                try:
                    # Format ingredients properly
                    formatted_ingredients = []
                    for ing in recommendation["ingredients"]:
                        if isinstance(ing, dict) and "name" in ing and "amount_g" in ing:
                            formatted_ingredients.append({
                                "name": str(ing["name"]),
                                "amount_g": float(ing["amount_g"])
                            })

                    if formatted_ingredients:
                        nutrition_analysis = self.nutrition_service.calculate_snack_nutrition(
                            formatted_ingredients
                        )
                        recommendation["nutrition_analysis"] = nutrition_analysis
                        recommendation["health_score"] = nutrition_analysis["health_score"]
                except Exception as e:
                    logger.error(f"Nutrition analysis failed for recommendation: {str(e)}")
                    # Continue without nutrition analysis

            return recommendation

        except Exception as e:
            logger.error(f"Recommendation generation failed: {str(e)}")
            return self._fallback_recommendation(user_preferences, health_goals)

    async def improve_snack_recipe(self, current_recipe: List[Dict[str, Any]],
                                   improvement_goals: List[str]) -> Dict[str, Any]:
        """Suggest improvements to an existing snack recipe"""

        try:
            # Validate and format recipe
            if not current_recipe:
                raise ValueError("Current recipe cannot be empty")

            formatted_recipe = []
            for ing in current_recipe:
                if isinstance(ing, dict) and "name" in ing:
                    formatted_recipe.append({
                        "name": str(ing["name"]),
                        "amount_g": float(ing.get("amount_g", 25))
                    })

            if not formatted_recipe:
                raise ValueError("No valid ingredients found in recipe")

            # Analyze current recipe
            current_nutrition = self.nutrition_service.calculate_snack_nutrition(formatted_recipe)

            # Generate improvements
            if self.openai_available:
                improvements = await self._ai_improvements(formatted_recipe, current_nutrition, improvement_goals)
            else:
                improvements = self._fallback_improvements(current_nutrition, improvement_goals)

            # Add detailed nutritional suggestions
            nutritional_suggestions = self.nutrition_service.suggest_nutritional_improvements(
                current_nutrition, improvement_goals
            )

            improvements["detailed_suggestions"] = nutritional_suggestions
            improvements["current_analysis"] = current_nutrition

            return improvements

        except Exception as e:
            logger.error(f"Recipe improvement failed: {str(e)}")
            return self._fallback_improvements({}, improvement_goals)

    async def chat_about_nutrition(self, user_message: str,
                                   current_snack_context: Optional[Dict[str, Any]] = None) -> str:
        """Handle conversational questions about nutrition and snacks"""

        try:
            if not user_message or not user_message.strip():
                return "I'm here to help with your nutrition questions! What would you like to know?"

            if self.openai_available:
                response = await self._ai_chat(user_message, current_snack_context)
            else:
                response = self._fallback_chat_response(user_message)

            # Update conversation history
            self._update_conversation_history(user_message, response)
            return response

        except Exception as e:
            logger.error(f"Chat failed: {str(e)}")
            return self._fallback_chat_response(user_message)

    async def suggest_ingredient_substitutions(self, ingredient_name: str,
                                               dietary_restrictions: List[str],
                                               recipe_context: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Suggest intelligent ingredient substitutions"""

        try:
            if not ingredient_name or not ingredient_name.strip():
                raise ValueError("Ingredient name is required")

            ingredient_name = ingredient_name.strip()

            # Get similarity-based suggestions from embeddings if available
            embedding_suggestions = []
            if self.embeddings:
                try:
                    embedding_suggestions = self.embeddings.suggest_substitutions(
                        ingredient_name, dietary_restrictions or []
                    )
                except Exception as e:
                    logger.error(f"Embeddings substitution failed: {str(e)}")

            # Enhance with AI reasoning if available
            if self.openai_available and embedding_suggestions:
                try:
                    enhanced_suggestions = await self._ai_substitutions(
                        ingredient_name, embedding_suggestions, dietary_restrictions, recipe_context
                    )
                except Exception as e:
                    logger.error(f"AI substitution enhancement failed: {str(e)}")
                    enhanced_suggestions = embedding_suggestions
            else:
                enhanced_suggestions = embedding_suggestions or self._fallback_substitutions(ingredient_name)

            return {
                "original_ingredient": ingredient_name,
                "suggestions": enhanced_suggestions[:5] if enhanced_suggestions else [],
                "dietary_restrictions": dietary_restrictions or [],
                "substitution_tips": self._generate_substitution_tips(ingredient_name, enhanced_suggestions)
            }

        except Exception as e:
            logger.error(f"Substitution suggestion failed: {str(e)}")
            return {
                "original_ingredient": ingredient_name,
                "suggestions": [],
                "dietary_restrictions": dietary_restrictions or [],
                "substitution_tips": ["Unable to generate substitutions at this time"]
            }

    async def explain_health_score(self, nutrition_data: Dict[str, Any]) -> str:
        """Provide detailed explanation of health score calculation"""

        try:
            health_score = nutrition_data.get("health_score", 0)
            nutrition = nutrition_data.get("nutrition_per_100g", {})

            if self.openai_available:
                explanation = await self._ai_health_explanation(health_score, nutrition)
            else:
                explanation = self._fallback_health_explanation(health_score, nutrition)

            return explanation

        except Exception as e:
            logger.error(f"Health score explanation failed: {str(e)}")
            return self._fallback_health_explanation(
                nutrition_data.get("health_score", 0),
                nutrition_data.get("nutrition_per_100g", {})
            )

    # AI-powered methods (when OpenAI is available)

    async def _ai_recommendation(self, preferences: Dict[str, Any], goals: List[str]) -> Dict[str, Any]:
        """Generate AI-powered recommendation"""
        # Placeholder for OpenAI integration
        # For now, return fallback
        return self._fallback_recommendation(preferences, goals)

    async def _ai_improvements(self, recipe: List[Dict[str, Any]], nutrition: Dict[str, Any],
                               goals: List[str]) -> Dict[str, Any]:
        """Generate AI-powered improvements"""
        # Placeholder for OpenAI integration
        return self._fallback_improvements(nutrition, goals)

    async def _ai_chat(self, message: str, context: Optional[Dict[str, Any]]) -> str:
        """Generate AI-powered chat response"""
        # Placeholder for OpenAI integration
        return self._fallback_chat_response(message)

    async def _ai_substitutions(self, ingredient: str, suggestions: List[Dict[str, Any]],
                                restrictions: List[str], context: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Enhance substitutions with AI analysis"""
        # Placeholder for OpenAI integration
        return suggestions

    async def _ai_health_explanation(self, score: int, nutrition: Dict[str, float]) -> str:
        """Generate AI-powered health explanation"""
        # Placeholder for OpenAI integration
        return self._fallback_health_explanation(score, nutrition)

    # Fallback methods (rule-based responses)

    def _fallback_recommendation(self, preferences: Dict[str, Any], goals: List[str]) -> Dict[str, Any]:
        """Generate recommendation without AI"""

        base_ingredients = []

        # Start with a base
        base_ingredients.append({"name": "oats", "amount_g": 40})
        base_ingredients.append({"name": "almonds", "amount_g": 30})

        # Add based on goals
        if "increase_protein" in goals:
            base_ingredients.append({"name": "protein_powder_plant", "amount_g": 25})

        if "reduce_sugar" in goals:
            base_ingredients.append({"name": "cinnamon", "amount_g": 2})
        else:
            base_ingredients.append({"name": "dates", "amount_g": 20})

        if "increase_fiber" in goals:
            base_ingredients.append({"name": "chia_seeds", "amount_g": 15})

        if any(goal in goals for goal in ["antioxidant_rich", "increase_antioxidants"]):
            base_ingredients.append({"name": "blueberries_dried", "amount_g": 20})

        if "keto_friendly" in goals:
            # Remove high-carb ingredients
            base_ingredients = [ing for ing in base_ingredients if ing["name"] not in ["oats", "dates"]]
            base_ingredients.append({"name": "coconut_flakes", "amount_g": 25})
            base_ingredients.append({"name": "cashews", "amount_g": 35})

        # Add sweetener if chocolate lovers or sweet preference
        if preferences.get("flavors") and "chocolate" in preferences.get("flavors", []):
            base_ingredients.append({"name": "dark_chocolate_70", "amount_g": 15})
        elif preferences.get("flavors") and "sweet" in preferences.get("flavors", []):
            if not any(ing["name"] == "dates" for ing in base_ingredients):
                base_ingredients.append({"name": "honey", "amount_g": 15})

        return {
            "name": "Custom Healthy Snack",
            "description": "Nutritious snack tailored to your preferences and goals",
            "ingredients": base_ingredients,
            "instructions": [
                "Process nuts and oats in food processor until roughly chopped",
                "Add dates or sweetener and process until mixture starts to stick",
                "Mix in remaining ingredients",
                "Form into desired shape (balls, bars, or clusters)",
                "Refrigerate for 30 minutes to set"
            ],
            "prep_time_minutes": 15,
            "key_benefits": self._generate_benefits_from_goals(goals)
        }

    def _fallback_improvements(self, nutrition: Dict[str, Any], goals: List[str]) -> Dict[str, Any]:
        """Generate improvements without AI"""

        suggestions = []
        nutrition_per_100g = nutrition.get("nutrition_per_100g", {})

        protein = nutrition_per_100g.get("protein_g", 0)
        fiber = nutrition_per_100g.get("fiber_g", 0)
        sugar = nutrition_per_100g.get("sugars_g", 0)
        health_score = nutrition.get("health_score", 0)

        if "increase_protein" in goals and protein < 15:
            suggestions.append({
                "type": "add",
                "ingredient": "protein_powder_plant",
                "amount_g": 20,
                "reason": "Boost protein content for muscle support and satiety"
            })

        if "increase_fiber" in goals and fiber < 8:
            suggestions.append({
                "type": "add",
                "ingredient": "chia_seeds",
                "amount_g": 15,
                "reason": "Add fiber for digestive health and sustained energy"
            })

        if "reduce_sugar" in goals and sugar > 20:
            suggestions.append({
                "type": "substitute",
                "original": "dates",
                "replacement": "cinnamon",
                "reason": "Reduce sugar content while adding natural sweetness and flavor"
            })

        if "increase_antioxidants" in goals:
            suggestions.append({
                "type": "add",
                "ingredient": "blueberries_dried",
                "amount_g": 20,
                "reason": "Add powerful antioxidants for cellular protection"
            })

        if "keto_friendly" in goals:
            suggestions.append({
                "type": "substitute",
                "original": "oats",
                "replacement": "coconut_flakes",
                "reason": "Lower carb content for ketogenic diet compatibility"
            })

        return {
            "suggested_changes": suggestions,
            "expected_improvements": [f"Addresses {goal.replace('_', ' ')}" for goal in goals],
            "estimated_new_score": min(health_score + (len(suggestions) * 5), 100)
        }

    def _fallback_chat_response(self, user_message: str) -> str:
        """Generate chat response without AI"""

        message_lower = user_message.lower()

        if any(word in message_lower for word in ["protein", "muscle", "workout"]):
            return "Protein is essential for muscle building and repair. For snacks, aim for 15-20g protein. Great sources include protein powder, Greek yogurt, nuts, seeds, and legumes. Post-workout snacks should combine protein with some carbs for optimal recovery."

        elif any(word in message_lower for word in ["sugar", "sweet", "diabetes"]):
            return "Natural sugars from fruits like dates are generally better than refined sugars because they come with fiber and nutrients. Try pairing sweet ingredients with protein and fiber to slow sugar absorption. For diabetic-friendly options, focus on low-glycemic ingredients like nuts, seeds, and berries."

        elif any(word in message_lower for word in ["fiber", "digestion", "gut"]):
            return "Fiber is crucial for digestive health and helps you feel full longer. Aim for 25-35g daily total. Great snack sources include chia seeds (10g per 2 tbsp), flax seeds, oats, and berries. Start slowly if increasing fiber intake to avoid digestive discomfort."

        elif any(word in message_lower for word in ["fat", "healthy", "omega"]):
            return "Healthy fats from nuts, seeds, avocados, and olive oil provide sustained energy and help absorb fat-soluble vitamins. Omega-3 fatty acids from chia seeds, walnuts, and flax are especially beneficial for brain and heart health."

        elif any(word in message_lower for word in ["energy", "tired", "boost"]):
            return "For sustained energy, combine complex carbs with protein and healthy fats. Avoid simple sugars that cause energy crashes. Great energizing combinations include nuts with fruit, oats with protein powder, or seeds with berries."

        elif any(word in message_lower for word in ["weight", "lose", "diet"]):
            return "For weight management, focus on nutrient-dense, high-fiber, high-protein snacks that keep you satisfied. Examples include protein balls, veggie sticks with nut butter, or Greek yogurt with berries. Portion control is key - aim for 150-200 calorie snacks."

        elif any(word in message_lower for word in ["antioxidant", "inflammation", "health"]):
            return "Antioxidants help fight inflammation and protect cells. The best sources for snacks include berries (especially blueberries), dark chocolate (70%+ cacao), nuts, seeds, and colorful fruits and vegetables."

        elif any(word in message_lower for word in ["calcium", "bone", "strong"]):
            return "Calcium is essential for bone health. Good snack sources include almonds, sesame seeds (tahini), leafy greens, and fortified plant milks. Pair with vitamin D for better absorption."

        elif any(word in message_lower for word in ["iron", "anemia", "energy"]):
            return "Iron supports oxygen transport and energy levels. Plant-based sources for snacks include pumpkin seeds, dark chocolate, quinoa, and dried fruits. Pair with vitamin C (like citrus) to enhance absorption."

        else:
            return "That's a great nutrition question! I'd recommend focusing on whole food ingredients and balanced macronutrients for the healthiest snacks. What specific aspect of nutrition would you like to explore further?"

    def _fallback_substitutions(self, ingredient_name: str) -> List[Dict[str, Any]]:
        """Generate fallback substitution suggestions"""

        # Simple substitution mappings
        substitution_map = {
            "almonds": [
                {"name": "walnuts", "reason": "Similar healthy fats and protein"},
                {"name": "cashews", "reason": "Creamy texture with good nutrition"},
                {"name": "sunflower_seeds", "reason": "Nut-free alternative with protein"}
            ],
            "walnuts": [
                {"name": "almonds", "reason": "Similar protein and healthy fats"},
                {"name": "pecans", "reason": "Similar texture and omega-3s"},
                {"name": "chia_seeds", "reason": "Omega-3 rich alternative"}
            ],
            "cashews": [
                {"name": "almonds", "reason": "Similar protein content"},
                {"name": "sunflower_seeds", "reason": "Nut-free option with minerals"},
                {"name": "coconut_flakes", "reason": "Creamy texture alternative"}
            ],
            "dates": [
                {"name": "maple_syrup", "reason": "Natural liquid sweetener"},
                {"name": "honey", "reason": "Natural sweetener with enzymes"},
                {"name": "banana", "reason": "Natural fruit sweetness with potassium"}
            ],
            "honey": [
                {"name": "maple_syrup", "reason": "Plant-based liquid sweetener"},
                {"name": "dates", "reason": "Whole food sweetener with fiber"},
                {"name": "coconut_nectar", "reason": "Low glycemic natural sweetener"}
            ],
            "maple_syrup": [
                {"name": "honey", "reason": "Similar consistency and sweetness"},
                {"name": "dates", "reason": "Whole food alternative"},
                {"name": "coconut_nectar", "reason": "Similar liquid sweetener"}
            ],
            "oats": [
                {"name": "quinoa", "reason": "Gluten-free grain with complete protein"},
                {"name": "buckwheat", "reason": "Gluten-free with similar texture"},
                {"name": "coconut_flakes", "reason": "Low-carb alternative"}
            ],
            "quinoa": [
                {"name": "oats", "reason": "Similar hearty texture"},
                {"name": "millet", "reason": "Ancient grain with mild flavor"},
                {"name": "buckwheat", "reason": "Gluten-free grain alternative"}
            ],
            "protein_powder_whey": [
                {"name": "protein_powder_plant", "reason": "Plant-based protein alternative"},
                {"name": "greek_yogurt_powder", "reason": "Natural protein source"},
                {"name": "hemp_protein", "reason": "Complete amino acid profile"}
            ],
            "protein_powder_plant": [
                {"name": "protein_powder_whey", "reason": "Complete protein source"},
                {"name": "hemp_protein", "reason": "Raw plant protein option"},
                {"name": "spirulina", "reason": "Superfood protein source"}
            ],
            "chia_seeds": [
                {"name": "flax_seeds", "reason": "Similar omega-3 and fiber content"},
                {"name": "hemp_seeds", "reason": "Protein-rich seed alternative"},
                {"name": "sesame_seeds", "reason": "Calcium-rich alternative"}
            ],
            "flax_seeds": [
                {"name": "chia_seeds", "reason": "Similar omega-3 benefits"},
                {"name": "hemp_seeds", "reason": "Nutty flavor with protein"},
                {"name": "sunflower_seeds", "reason": "Vitamin E rich alternative"}
            ],
            "coconut_flakes": [
                {"name": "almonds", "reason": "Similar healthy fats"},
                {"name": "cashews", "reason": "Creamy texture alternative"},
                {"name": "sunflower_seeds", "reason": "Different texture but good fats"}
            ],
            "dark_chocolate_70": [
                {"name": "cacao_powder", "reason": "Pure chocolate without added sugar"},
                {"name": "carob_powder", "reason": "Caffeine-free chocolate alternative"},
                {"name": "cocoa_nibs", "reason": "Raw chocolate with crunch"}
            ]
        }

        suggestions = substitution_map.get(ingredient_name, [])

        # Add similarity scores and format properly
        formatted_suggestions = []
        for i, sub in enumerate(suggestions):
            formatted_suggestions.append({
                "name": sub["name"],
                "similarity": 0.8 - (i * 0.1),  # Decreasing similarity
                "reason": sub["reason"],
                "nutrition_comparison": {
                    "protein_g": "similar",
                    "calories_per_100g": "similar",
                    "fiber_g": "similar"
                }
            })

        return formatted_suggestions

    def _fallback_health_explanation(self, health_score: int, nutrition: Dict[str, float]) -> str:
        """Generate health score explanation without AI"""

        protein = nutrition.get("protein_g", 0)
        fiber = nutrition.get("fiber_g", 0)
        sugar = nutrition.get("sugars_g", 0)
        sodium = nutrition.get("sodium_mg", 0)

        explanation_parts = []

        # Overall assessment
        if health_score >= 80:
            explanation_parts.append("This is an excellent health score indicating a very nutritious snack.")
        elif health_score >= 60:
            explanation_parts.append("This is a good health score showing solid nutritional value.")
        elif health_score >= 40:
            explanation_parts.append("This is a moderate health score with room for improvement.")
        else:
            explanation_parts.append("This score suggests significant nutritional improvements are needed.")

        # Specific nutritional factors
        if protein > 15:
            explanation_parts.append("The high protein content significantly boosts the score.")
        elif protein < 5:
            explanation_parts.append("Low protein content reduces the overall score.")

        if fiber > 8:
            explanation_parts.append("Excellent fiber content contributes positively to digestive health.")
        elif fiber < 3:
            explanation_parts.append("Low fiber content limits the nutritional value.")

        if sugar > 25:
            explanation_parts.append("High sugar content significantly reduces the health score.")
        elif sugar < 8:
            explanation_parts.append("Low sugar content helps maintain a healthy score.")

        if sodium > 500:
            explanation_parts.append("High sodium content negatively impacts the score.")

        return " ".join(explanation_parts)

    # Helper methods

    def _generate_benefits_from_goals(self, goals: List[str]) -> List[str]:
        """Generate benefit statements from health goals"""
        benefits = []

        goal_benefits = {
            "increase_protein": "High protein for muscle support",
            "reduce_sugar": "Low sugar for stable energy",
            "increase_fiber": "High fiber for digestive health",
            "keto_friendly": "Low carb for ketogenic diet",
            "increase_antioxidants": "Rich in antioxidants for cellular protection",
            "post_workout": "Optimized for post-exercise recovery",
            "pre_workout": "Sustained energy for workouts",
            "heart_healthy": "Supports cardiovascular health",
            "anti_inflammatory": "Anti-inflammatory ingredients"
        }

        for goal in goals:
            if goal in goal_benefits:
                benefits.append(goal_benefits[goal])

        # Add default benefits if none from goals
        if not benefits:
            benefits = ["Natural ingredients", "Balanced nutrition", "Sustained energy"]

        return benefits[:4]  # Limit to 4 benefits

    def _generate_substitution_tips(self, original: str, suggestions: List[Dict[str, Any]]) -> List[str]:
        """Generate practical substitution tips"""

        tips = []

        if original in ["honey", "maple_syrup", "dates"]:
            tips.extend([
                "When substituting sweeteners, start with less and adjust to taste",
                "Liquid sweeteners may require reducing other liquids in the recipe"
            ])

        elif original in ["almonds", "walnuts", "cashews"]:
            tips.extend([
                "Different nuts provide different textures - consider the final mouthfeel",
                "Toast substituted nuts lightly to enhance their flavor"
            ])

        elif original in ["oats", "quinoa"]:
            tips.extend([
                "Grain substitutions may affect binding - add extra liquid if needed",
                "Consider grinding harder grains for better integration"
            ])

        elif "protein_powder" in original:
            tips.extend([
                "Different protein powders have varying sweetness levels",
                "Plant proteins may need extra flavoring compared to whey"
            ])

        else:
            tips.extend([
                "Start with small amounts when trying new ingredients",
                "Consider how the substitution affects both nutrition and taste"
            ])

        return tips[:3]  # Limit to 3 tips

    def _update_conversation_history(self, user_message: str, ai_response: str):
        """Update conversation history for context"""
        self.conversation_history.append({
            "user": user_message,
            "ai": ai_response,
            "timestamp": asyncio.get_event_loop().time() if asyncio.get_event_loop() else 0
        })

        # Keep only recent conversations
        if len(self.conversation_history) > self.max_history_length:
            self.conversation_history = self.conversation_history[-self.max_history_length:]