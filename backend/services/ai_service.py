import openai
import json
import logging
from typing import Dict, List, Any, Optional
import asyncio
from services.nutrition_service import NutritionService
from models.ingredient_embeddings import IngredientEmbeddings

logger = logging.getLogger(__name__)


class AIService:
    def __init__(self, openai_api_key: str, nutrition_service: NutritionService,
                 embeddings: IngredientEmbeddings):
        self.nutrition_service = nutrition_service
        self.embeddings = embeddings

        if openai_api_key:
            openai.api_key = openai_api_key
            self.openai_available = True
        else:
            self.openai_available = False
            logger.warning("OpenAI API key not provided, AI features will be limited")

        self.conversation_history = []
        self.max_history_length = 10

    async def generate_snack_recommendation(self, user_preferences: Dict[str, Any],
                                            health_goals: List[str]) -> Dict[str, Any]:
        """Generate a complete snack recommendation based on user preferences"""

        # Create base prompt
        prompt = self._create_recommendation_prompt(user_preferences, health_goals)

        if self.openai_available:
            try:
                response = await self._call_openai_api(prompt, max_tokens=800)
                recommendation = self._parse_recommendation_response(response)
            except Exception as e:
                logger.error(f"OpenAI API error: {str(e)}")
                recommendation = self._fallback_recommendation(user_preferences, health_goals)
        else:
            recommendation = self._fallback_recommendation(user_preferences, health_goals)

        # Enhance recommendation with nutritional analysis
        if "ingredients" in recommendation:
            nutrition_analysis = self.nutrition_service.calculate_snack_nutrition(
                recommendation["ingredients"]
            )
            recommendation["nutrition_analysis"] = nutrition_analysis
            recommendation["health_score"] = nutrition_analysis["health_score"]

        return recommendation

    async def improve_snack_recipe(self, current_recipe: List[Dict[str, Any]],
                                   improvement_goals: List[str]) -> Dict[str, Any]:
        """Suggest improvements to an existing snack recipe"""

        # Analyze current recipe
        current_nutrition = self.nutrition_service.calculate_snack_nutrition(current_recipe)

        # Create improvement prompt
        prompt = self._create_improvement_prompt(current_recipe, current_nutrition, improvement_goals)

        if self.openai_available:
            try:
                response = await self._call_openai_api(prompt, max_tokens=600)
                improvements = self._parse_improvement_response(response)
            except Exception as e:
                logger.error(f"OpenAI API error: {str(e)}")
                improvements = self._fallback_improvements(current_nutrition, improvement_goals)
        else:
            improvements = self._fallback_improvements(current_nutrition, improvement_goals)

        # Add detailed nutritional suggestions
        nutritional_suggestions = self.nutrition_service.suggest_nutritional_improvements(
            current_nutrition, improvement_goals
        )

        improvements["detailed_suggestions"] = nutritional_suggestions
        improvements["current_analysis"] = current_nutrition

        return improvements

    async def chat_about_nutrition(self, user_message: str,
                                   current_snack_context: Optional[Dict[str, Any]] = None) -> str:
        """Handle conversational questions about nutrition and snacks"""

        # Add context to conversation
        context_prompt = self._create_chat_context(current_snack_context)
        full_prompt = f"{context_prompt}\n\nUser: {user_message}\nAI Nutritionist:"

        if self.openai_available:
            try:
                response = await self._call_openai_api(full_prompt, max_tokens=300)
                # Update conversation history
                self._update_conversation_history(user_message, response)
                return response
            except Exception as e:
                logger.error(f"OpenAI API error: {str(e)}")
                return self._fallback_chat_response(user_message)
        else:
            return self._fallback_chat_response(user_message)

    async def suggest_ingredient_substitutions(self, ingredient_name: str,
                                               dietary_restrictions: List[str],
                                               recipe_context: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Suggest intelligent ingredient substitutions"""

        # Get similarity-based suggestions
        embedding_suggestions = self.embeddings.suggest_substitutions(
            ingredient_name, dietary_restrictions
        )

        # Enhance with AI reasoning
        if self.openai_available and embedding_suggestions:
            prompt = self._create_substitution_prompt(
                ingredient_name, embedding_suggestions, dietary_restrictions, recipe_context
            )

            try:
                ai_analysis = await self._call_openai_api(prompt, max_tokens=400)
                enhanced_suggestions = self._parse_substitution_response(
                    ai_analysis, embedding_suggestions
                )
            except Exception as e:
                logger.error(f"OpenAI API error: {str(e)}")
                enhanced_suggestions = embedding_suggestions
        else:
            enhanced_suggestions = embedding_suggestions

        return {
            "original_ingredient": ingredient_name,
            "suggestions": enhanced_suggestions[:5],
            "dietary_restrictions": dietary_restrictions,
            "substitution_tips": self._generate_substitution_tips(ingredient_name, enhanced_suggestions)
        }

    async def explain_health_score(self, nutrition_data: Dict[str, Any]) -> str:
        """Provide detailed explanation of health score calculation"""

        health_score = nutrition_data.get("health_score", 0)
        explanation = nutrition_data.get("health_explanation", "")
        nutrition = nutrition_data.get("nutrition_per_100g", {})

        prompt = f"""
        Explain in simple terms why this snack received a health score of {health_score}/100.

        Key nutrition facts:
        - Protein: {nutrition.get('protein_g', 0):.1f}g per 100g
        - Fiber: {nutrition.get('fiber_g', 0):.1f}g per 100g
        - Sugar: {nutrition.get('sugars_g', 0):.1f}g per 100g
        - Calories: {nutrition.get('calories_per_100g', 0):.0f} per 100g
        - Saturated fat: {nutrition.get('saturated_fat_g', 0):.1f}g per 100g

        Highlights: {', '.join(nutrition_data.get('nutritional_highlights', []))}

        Provide a clear, encouraging explanation that helps the user understand what makes this snack healthy or how to improve it.
        """

        if self.openai_available:
            try:
                return await self._call_openai_api(prompt, max_tokens=250)
            except Exception as e:
                logger.error(f"OpenAI API error: {str(e)}")

        return self._fallback_health_explanation(health_score, nutrition)

    def _create_recommendation_prompt(self, preferences: Dict[str, Any], goals: List[str]) -> str:
        """Create prompt for snack recommendation"""
        available_ingredients = list(self.embeddings.ingredient_data.keys())

        prompt = f"""
        Create a healthy snack recipe based on these preferences and goals:

        Preferences:
        - Favorite flavors: {preferences.get('flavors', ['sweet'])}
        - Dietary restrictions: {preferences.get('dietary_restrictions', [])}
        - Texture preference: {preferences.get('texture', 'mixed')}
        - Preparation time: {preferences.get('prep_time', 'quick')}

        Health goals: {goals}

        Available ingredients: {', '.join(available_ingredients[:20])}...

        Respond with a JSON format:
        {{
            "name": "Snack name",
            "description": "Brief description",
            "ingredients": [
                {{"name": "ingredient_name", "amount_g": 30}},
                {{"name": "ingredient_name", "amount_g": 20}}
            ],
            "instructions": ["Step 1", "Step 2"],
            "prep_time_minutes": 10,
            "key_benefits": ["Benefit 1", "Benefit 2"]
        }}

        Focus on creating a balanced, nutritious snack that meets the specified goals.
        """

        return prompt

    def _create_improvement_prompt(self, recipe: List[Dict[str, Any]],
                                   nutrition: Dict[str, Any], goals: List[str]) -> str:
        """Create prompt for recipe improvement suggestions"""

        current_ingredients = [f"{ing['name']} ({ing['amount_g']}g)" for ing in recipe]
        health_score = nutrition.get("health_score", 0)

        prompt = f"""
        Analyze this snack recipe and suggest improvements:

        Current recipe: {', '.join(current_ingredients)}
        Current health score: {health_score}/100
        Improvement goals: {goals}

        Current nutrition (per 100g):
        - Protein: {nutrition.get('nutrition_per_100g', {}).get('protein_g', 0):.1f}g
        - Fiber: {nutrition.get('nutrition_per_100g', {}).get('fiber_g', 0):.1f}g
        - Sugar: {nutrition.get('nutrition_per_100g', {}).get('sugars_g', 0):.1f}g

        Provide specific, actionable improvements in JSON format:
        {{
            "suggested_changes": [
                {{"type": "substitute", "original": "ingredient", "replacement": "better_ingredient", "reason": "explanation"}},
                {{"type": "add", "ingredient": "new_ingredient", "amount_g": 15, "reason": "explanation"}},
                {{"type": "reduce", "ingredient": "existing_ingredient", "new_amount_g": 10, "reason": "explanation"}}
            ],
            "expected_improvements": ["Better protein content", "Lower sugar"],
            "estimated_new_score": 85
        }}
        """

        return prompt

    def _create_chat_context(self, snack_context: Optional[Dict[str, Any]]) -> str:
        """Create context for conversational AI"""

        base_context = """
        You are a friendly, knowledgeable nutritionist and snack expert. You help users create healthy, 
        delicious snacks and answer questions about nutrition. Keep responses conversational, encouraging, 
        and scientifically accurate but easy to understand.
        """

        if snack_context:
            nutrition = snack_context.get("nutrition_per_100g", {})
            context_addition = f"""

            Current snack context:
            - Health score: {snack_context.get('health_score', 0)}/100
            - Protein: {nutrition.get('protein_g', 0):.1f}g per 100g
            - Fiber: {nutrition.get('fiber_g', 0):.1f}g per 100g
            - Ingredients: {', '.join([ing['name'] for ing in snack_context.get('ingredient_breakdown', [])])}
            """
            base_context += context_addition

        return base_context

    async def _call_openai_api(self, prompt: str, max_tokens: int = 500) -> str:
        """Make API call to OpenAI with error handling"""
        try:
            response = await asyncio.to_thread(
                openai.ChatCompletion.create,
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful nutrition expert and snack designer."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=0.7
            )

            return response.choices[0].message.content.strip()

        except Exception as e:
            logger.error(f"OpenAI API call failed: {str(e)}")
            raise

    def _parse_recommendation_response(self, response: str) -> Dict[str, Any]:
        """Parse OpenAI response for snack recommendation"""
        try:
            # Try to parse as JSON first
            return json.loads(response)
        except json.JSONDecodeError:
            # Fallback parsing if JSON is malformed
            return self._extract_recommendation_from_text(response)

    def _parse_improvement_response(self, response: str) -> Dict[str, Any]:
        """Parse OpenAI response for improvement suggestions"""
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            return self._extract_improvements_from_text(response)

    def _fallback_recommendation(self, preferences: Dict[str, Any], goals: List[str]) -> Dict[str, Any]:
        """Generate recommendation without AI"""

        # Simple rule-based recommendation
        base_ingredients = []

        # Add protein source
        if "increase_protein" in goals:
            base_ingredients.append({"name": "protein_powder_plant", "amount_g": 25})

        # Add healthy fats
        base_ingredients.append({"name": "almonds", "amount_g": 30})

        # Add fiber and sweetness
        base_ingredients.append({"name": "dates", "amount_g": 20})
        base_ingredients.append({"name": "oats", "amount_g": 40})

        # Add antioxidants
        if preferences.get("flavors", []) and "chocolate" in preferences["flavors"]:
            base_ingredients.append({"name": "dark_chocolate_70", "amount_g": 15})
        else:
            base_ingredients.append({"name": "blueberries_dried", "amount_g": 20})

        return {
            "name": "Balanced Energy Bites",
            "description": "Nutritious energy bites with protein, healthy fats, and natural sweetness",
            "ingredients": base_ingredients,
            "instructions": [
                "Pulse oats and almonds in food processor until roughly chopped",
                "Add dates and process until mixture starts to stick together",
                "Mix in remaining ingredients",
                "Roll into bite-sized balls",
                "Refrigerate for 30 minutes to firm up"
            ],
            "prep_time_minutes": 15,
            "key_benefits": ["High protein", "Natural sweetness", "Healthy fats", "Good fiber content"]
        }

    def _fallback_improvements(self, nutrition: Dict[str, Any], goals: List[str]) -> Dict[str, Any]:
        """Generate improvements without AI"""

        suggestions = []

        protein = nutrition.get("nutrition_per_100g", {}).get("protein_g", 0)
        fiber = nutrition.get("nutrition_per_100g", {}).get("fiber_g", 0)
        sugar = nutrition.get("nutrition_per_100g", {}).get("sugars_g", 0)

        if "increase_protein" in goals and protein < 15:
            suggestions.append({
                "type": "add",
                "ingredient": "protein_powder_plant",
                "amount_g": 20,
                "reason": "Boost protein content for muscle support"
            })

        if "increase_fiber" in goals and fiber < 8:
            suggestions.append({
                "type": "add",
                "ingredient": "chia_seeds",
                "amount_g": 15,
                "reason": "Add fiber for digestive health"
            })

        if "reduce_sugar" in goals and sugar > 20:
            suggestions.append({
                "type": "substitute",
                "original": "honey",
                "replacement": "stevia",
                "reason": "Reduce sugar content while maintaining sweetness"
            })

        return {
            "suggested_changes": suggestions,
            "expected_improvements": [f"Addresses {goal}" for goal in goals],
            "estimated_new_score": min(nutrition.get("health_score", 0) + 10, 100)
        }

    def _fallback_chat_response(self, user_message: str) -> str:
        """Generate chat response without AI"""

        message_lower = user_message.lower()

        if any(word in message_lower for word in ["protein", "muscle", "workout"]):
            return "Protein is essential for muscle building and repair. Aim for 20-30g of protein per snack if you're active. Great sources include protein powder, Greek yogurt, nuts, and seeds!"

        elif any(word in message_lower for word in ["sugar", "sweet", "diabetes"]):
            return "Natural sugars from fruits are generally better than added sugars. Try using dates, stevia, or monk fruit as sweeteners. Pairing sweet ingredients with protein and fiber helps slow sugar absorption!"

        elif any(word in message_lower for word in ["fiber", "digestion", "gut"]):
            return "Fiber is crucial for digestive health! Aim for at least 25g per day. Chia seeds, flax seeds, oats, and berries are excellent sources. Start slowly if you're increasing fiber intake."

        elif any(word in message_lower for word in ["fat", "healthy", "omega"]):
            return "Healthy fats from nuts, seeds, and avocados are important for nutrient absorption and brain health. Omega-3 fatty acids from chia seeds and walnuts are especially beneficial!"

        else:
            return "That's a great question about nutrition! I'd recommend focusing on whole food ingredients, balanced macronutrients, and listening to your body's needs. What specific aspect would you like to know more about?"

    def _fallback_health_explanation(self, health_score: int, nutrition: Dict[str, float]) -> str:
        """Generate health score explanation without AI"""

        protein = nutrition.get("protein_g", 0)
        fiber = nutrition.get("fiber_g", 0)
        sugar = nutrition.get("sugars_g", 0)

        if health_score >= 80:
            return f"Excellent score! This snack provides {protein:.1f}g protein and {fiber:.1f}g fiber with moderate sugar content. It's a nutritionally balanced choice that supports your health goals."

        elif health_score >= 60:
            return f"Good score! With {protein:.1f}g protein and {fiber:.1f}g fiber, this snack has solid nutrition. Consider reducing sugar content or adding more nutrient-dense ingredients to boost the score further."

        elif health_score >= 40:
            return f"Moderate score. While this snack provides some nutrition ({protein:.1f}g protein, {fiber:.1f}g fiber), there's room for improvement. Try adding more protein, fiber, or antioxidant-rich ingredients."

        else:
            return f"This snack could be more nutritious. Consider adding protein sources, high-fiber ingredients, and reducing sugar content ({sugar:.1f}g currently) to create a more balanced snack."

    def _update_conversation_history(self, user_message: str, ai_response: str):
        """Update conversation history for context"""
        self.conversation_history.append({
            "user": user_message,
            "ai": ai_response,
            "timestamp": asyncio.get_event_loop().time()
        })

        # Keep only recent conversations
        if len(self.conversation_history) > self.max_history_length:
            self.conversation_history = self.conversation_history[-self.max_history_length:]

    def _create_substitution_prompt(self, ingredient: str, suggestions: List[Dict[str, Any]],
                                    restrictions: List[str], context: List[Dict[str, Any]]) -> str:
        """Create prompt for ingredient substitution analysis"""

        context_ingredients = [ing["name"] for ing in context]
        suggestion_names = [sug["name"] for sug in suggestions]

        prompt = f"""
               Analyze these ingredient substitutions for {ingredient} in a snack recipe:

               Current recipe contains: {', '.join(context_ingredients)}
               Dietary restrictions: {restrictions}

               Suggested substitutions: {', '.join(suggestion_names)}

               For each substitution, provide:
               1. How it affects the overall flavor profile
               2. Nutritional trade-offs
               3. Best use case scenario
               4. Any preparation differences

               Focus on practical advice for home snack makers.
               """

        return prompt

    def _parse_substitution_response(self, ai_response: str,
                                     original_suggestions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Parse and enhance substitution suggestions with AI analysis"""

        enhanced_suggestions = []

        for suggestion in original_suggestions:
            enhanced = suggestion.copy()

            # Try to extract relevant AI analysis for this ingredient
            suggestion_name = suggestion["name"]
            if suggestion_name.lower() in ai_response.lower():
                # Extract relevant section (simple text processing)
                lines = ai_response.split('\n')
                relevant_lines = [line for line in lines if suggestion_name.lower() in line.lower()]
                if relevant_lines:
                    enhanced["ai_analysis"] = ' '.join(relevant_lines[:2])

            enhanced_suggestions.append(enhanced)

        return enhanced_suggestions

    def _generate_substitution_tips(self, original: str, suggestions: List[Dict[str, Any]]) -> List[str]:
        """Generate practical substitution tips"""

        tips = []

        if original in ["honey", "maple_syrup", "dates"]:
            tips.append("When substituting sweeteners, start with less and adjust to taste")
            tips.append("Liquid sweeteners may require reducing other liquids in the recipe")

        elif original in ["almonds", "walnuts", "cashews"]:
            tips.append("Different nuts provide different textures - consider the final mouthfeel")
            tips.append("Toast substituted nuts lightly to enhance flavor")

        elif original in ["oats", "quinoa"]:
            tips.append("Grain substitutions may affect binding - add extra liquid if needed")
            tips.append("Consider grinding harder grains for better integration")

        elif original.startswith("protein_powder"):
            tips.append("Different protein powders have varying sweetness levels")
            tips.append("Plant proteins may need extra flavoring compared to whey")

        else:
            tips.append("Start with small amounts when trying new ingredients")
            tips.append("Consider how the substitution affects both nutrition and taste")

        return tips[:3]  # Limit to 3 tips

    def _extract_recommendation_from_text(self, text: str) -> Dict[str, Any]:
        """Extract recommendation data from unstructured text"""

        # Simple text parsing fallback
        lines = text.split('\n')

        recommendation = {
            "name": "Custom Healthy Snack",
            "description": "AI-generated healthy snack recommendation",
            "ingredients": [],
            "instructions": [],
            "prep_time_minutes": 15,
            "key_benefits": []
        }

        # Look for ingredient mentions
        available_ingredients = list(self.embeddings.ingredient_data.keys())
        mentioned_ingredients = []

        for ingredient in available_ingredients:
            if ingredient.replace('_', ' ') in text.lower():
                mentioned_ingredients.append({
                    "name": ingredient,
                    "amount_g": 25  # Default amount
                })

        if mentioned_ingredients:
            recommendation["ingredients"] = mentioned_ingredients[:6]  # Limit to 6 ingredients

        # Extract benefits if mentioned
        benefit_keywords = ["protein", "fiber", "antioxidant", "healthy", "energy", "vitamin"]
        for keyword in benefit_keywords:
            if keyword in text.lower():
                recommendation["key_benefits"].append(f"Good source of {keyword}")

        return recommendation

    def _extract_improvements_from_text(self, text: str) -> Dict[str, Any]:
        """Extract improvement suggestions from unstructured text"""

        improvements = {
            "suggested_changes": [],
            "expected_improvements": [],
            "estimated_new_score": 75
        }

        # Look for action words
        if "add" in text.lower():
            improvements["suggested_changes"].append({
                "type": "add",
                "ingredient": "chia_seeds",
                "amount_g": 15,
                "reason": "Boost fiber and omega-3 content"
            })

        if "reduce" in text.lower() or "less" in text.lower():
            improvements["suggested_changes"].append({
                "type": "reduce",
                "ingredient": "honey",
                "new_amount_g": 10,
                "reason": "Lower sugar content"
            })

        if "substitute" in text.lower() or "replace" in text.lower():
            improvements["suggested_changes"].append({
                "type": "substitute",
                "original": "milk_chocolate",
                "replacement": "dark_chocolate_70",
                "reason": "Higher antioxidant content, less sugar"
            })

        return improvements

    async def generate_snack_variations(self, base_recipe: List[Dict[str, Any]],
                                        variation_themes: List[str]) -> Dict[str, Any]:
        """Generate creative variations of a base snack recipe"""

        base_nutrition = self.nutrition_service.calculate_snack_nutrition(base_recipe)
        base_ingredients = [ing["name"] for ing in base_recipe]

        variations = {}

        for theme in variation_themes:
            if self.openai_available:
                try:
                    prompt = self._create_variation_prompt(base_recipe, theme)
                    response = await self._call_openai_api(prompt, max_tokens=400)
                    variation = self._parse_recommendation_response(response)
                except Exception as e:
                    logger.error(f"AI variation generation failed: {str(e)}")
                    variation = self._generate_theme_variation(base_recipe, theme)
            else:
                variation = self._generate_theme_variation(base_recipe, theme)

            # Calculate nutrition for variation
            if "ingredients" in variation:
                variation_nutrition = self.nutrition_service.calculate_snack_nutrition(
                    variation["ingredients"]
                )
                variation["nutrition_analysis"] = variation_nutrition
                variation["health_score"] = variation_nutrition["health_score"]

                # Compare with base recipe
                comparison = self.nutrition_service.compare_snack_versions(
                    base_recipe, variation["ingredients"]
                )
                variation["comparison_with_base"] = comparison

            variations[theme] = variation

        return {
            "base_recipe": {
                "ingredients": base_recipe,
                "nutrition": base_nutrition
            },
            "variations": variations,
            "theme_count": len(variations)
        }

    def _create_variation_prompt(self, base_recipe: List[Dict[str, Any]], theme: str) -> str:
        """Create prompt for recipe variation generation"""

        base_ingredients = [f"{ing['name']} ({ing['amount_g']}g)" for ing in base_recipe]

        theme_guidelines = {
            "tropical": "Use coconut, tropical fruits, and bright flavors",
            "chocolate_lovers": "Focus on different types of chocolate and complementary flavors",
            "protein_packed": "Maximize protein content while maintaining taste",
            "antioxidant_rich": "Emphasize ingredients high in antioxidants and phytonutrients",
            "low_sugar": "Minimize sugar content using natural low-glycemic alternatives",
            "crunchy": "Focus on texture variety with nuts, seeds, and crispy elements",
            "creamy": "Emphasize smooth, creamy textures and rich mouthfeel",
            "spiced": "Incorporate warming spices and complex flavor profiles",
            "energizing": "Optimize for sustained energy and pre/post workout nutrition",
            "kid_friendly": "Appeal to children while maintaining nutritional value"
        }

        guideline = theme_guidelines.get(theme, "Create a unique and healthy variation")

        prompt = f"""
               Create a {theme} variation of this base snack recipe:
               Base ingredients: {', '.join(base_ingredients)}

               Theme guidance: {guideline}

               Create a variation that:
               1. Maintains or improves nutritional value
               2. Clearly reflects the {theme} theme
               3. Uses realistic ingredient amounts
               4. Considers flavor harmony

               Respond in JSON format:
               {{
                   "name": "Themed variation name",
                   "description": "What makes this variation special",
                   "ingredients": [
                       {{"name": "ingredient_name", "amount_g": 25}}
                   ],
                   "theme_highlights": ["Key theme element 1", "Key theme element 2"],
                   "flavor_profile": "Overall taste description"
               }}
               """

        return prompt

    def _generate_theme_variation(self, base_recipe: List[Dict[str, Any]], theme: str) -> Dict[str, Any]:
        """Generate theme variation without AI (fallback)"""

        # Start with base recipe and modify based on theme
        variation_ingredients = base_recipe.copy()

        if theme == "tropical":
            # Add tropical elements
            variation_ingredients.append({"name": "coconut_flakes", "amount_g": 20})
            # Replace some ingredients with tropical alternatives
            for i, ing in enumerate(variation_ingredients):
                if ing["name"] == "cranberries_dried":
                    variation_ingredients[i] = {"name": "coconut_flakes", "amount_g": ing["amount_g"]}

        elif theme == "chocolate_lovers":
            # Increase chocolate content
            variation_ingredients.append({"name": "dark_chocolate_70", "amount_g": 25})

        elif theme == "protein_packed":
            # Add protein sources
            variation_ingredients.append({"name": "protein_powder_plant", "amount_g": 30})

        elif theme == "antioxidant_rich":
            # Add high-antioxidant ingredients
            variation_ingredients.append({"name": "blueberries_dried", "amount_g": 20})
            variation_ingredients.append({"name": "cinnamon", "amount_g": 2})

        elif theme == "low_sugar":
            # Remove or reduce high-sugar ingredients
            variation_ingredients = [
                ing for ing in variation_ingredients
                if ing["name"] not in ["dates", "honey", "maple_syrup"]
            ]
            # Add low-sugar alternatives
            variation_ingredients.append({"name": "vanilla_extract", "amount_g": 2})

        else:  # Default variation
            variation_ingredients.append({"name": "chia_seeds", "amount_g": 15})

        return {
            "name": f"{theme.title()} Energy Bites",
            "description": f"A {theme} twist on the classic energy bite recipe",
            "ingredients": variation_ingredients,
            "theme_highlights": [f"Enhanced {theme} flavor", "Nutritionally optimized"],
            "flavor_profile": f"Balanced with prominent {theme} notes"
        }

    async def analyze_snack_trends(self, user_snacks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze user's snacking patterns and provide insights"""

        if not user_snacks:
            return {"message": "No snack data available for analysis"}

        # Calculate nutrition for all snacks
        snack_analyses = []
        for snack in user_snacks:
            if "ingredients" in snack:
                nutrition = self.nutrition_service.calculate_snack_nutrition(snack["ingredients"])
                snack_analyses.append({
                    "name": snack.get("name", "Unnamed Snack"),
                    "nutrition": nutrition,
                    "created_date": snack.get("created_date", "unknown")
                })

        if not snack_analyses:
            return {"message": "No analyzable snack data found"}

        # Analyze trends
        trends = {
            "average_health_score": np.mean([s["nutrition"]["health_score"] for s in snack_analyses]),
            "protein_trend": self._analyze_nutrient_trend(snack_analyses, "protein_g"),
            "fiber_trend": self._analyze_nutrient_trend(snack_analyses, "fiber_g"),
            "sugar_trend": self._analyze_nutrient_trend(snack_analyses, "sugars_g"),
            "favorite_ingredients": self._find_frequent_ingredients(user_snacks),
            "nutritional_gaps": self._identify_nutritional_gaps(snack_analyses),
            "improvement_suggestions": self._generate_trend_based_suggestions(snack_analyses)
        }

        # Generate AI insights if available
        if self.openai_available:
            try:
                insights_prompt = self._create_trends_analysis_prompt(trends, snack_analyses)
                ai_insights = await self._call_openai_api(insights_prompt, max_tokens=300)
                trends["ai_insights"] = ai_insights
            except Exception as e:
                logger.error(f"AI trends analysis failed: {str(e)}")
                trends["ai_insights"] = self._fallback_trends_insights(trends)
        else:
            trends["ai_insights"] = self._fallback_trends_insights(trends)

        return trends

    def _analyze_nutrient_trend(self, snack_analyses: List[Dict[str, Any]], nutrient: str) -> Dict[str, Any]:
        """Analyze trend for a specific nutrient"""

        values = [s["nutrition"]["nutrition_per_100g"].get(nutrient, 0) for s in snack_analyses]

        if len(values) < 2:
            return {"trend": "insufficient_data", "average": np.mean(values) if values else 0}

        # Simple trend analysis
        first_half = values[:len(values) // 2]
        second_half = values[len(values) // 2:]

        first_avg = np.mean(first_half)
        second_avg = np.mean(second_half)

        if second_avg > first_avg * 1.1:
            trend = "increasing"
        elif second_avg < first_avg * 0.9:
            trend = "decreasing"
        else:
            trend = "stable"

        return {
            "trend": trend,
            "average": np.mean(values),
            "min": min(values),
            "max": max(values),
            "change_percent": ((second_avg - first_avg) / max(first_avg, 0.1)) * 100
        }

    def _find_frequent_ingredients(self, user_snacks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Find most frequently used ingredients"""

        ingredient_counts = {}

        for snack in user_snacks:
            for ingredient in snack.get("ingredients", []):
                name = ingredient["name"]
                ingredient_counts[name] = ingredient_counts.get(name, 0) + 1

        # Sort by frequency
        sorted_ingredients = sorted(ingredient_counts.items(), key=lambda x: x[1], reverse=True)

        return [
            {
                "name": name,
                "frequency": count,
                "percentage": (count / len(user_snacks)) * 100
            }
            for name, count in sorted_ingredients[:10]
        ]

    def _identify_nutritional_gaps(self, snack_analyses: List[Dict[str, Any]]) -> List[str]:
        """Identify common nutritional gaps across user's snacks"""

        gaps = []
        avg_nutrition = {}

        # Calculate average nutrition across all snacks
        nutrients = ["protein_g", "fiber_g", "iron_mg", "calcium_mg", "potassium_mg"]

        for nutrient in nutrients:
            values = [s["nutrition"]["nutrition_per_100g"].get(nutrient, 0) for s in snack_analyses]
            avg_nutrition[nutrient] = np.mean(values)

        # Identify gaps based on nutritional targets
        if avg_nutrition["protein_g"] < 10:
            gaps.append("protein")
        if avg_nutrition["fiber_g"] < 5:
            gaps.append("fiber")
        if avg_nutrition["iron_mg"] < 2:
            gaps.append("iron")
        if avg_nutrition["calcium_mg"] < 50:
            gaps.append("calcium")
        if avg_nutrition["potassium_mg"] < 300:
            gaps.append("potassium")

        return gaps

    def _generate_trend_based_suggestions(self, snack_analyses: List[Dict[str, Any]]) -> List[str]:
        """Generate suggestions based on snacking trends"""

        suggestions = []
        avg_score = np.mean([s["nutrition"]["health_score"] for s in snack_analyses])

        if avg_score < 60:
            suggestions.append("Focus on increasing overall nutritional quality of snacks")

        # Check for consistent low protein
        protein_values = [s["nutrition"]["nutrition_per_100g"]["protein_g"] for s in snack_analyses]
        if np.mean(protein_values) < 8:
            suggestions.append("Consider adding more protein-rich ingredients like nuts or protein powder")

        # Check for high sugar trend
        sugar_values = [s["nutrition"]["nutrition_per_100g"]["sugars_g"] for s in snack_analyses]
        if np.mean(sugar_values) > 25:
            suggestions.append("Try reducing sugar content by using natural sweeteners or less sweet fruits")

        # Check for low variety
        all_ingredients = set()
        for snack in snack_analyses:
            for ingredient in snack["nutrition"]["ingredient_breakdown"]:
                all_ingredients.add(ingredient["name"])

        if len(all_ingredients) < 10:
            suggestions.append("Experiment with new ingredients to increase nutritional variety")

        return suggestions[:4]  # Limit to 4 suggestions

    def _create_trends_analysis_prompt(self, trends: Dict[str, Any],
                                       snack_analyses: List[Dict[str, Any]]) -> str:
        """Create prompt for AI trends analysis"""

        prompt = f"""
               Analyze this user's snacking patterns and provide personalized insights:

               Summary:
               - Average health score: {trends['average_health_score']:.1f}/100
               - Number of snacks analyzed: {len(snack_analyses)}
               - Protein trend: {trends['protein_trend']['trend']}
               - Fiber trend: {trends['fiber_trend']['trend']}
               - Sugar trend: {trends['sugar_trend']['trend']}

               Frequent ingredients: {', '.join([ing['name'] for ing in trends['favorite_ingredients'][:5]])}
               Nutritional gaps: {', '.join(trends['nutritional_gaps'])}

               Provide encouraging, personalized insights about their snacking habits and 2-3 specific, 
               actionable recommendations for improvement. Keep the tone positive and motivating.
               """

        return prompt

    def _fallback_trends_insights(self, trends: Dict[str, Any]) -> str:
        """Generate trends insights without AI"""

        avg_score = trends["average_health_score"]
        gaps = trends["nutritional_gaps"]

        if avg_score >= 75:
            insight = "You're doing great with nutritious snack choices! "
        elif avg_score >= 60:
            insight = "Your snacks have good nutritional value with room for improvement. "
        else:
            insight = "There's exciting potential to boost your snack nutrition! "

        if gaps:
            insight += f"Consider focusing on adding more {', '.join(gaps)} to your snacks. "

        insight += "Keep experimenting with new healthy ingredients to maintain variety and nutrition."

        return insight