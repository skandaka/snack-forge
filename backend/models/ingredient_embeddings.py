# backend/models/ingredient_embeddings.py
import numpy as np
import pandas as pd
import json
import os
import logging
from typing import Dict, List, Tuple, Optional, Any
import asyncio
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)


class IngredientEmbeddings:
    def __init__(self):
        self.model = None
        self.embeddings: Optional[np.ndarray] = None
        self.ingredient_index: Dict[str, int] = {}
        self.ingredients: List[str] = []
        self.ingredient_data: Dict[str, Dict[str, Any]] = {}
        self.embeddings_path = "data/models/ingredient_embeddings.npy"
        self.index_path = "data/models/ingredient_index.json"
        self.data_path = "data/ingredients.json"

    async def load_embeddings(self):
        """Load or create ingredient embeddings"""
        try:
            # First, try to load the ingredient data
            if os.path.exists(self.data_path):
                await self._load_ingredient_data()
            else:
                # Create ingredient data if it doesn't exist
                self.ingredient_data = self._generate_ingredient_database()
                await self._save_ingredient_data()

            # Try to load existing embeddings
            if (os.path.exists(self.embeddings_path) and
                    os.path.exists(self.index_path)):
                await self._load_existing_embeddings()
                logger.info("Loaded existing ingredient embeddings")
            else:
                # Create new embeddings without SentenceTransformer (fallback)
                await self._create_simple_embeddings()
                logger.info("Created simple ingredient embeddings")

        except Exception as e:
            logger.error(f"Error loading embeddings: {str(e)}")
            # Create minimal fallback data
            self.ingredient_data = self._generate_minimal_database()
            await self._create_simple_embeddings()

    async def _load_ingredient_data(self):
        """Load ingredient data from JSON file"""
        try:
            with open(self.data_path, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                if content:
                    self.ingredient_data = json.loads(content)
                else:
                    raise ValueError("Empty ingredient data file")
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"JSON parsing error in ingredient data: {str(e)}")
            # Generate fresh data if parsing fails
            self.ingredient_data = self._generate_ingredient_database()
        except Exception as e:
            logger.error(f"Error loading ingredient data: {str(e)}")
            self.ingredient_data = self._generate_ingredient_database()

    async def _load_existing_embeddings(self):
        """Load existing embeddings from disk"""
        try:
            # Load embeddings
            self.embeddings = np.load(self.embeddings_path)

            # Load index
            with open(self.index_path, 'r', encoding='utf-8') as f:
                self.ingredient_index = json.load(f)

            self.ingredients = list(self.ingredient_index.keys())

            # Try to load sentence transformer model (optional)
            try:
                from sentence_transformers import SentenceTransformer
                self.model = SentenceTransformer('all-MiniLM-L6-v2')
            except ImportError:
                logger.info("SentenceTransformers not available, using simple embeddings")
                self.model = None

        except Exception as e:
            logger.error(f"Error loading existing embeddings: {str(e)}")
            await self._create_simple_embeddings()

    async def _create_simple_embeddings(self):
        """Create simple embeddings without ML models"""
        try:
            self.ingredients = list(self.ingredient_data.keys())

            # Create simple feature-based embeddings
            embeddings_list = []

            for ingredient_name in self.ingredients:
                ingredient = self.ingredient_data[ingredient_name]

                # Create a simple feature vector based on nutrition and properties
                features = []

                # Nutritional features (normalized)
                nutrition = ingredient.get('nutrition', {})
                features.extend([
                    nutrition.get('protein_g', 0) / 100.0,
                    nutrition.get('fiber_g', 0) / 50.0,
                    nutrition.get('sugars_g', 0) / 100.0,
                    nutrition.get('total_fat_g', 0) / 100.0,
                    nutrition.get('calories_per_100g', 0) / 1000.0,
                    nutrition.get('iron_mg', 0) / 20.0,
                    nutrition.get('calcium_mg', 0) / 1000.0,
                    nutrition.get('potassium_mg', 0) / 3000.0
                ])

                # Property features
                properties = ingredient.get('properties', {})
                features.extend([
                    properties.get('glycemic_index', 50) / 100.0,
                    properties.get('antioxidant_score', 0) / 100.0,
                    properties.get('processing_level', 3) / 5.0,
                    properties.get('organic_score', 0.5),
                    properties.get('sustainability_score', 0.5)
                ])

                # Category features (one-hot encoding)
                category = ingredient.get('category', 'other')
                category_features = [0.0] * 10  # 10 categories
                category_map = {
                    'nuts_seeds': 0, 'fruits': 1, 'chocolate': 2, 'grains': 3,
                    'protein': 4, 'sweeteners': 5, 'coconut': 6, 'spices': 7,
                    'flavorings': 8, 'other': 9
                }
                if category in category_map:
                    category_features[category_map[category]] = 1.0
                features.extend(category_features)

                # Flavor profile features
                flavor_profile = ingredient.get('flavor_profile', [])
                flavor_features = [0.0] * 8  # 8 flavor types
                flavor_map = {
                    'sweet': 0, 'nutty': 1, 'fruity': 2, 'bitter': 3,
                    'tart': 4, 'spicy': 5, 'earthy': 6, 'creamy': 7
                }
                for flavor in flavor_profile:
                    if flavor in flavor_map:
                        flavor_features[flavor_map[flavor]] = 1.0
                features.extend(flavor_features)

                # Allergen features
                allergens = ingredient.get('allergens', [])
                allergen_features = [0.0] * 5  # 5 main allergen types
                allergen_map = {
                    'tree_nuts': 0, 'milk': 1, 'soy': 2, 'gluten': 3, 'eggs': 4
                }
                for allergen in allergens:
                    if allergen in allergen_map:
                        allergen_features[allergen_map[allergen]] = 1.0
                features.extend(allergen_features)

                # Ensure consistent feature vector length
                while len(features) < 36:  # Expected total length
                    features.append(0.0)
                features = features[:36]  # Truncate if too long

                embeddings_list.append(features)

            # Convert to numpy array
            self.embeddings = np.array(embeddings_list, dtype=np.float32)

            # Create index mapping
            self.ingredient_index = {
                ingredient: i for i, ingredient in enumerate(self.ingredients)
            }

            # Save embeddings
            await self._save_embeddings()

        except Exception as e:
            logger.error(f"Error creating simple embeddings: {str(e)}")
            # Create minimal fallback
            self._create_minimal_fallback()

    def _create_minimal_fallback(self):
        """Create minimal fallback embeddings"""
        # Just use the basic ingredients
        basic_ingredients = ['almonds', 'oats', 'dates', 'honey', 'chia_seeds']
        self.ingredients = basic_ingredients

        # Create random embeddings as absolute fallback
        self.embeddings = np.random.rand(len(basic_ingredients), 36).astype(np.float32)

        self.ingredient_index = {
            ingredient: i for i, ingredient in enumerate(basic_ingredients)
        }

        # Create minimal ingredient data
        if not self.ingredient_data:
            self.ingredient_data = self._generate_minimal_database()

    def _generate_minimal_database(self) -> Dict[str, Dict[str, Any]]:
        """Generate minimal ingredient database for fallback"""
        return {
            "almonds": {
                "category": "nuts_seeds",
                "nutrition": {
                    "calories_per_100g": 579, "protein_g": 21.15, "total_fat_g": 49.93,
                    "saturated_fat_g": 3.8, "carbohydrates_g": 21.55, "sugars_g": 4.35,
                    "fiber_g": 12.5, "sodium_mg": 1, "potassium_mg": 733,
                    "vitamin_c_mg": 0, "calcium_mg": 269, "iron_mg": 3.71
                },
                "properties": {
                    "glycemic_index": 15, "antioxidant_score": 65, "processing_level": 1,
                    "artificial_additives": 0, "preservatives": 0, "allergen_count": 1,
                    "organic_score": 0.8, "sustainability_score": 0.7
                },
                "allergens": ["tree_nuts"],
                "flavor_profile": ["nutty", "mild", "crunchy"],
                "texture": "crunchy",
                "color": "beige",
                "description": "Rich in healthy fats, protein, and vitamin E"
            },
            "oats": {
                "category": "grains",
                "nutrition": {
                    "calories_per_100g": 389, "protein_g": 16.89, "total_fat_g": 6.9,
                    "saturated_fat_g": 1.22, "carbohydrates_g": 66.27, "sugars_g": 0.99,
                    "fiber_g": 10.6, "sodium_mg": 2, "potassium_mg": 429,
                    "vitamin_c_mg": 0, "calcium_mg": 54, "iron_mg": 4.72
                },
                "properties": {
                    "glycemic_index": 40, "antioxidant_score": 55, "processing_level": 2,
                    "artificial_additives": 0, "preservatives": 0, "allergen_count": 1,
                    "organic_score": 0.8, "sustainability_score": 0.9
                },
                "allergens": ["gluten"],
                "flavor_profile": ["nutty", "mild", "earthy"],
                "texture": "chewy",
                "color": "cream",
                "description": "High in beta-glucan fiber, supports heart health"
            },
            "dates": {
                "category": "fruits",
                "nutrition": {
                    "calories_per_100g": 277, "protein_g": 1.81, "total_fat_g": 0.15,
                    "saturated_fat_g": 0.03, "carbohydrates_g": 74.97, "sugars_g": 66.47,
                    "fiber_g": 6.7, "sodium_mg": 1, "potassium_mg": 696,
                    "vitamin_c_mg": 0, "calcium_mg": 64, "iron_mg": 0.9
                },
                "properties": {
                    "glycemic_index": 55, "antioxidant_score": 70, "processing_level": 1,
                    "artificial_additives": 0, "preservatives": 0, "allergen_count": 0,
                    "organic_score": 0.9, "sustainability_score": 0.8
                },
                "allergens": [],
                "flavor_profile": ["sweet", "caramel", "rich"],
                "texture": "chewy",
                "color": "brown",
                "description": "Natural sweetener rich in potassium and fiber"
            }
        }

    def _generate_ingredient_database(self) -> Dict[str, Dict[str, Any]]:
        """Generate comprehensive ingredient database"""
        return {
            # Nuts and Seeds
            "almonds": {
                "category": "nuts_seeds",
                "nutrition": {
                    "calories_per_100g": 579, "protein_g": 21.15, "total_fat_g": 49.93,
                    "saturated_fat_g": 3.8, "carbohydrates_g": 21.55, "sugars_g": 4.35,
                    "fiber_g": 12.5, "sodium_mg": 1, "potassium_mg": 733,
                    "vitamin_c_mg": 0, "calcium_mg": 269, "iron_mg": 3.71
                },
                "properties": {
                    "glycemic_index": 15, "antioxidant_score": 65, "processing_level": 1,
                    "artificial_additives": 0, "preservatives": 0, "allergen_count": 1,
                    "organic_score": 0.8, "sustainability_score": 0.7
                },
                "allergens": ["tree_nuts"],
                "flavor_profile": ["nutty", "mild", "crunchy"],
                "texture": "crunchy", "color": "beige",
                "description": "Rich in healthy fats, protein, and vitamin E"
            },
            "walnuts": {
                "category": "nuts_seeds",
                "nutrition": {
                    "calories_per_100g": 654,
                    "protein_g": 15.23,
                    "total_fat_g": 65.21,
                    "saturated_fat_g": 6.13,
                    "carbohydrates_g": 13.71,
                    "sugars_g": 2.61,
                    "fiber_g": 6.7,
                    "sodium_mg": 2,
                    "potassium_mg": 441,
                    "vitamin_c_mg": 1.3,
                    "calcium_mg": 98,
                    "iron_mg": 2.91,
                },
                "properties": {
                    "glycemic_index": 15,
                    "antioxidant_score": 85,
                    "processing_level": 1,
                    "organic_score": 0.8,
                    "sustainability_score": 0.6,
                },
                "allergens": ["tree_nuts"],
                "flavor_profile": ["nutty", "earthy", "slightly_bitter"],
                "texture": "crunchy",
                "color": "light_brown",
                "description": "Excellent source of omega-3 fatty acids",
            },
            "cashews": {
                "category": "nuts_seeds",
                "nutrition": {
                    "calories_per_100g": 553,
                    "protein_g": 18.22,
                    "total_fat_g": 43.85,
                    "saturated_fat_g": 7.78,
                    "carbohydrates_g": 30.19,
                    "sugars_g": 5.91,
                    "fiber_g": 3.3,
                    "sodium_mg": 12,
                    "potassium_mg": 660,
                    "vitamin_c_mg": 0.5,
                    "calcium_mg": 37,
                    "iron_mg": 6.68,
                },
                "properties": {
                    "glycemic_index": 25,
                    "antioxidant_score": 50,
                    "processing_level": 1,
                    "organic_score": 0.7,
                    "sustainability_score": 0.5,
                },
                "allergens": ["tree_nuts"],
                "flavor_profile": ["creamy", "nutty", "mildly_sweet"],
                "texture": "creamy",
                "color": "white",
                "description": "Creamy nut with a good source of iron and magnesium",
            },
            # ... (add more ingredients as needed)
        }

        async def _save_ingredient_data(self):
            """Save ingredient data to JSON file"""
            try:
                os.makedirs(os.path.dirname(self.data_path), exist_ok=True)
                with open(self.data_path, "w", encoding="utf-8") as f:
                    json.dump(self.ingredient_data, f, indent=4)
            except Exception as e:
                logger.error(f"Error saving ingredient data: {str(e)}")

        async def _save_embeddings(self):
            """Save embeddings and index to disk"""
            try:
                os.makedirs(os.path.dirname(self.embeddings_path), exist_ok=True)
                np.save(self.embeddings_path, self.embeddings)
                with open(self.index_path, "w", encoding="utf-8") as f:
                    json.dump(self.ingredient_index, f)
            except Exception as e:
                logger.error(f"Error saving embeddings: {str(e)}")

        def get_embedding(self, ingredient_name: str) -> Optional[np.ndarray]:
            """Get embedding for a single ingredient"""
            if self.embeddings is not None and ingredient_name in self.ingredient_index:
                idx = self.ingredient_index[ingredient_name]
                return self.embeddings[idx]
            return None

        def suggest_substitutions(
                self,
                ingredient_name: str,
                dietary_restrictions: List[str] = [],
                top_n: int = 5,
        ) -> List[Dict[str, Any]]:
            """Suggest substitutions based on embedding similarity"""
            if self.embeddings is None:
                return []

            ingredient_embedding = self.get_embedding(ingredient_name)
            if ingredient_embedding is None:
                return []

            # Calculate cosine similarity
            similarities = np.dot(self.embeddings, ingredient_embedding) / (
                    np.linalg.norm(self.embeddings, axis=1)
                    * np.linalg.norm(ingredient_embedding)
            )
            # Get top N similar ingredients
            similar_indices = np.argsort(similarities)[::-1][1: top_n * 2]

            suggestions = []
            for idx in similar_indices:
                if len(suggestions) >= top_n:
                    break

                sub_name = self.ingredients[idx]
                sub_data = self.ingredient_data.get(sub_name, {})

                # Filter based on dietary restrictions
                if dietary_restrictions:
                    allergens = sub_data.get("allergens", [])
                    if any(restriction in allergens for restriction in dietary_restrictions):
                        continue

                suggestions.append(
                    {
                        "name": sub_name,
                        "similarity": similarities[idx],
                        "reason": f"Similar nutritional profile to {ingredient_name}",
                    }
                )
            return suggestions