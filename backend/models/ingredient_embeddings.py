import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import json
import os
import logging
from typing import Dict, List, Tuple, Optional, Any
import asyncio
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)


class IngredientEmbeddings:
    def __init__(self):
        self.model: Optional[SentenceTransformer] = None
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
            if (os.path.exists(self.embeddings_path) and
                    os.path.exists(self.index_path) and
                    os.path.exists(self.data_path)):

                await self._load_existing_embeddings()
                logger.info("Loaded existing ingredient embeddings")
            else:
                await self._create_embeddings()
                logger.info("Created new ingredient embeddings")
        except Exception as e:
            logger.error(f"Error loading embeddings: {str(e)}")
            await self._create_embeddings()

    async def _load_existing_embeddings(self):
        """Load existing embeddings from disk"""
        # Load embeddings
        self.embeddings = np.load(self.embeddings_path)

        # Load index
        with open(self.index_path, 'r') as f:
            self.ingredient_index = json.load(f)

        self.ingredients = list(self.ingredient_index.keys())

        # Load ingredient data
        with open(self.data_path, 'r') as f:
            self.ingredient_data = json.load(f)

        # Load model
        self.model = SentenceTransformer('all-MiniLM-L6-v2')

    async def _create_embeddings(self):
        """Create new embeddings for all ingredients"""
        # Generate ingredient database
        self.ingredient_data = self._generate_ingredient_database()

        # Load model
        self.model = SentenceTransformer('all-MiniLM-L6-v2')

        # Create ingredient descriptions for embedding
        ingredient_descriptions = []
        self.ingredients = list(self.ingredient_data.keys())

        for ingredient_name, data in self.ingredient_data.items():
            description = self._create_ingredient_description(ingredient_name, data)
            ingredient_descriptions.append(description)

        # Create embeddings using thread pool for CPU-intensive task
        loop = asyncio.get_event_loop()
        with ThreadPoolExecutor() as executor:
            self.embeddings = await loop.run_in_executor(
                executor, self.model.encode, ingredient_descriptions
            )

        # Create index mapping
        self.ingredient_index = {
            ingredient: i for i, ingredient in enumerate(self.ingredients)
        }

        # Save everything
        await self._save_embeddings()

    def _generate_ingredient_database(self) -> Dict[str, Dict[str, Any]]:
        """Generate comprehensive ingredient database"""
        ingredients = {
            # Nuts and Seeds
            "almonds": {
                "category": "nuts_seeds",
                "nutrition": {
                    "calories_per_100g": 579,
                    "protein_g": 21.15,
                    "total_fat_g": 49.93,
                    "saturated_fat_g": 3.8,
                    "carbohydrates_g": 21.55,
                    "sugars_g": 4.35,
                    "fiber_g": 12.5,
                    "sodium_mg": 1,
                    "potassium_mg": 733,
                    "vitamin_c_mg": 0,
                    "calcium_mg": 269,
                    "iron_mg": 3.71
                },
                "properties": {
                    "glycemic_index": 15,
                    "antioxidant_score": 65,
                    "processing_level": 1,
                    "artificial_additives": 0,
                    "preservatives": 0,
                    "allergen_count": 1,
                    "organic_score": 0.8,
                    "sustainability_score": 0.7
                },
                "allergens": ["tree_nuts"],
                "flavor_profile": ["nutty", "mild", "crunchy"],
                "texture": "crunchy",
                "color": "beige",
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
                    "iron_mg": 2.91
                },
                "properties": {
                    "glycemic_index": 15,
                    "antioxidant_score": 85,
                    "processing_level": 1,
                    "artificial_additives": 0,
                    "preservatives": 0,
                    "allergen_count": 1,
                    "organic_score": 0.8,
                    "sustainability_score": 0.6
                },
                "allergens": ["tree_nuts"],
                "flavor_profile": ["nutty", "rich", "slightly_bitter"],
                "texture": "crunchy",
                "color": "light_brown",
                "description": "High in omega-3 fatty acids and antioxidants"
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
                    "iron_mg": 6.68
                },
                "properties": {
                    "glycemic_index": 25,
                    "antioxidant_score": 45,
                    "processing_level": 1,
                    "artificial_additives": 0,
                    "preservatives": 0,
                    "allergen_count": 1,
                    "organic_score": 0.7,
                    "sustainability_score": 0.5
                },
                "allergens": ["tree_nuts"],
                "flavor_profile": ["nutty", "creamy", "mild"],
                "texture": "creamy",
                "color": "ivory",
                "description": "Creamy texture with good source of minerals"
            },

            # Fruits
            "dates": {
                "category": "fruits",
                "nutrition": {
                    "calories_per_100g": 277,
                    "protein_g": 1.81,
                    "total_fat_g": 0.15,
                    "saturated_fat_g": 0.03,
                    "carbohydrates_g": 74.97,
                    "sugars_g": 66.47,
                    "fiber_g": 6.7,
                    "sodium_mg": 1,
                    "potassium_mg": 696,
                    "vitamin_c_mg": 0,
                    "calcium_mg": 64,
                    "iron_mg": 0.9
                },
                "properties": {
                    "glycemic_index": 55,
                    "antioxidant_score": 70,
                    "processing_level": 1,
                    "artificial_additives": 0,
                    "preservatives": 0,
                    "allergen_count": 0,
                    "organic_score": 0.9,
                    "sustainability_score": 0.8
                },
                "allergens": [],
                "flavor_profile": ["sweet", "caramel", "rich"],
                "texture": "chewy",
                "color": "brown",
                "description": "Natural sweetener rich in potassium and fiber"
            },

            "cranberries_dried": {
                "category": "fruits",
                "nutrition": {
                    "calories_per_100g": 308,
                    "protein_g": 0.17,
                    "total_fat_g": 1.09,
                    "saturated_fat_g": 0.2,
                    "carbohydrates_g": 82.8,
                    "sugars_g": 72.56,
                    "fiber_g": 5.3,
                    "sodium_mg": 2,
                    "potassium_mg": 49,
                    "vitamin_c_mg": 1.1,
                    "calcium_mg": 7,
                    "iron_mg": 0.35
                },
                "properties": {
                    "glycemic_index": 45,
                    "antioxidant_score": 95,
                    "processing_level": 2,
                    "artificial_additives": 0,
                    "preservatives": 1,
                    "allergen_count": 0,
                    "organic_score": 0.6,
                    "sustainability_score": 0.7
                },
                "allergens": [],
                "flavor_profile": ["tart", "sweet", "fruity"],
                "texture": "chewy",
                "color": "red",
                "description": "High in antioxidants, particularly beneficial for urinary health"
            },

            # Chocolate
            "dark_chocolate_70": {
                "category": "chocolate",
                "nutrition": {
                    "calories_per_100g": 546,
                    "protein_g": 7.87,
                    "total_fat_g": 31.28,
                    "saturated_fat_g": 18.52,
                    "carbohydrates_g": 45.9,
                    "sugars_g": 24,
                    "fiber_g": 10.9,
                    "sodium_mg": 24,
                    "potassium_mg": 715,
                    "vitamin_c_mg": 0,
                    "calcium_mg": 70,
                    "iron_mg": 11.9
                },
                "properties": {
                    "glycemic_index": 25,
                    "antioxidant_score": 90,
                    "processing_level": 3,
                    "artificial_additives": 0,
                    "preservatives": 0,
                    "allergen_count": 2,
                    "organic_score": 0.7,
                    "sustainability_score": 0.4
                },
                "allergens": ["milk", "soy"],
                "flavor_profile": ["bitter", "rich", "intense"],
                "texture": "smooth",
                "color": "dark_brown",
                "description": "Rich in flavonoids and antioxidants"
            },

            # Grains and Cereals
            "oats": {
                "category": "grains",
                "nutrition": {
                    "calories_per_100g": 389,
                    "protein_g": 16.89,
                    "total_fat_g": 6.9,
                    "saturated_fat_g": 1.22,
                    "carbohydrates_g": 66.27,
                    "sugars_g": 0.99,
                    "fiber_g": 10.6,
                    "sodium_mg": 2,
                    "potassium_mg": 429,
                    "vitamin_c_mg": 0,
                    "calcium_mg": 54,
                    "iron_mg": 4.72
                },
                "properties": {
                    "glycemic_index": 40,
                    "antioxidant_score": 55,
                    "processing_level": 2,
                    "artificial_additives": 0,
                    "preservatives": 0,
                    "allergen_count": 1,
                    "organic_score": 0.8,
                    "sustainability_score": 0.9
                },
                "allergens": ["gluten"],
                "flavor_profile": ["nutty", "mild", "earthy"],
                "texture": "chewy",
                "color": "cream",
                "description": "High in beta-glucan fiber, supports heart health"
            },

            "quinoa": {
                "category": "grains",
                "nutrition": {
                    "calories_per_100g": 368,
                    "protein_g": 14.12,
                    "total_fat_g": 6.07,
                    "saturated_fat_g": 0.71,
                    "carbohydrates_g": 64.16,
                    "sugars_g": 4.57,
                    "fiber_g": 7,
                    "sodium_mg": 5,
                    "potassium_mg": 563,
                    "vitamin_c_mg": 0,
                    "calcium_mg": 47,
                    "iron_mg": 4.57
                },
                "properties": {
                    "glycemic_index": 35,
                    "antioxidant_score": 70,
                    "processing_level": 1,
                    "artificial_additives": 0,
                    "preservatives": 0,
                    "allergen_count": 0,
                    "organic_score": 0.9,
                    "sustainability_score": 0.8
                },
                "allergens": [],
                "flavor_profile": ["nutty", "mild", "slightly_bitter"],
                "texture": "fluffy",
                "color": "cream",
                "description": "Complete protein source, gluten-free superfood"
            },

            # Protein Sources
            "protein_powder_whey": {
                "category": "protein",
                "nutrition": {
                    "calories_per_100g": 413,
                    "protein_g": 82,
                    "total_fat_g": 2.5,
                    "saturated_fat_g": 1.5,
                    "carbohydrates_g": 8,
                    "sugars_g": 6,
                    "fiber_g": 0,
                    "sodium_mg": 380,
                    "potassium_mg": 200,
                    "vitamin_c_mg": 0,
                    "calcium_mg": 600,
                    "iron_mg": 2
                },
                "properties": {
                    "glycemic_index": 30,
                    "antioxidant_score": 20,
                    "processing_level": 4,
                    "artificial_additives": 2,
                    "preservatives": 1,
                    "allergen_count": 1,
                    "organic_score": 0.3,
                    "sustainability_score": 0.3
                },
                "allergens": ["milk"],
                "flavor_profile": ["creamy", "mild", "vanilla"],
                "texture": "powdery",
                "color": "white",
                "description": "High-quality complete protein for muscle building"
            },

            "protein_powder_plant": {
                "category": "protein",
                "nutrition": {
                    "calories_per_100g": 380,
                    "protein_g": 75,
                    "total_fat_g": 8,
                    "saturated_fat_g": 2,
                    "carbohydrates_g": 12,
                    "sugars_g": 3,
                    "fiber_g": 8,
                    "sodium_mg": 200,
                    "potassium_mg": 400,
                    "vitamin_c_mg": 0,
                    "calcium_mg": 150,
                    "iron_mg": 8
                },
                "properties": {
                    "glycemic_index": 25,
                    "antioxidant_score": 60,
                    "processing_level": 4,
                    "artificial_additives": 1,
                    "preservatives": 1,
                    "allergen_count": 0,
                    "organic_score": 0.7,
                    "sustainability_score": 0.8
                },
                "allergens": [],
                "flavor_profile": ["earthy", "nutty", "slightly_sweet"],
                "texture": "powdery",
                "color": "beige",
                "description": "Plant-based protein blend with high fiber content"
            },

            # Seeds
            "chia_seeds": {
                "category": "nuts_seeds",
                "nutrition": {
                    "calories_per_100g": 486,
                    "protein_g": 16.54,
                    "total_fat_g": 30.74,
                    "saturated_fat_g": 3.33,
                    "carbohydrates_g": 42.12,
                    "sugars_g": 0,
                    "fiber_g": 34.4,
                    "sodium_mg": 16,
                    "potassium_mg": 407,
                    "vitamin_c_mg": 1.6,
                    "calcium_mg": 631,
                    "iron_mg": 7.72
                },
                "properties": {
                    "glycemic_index": 30,
                    "antioxidant_score": 80,
                    "processing_level": 1,
                    "artificial_additives": 0,
                    "preservatives": 0,
                    "allergen_count": 0,
                    "organic_score": 0.9,
                    "sustainability_score": 0.9
                },
                "allergens": [],
                "flavor_profile": ["neutral", "nutty", "mild"],
                "texture": "crunchy",
                "color": "black",
                "description": "Omega-3 rich superfood with exceptional fiber content"
            },

            "flax_seeds": {
                "category": "nuts_seeds",
                "nutrition": {
                    "calories_per_100g": 534,
                    "protein_g": 18.29,
                    "total_fat_g": 42.16,
                    "saturated_fat_g": 3.66,
                    "carbohydrates_g": 28.88,
                    "sugars_g": 1.55,
                    "fiber_g": 27.3,
                    "sodium_mg": 30,
                    "potassium_mg": 813,
                    "vitamin_c_mg": 0.6,
                    "calcium_mg": 255,
                    "iron_mg": 5.73
                },
                "properties": {
                    "glycemic_index": 35,
                    "antioxidant_score": 85,
                    "processing_level": 1,
                    "artificial_additives": 0,
                    "preservatives": 0,
                    "allergen_count": 0,
                    "organic_score": 0.9,
                    "sustainability_score": 0.9
                },
                "allergens": [],
                "flavor_profile": ["nutty", "earthy", "mild"],
                "texture": "crunchy",
                "color": "brown",
                "description": "Rich in lignans and alpha-linolenic acid"
            },

            # Sweeteners
            "honey": {
                "category": "sweeteners",
                "nutrition": {
                    "calories_per_100g": 304,
                    "protein_g": 0.3,
                    "total_fat_g": 0,
                    "saturated_fat_g": 0,
                    "carbohydrates_g": 82.4,
                    "sugars_g": 82.12,
                    "fiber_g": 0.2,
                    "sodium_mg": 4,
                    "potassium_mg": 52,
                    "vitamin_c_mg": 0.5,
                    "calcium_mg": 6,
                    "iron_mg": 0.42
                },
                "properties": {
                    "glycemic_index": 55,
                    "antioxidant_score": 60,
                    "processing_level": 1,
                    "artificial_additives": 0,
                    "preservatives": 0,
                    "allergen_count": 0,
                    "organic_score": 0.8,
                    "sustainability_score": 0.7
                },
                "allergens": [],
                "flavor_profile": ["sweet", "floral", "complex"],
                "texture": "sticky",
                "color": "golden",
                "description": "Natural sweetener with enzymes and antioxidants"
            },

            "maple_syrup": {
                "category": "sweeteners",
                "nutrition": {
                    "calories_per_100g": 260,
                    "protein_g": 0.04,
                    "total_fat_g": 0.06,
                    "saturated_fat_g": 0.01,
                    "carbohydrates_g": 67.04,
                    "sugars_g": 60.46,
                    "fiber_g": 0,
                    "sodium_mg": 12,
                    "potassium_mg": 212,
                    "vitamin_c_mg": 0,
                    "calcium_mg": 102,
                    "iron_mg": 0.11
                },
                "properties": {
                    "glycemic_index": 54,
                    "antioxidant_score": 70,
                    "processing_level": 2,
                    "artificial_additives": 0,
                    "preservatives": 0,
                    "allergen_count": 0,
                    "organic_score": 0.8,
                    "sustainability_score": 0.8
                },
                "allergens": [],
                "flavor_profile": ["sweet", "caramel", "woody"],
                "texture": "syrupy",
                "color": "amber",
                "description": "Natural tree sap with minerals and antioxidants"
            },

            # Coconut Products
            "coconut_flakes": {
                "category": "coconut",
                "nutrition": {
                    "calories_per_100g": 660,
                    "protein_g": 6.88,
                    "total_fat_g": 64.53,
                    "saturated_fat_g": 57.21,
                    "carbohydrates_g": 23.65,
                    "sugars_g": 7.35,
                    "fiber_g": 16.3,
                    "sodium_mg": 20,
                    "potassium_mg": 543,
                    "vitamin_c_mg": 3.3,
                    "calcium_mg": 14,
                    "iron_mg": 2.43
                },
                "properties": {
                    "glycemic_index": 35,
                    "antioxidant_score": 50,
                    "processing_level": 2,
                    "artificial_additives": 0,
                    "preservatives": 1,
                    "allergen_count": 0,
                    "organic_score": 0.7,
                    "sustainability_score": 0.6
                },
                "allergens": [],
                "flavor_profile": ["tropical", "sweet", "nutty"],
                "texture": "flaky",
                "color": "white",
                "description": "Medium-chain fatty acids for quick energy"
            },

            # Berries
            "blueberries_dried": {
                "category": "fruits",
                "nutrition": {
                    "calories_per_100g": 317,
                    "protein_g": 1.39,
                    "total_fat_g": 1.28,
                    "saturated_fat_g": 0.23,
                    "carbohydrates_g": 84.21,
                    "sugars_g": 70.35,
                    "fiber_g": 8.8,
                    "sodium_mg": 3,
                    "potassium_mg": 70,
                    "vitamin_c_mg": 3.6,
                    "calcium_mg": 18,
                    "iron_mg": 0.7
                },
                "properties": {
                    "glycemic_index": 40,
                    "antioxidant_score": 100,
                    "processing_level": 2,
                    "artificial_additives": 0,
                    "preservatives": 1,
                    "allergen_count": 0,
                    "organic_score": 0.8,
                    "sustainability_score": 0.8
                },
                "allergens": [],
                "flavor_profile": ["sweet", "tart", "fruity"],
                "texture": "chewy",
                "color": "blue",
                "description": "Highest antioxidant content among common fruits"
            },

            # Spices and Flavors
            "cinnamon": {
                "category": "spices",
                "nutrition": {
                    "calories_per_100g": 247,
                    "protein_g": 3.99,
                    "total_fat_g": 1.24,
                    "saturated_fat_g": 0.35,
                    "carbohydrates_g": 80.59,
                    "sugars_g": 2.17,
                    "fiber_g": 53.1,
                    "sodium_mg": 10,
                    "potassium_mg": 431,
                    "vitamin_c_mg": 3.8,
                    "calcium_mg": 1002,
                    "iron_mg": 8.32
                },
                "properties": {
                    "glycemic_index": 5,
                    "antioxidant_score": 95,
                    "processing_level": 1,
                    "artificial_additives": 0,
                    "preservatives": 0,
                    "allergen_count": 0,
                    "organic_score": 0.9,
                    "sustainability_score": 0.7
                },
                "allergens": [],
                "flavor_profile": ["warm", "sweet", "spicy"],
                "texture": "powdery",
                "color": "brown",
                "description": "Blood sugar regulating properties and high antioxidants"
            },

            "vanilla_extract": {
                "category": "flavorings",
                "nutrition": {
                    "calories_per_100g": 288,
                    "protein_g": 0.06,
                    "total_fat_g": 0.06,
                    "saturated_fat_g": 0.01,
                    "carbohydrates_g": 12.65,
                    "sugars_g": 12.65,
                    "fiber_g": 0,
                    "sodium_mg": 9,
                    "potassium_mg": 148,
                    "vitamin_c_mg": 0,
                    "calcium_mg": 11,
                    "iron_mg": 0.12
                },
                "properties": {
                    "glycemic_index": 5,
                    "antioxidant_score": 40,
                    "processing_level": 3,
                    "artificial_additives": 0,
                    "preservatives": 0,
                    "allergen_count": 0,
                    "organic_score": 0.6,
                    "sustainability_score": 0.5
                },
                "allergens": [],
                "flavor_profile": ["sweet", "floral", "complex"],
                "texture": "liquid",
                "color": "brown",
                "description": "Natural flavoring with subtle complexity"
            }
        }

        return ingredients

    def _create_ingredient_description(self, name: str, data: Dict[str, Any]) -> str:
        """Create a detailed description for embedding"""
        desc_parts = [
            f"{name} is a {data['category']} ingredient",
            f"with {data['flavor_profile']} flavor",
            f"and {data['texture']} texture",
            data['description']
        ]

        # Add nutritional highlights
        nutrition = data['nutrition']
        if nutrition['protein_g'] > 15:
            desc_parts.append("high in protein")
        if nutrition['fiber_g'] > 10:
            desc_parts.append("excellent source of fiber")
        if data['properties']['antioxidant_score'] > 70:
            desc_parts.append("rich in antioxidants")
        if nutrition['saturated_fat_g'] < 2:
            desc_parts.append("low in saturated fat")

        # Add allergen info
        if data['allergens']:
            desc_parts.append(f"contains allergens: {', '.join(data['allergens'])}")
        else:
            desc_parts.append("allergen-free")

        return " ".join(desc_parts)

    async def _save_embeddings(self):
        """Save embeddings and metadata to disk"""
        os.makedirs(os.path.dirname(self.embeddings_path), exist_ok=True)

        # Save embeddings
        np.save(self.embeddings_path, self.embeddings)

        # Save index
        with open(self.index_path, 'w') as f:
            json.dump(self.ingredient_index, f)

        # Save ingredient data
        with open(self.data_path, 'w') as f:
            json.dump(self.ingredient_data, f, indent=2)

    def find_similar_ingredients(self, ingredient_name: str, top_k: int = 5) -> List[Tuple[str, float]]:
        """Find similar ingredients based on embeddings"""
        if ingredient_name not in self.ingredient_index:
            return []

        ingredient_idx = self.ingredient_index[ingredient_name]
        ingredient_embedding = self.embeddings[ingredient_idx].reshape(1, -1)

        # Calculate similarities
        similarities = cosine_similarity(ingredient_embedding, self.embeddings)[0]

        # Get top k similar (excluding the ingredient itself)
        similar_indices = np.argsort(similarities)[::-1][1:top_k + 1]

        results = []
        for idx in similar_indices:
            similar_ingredient = self.ingredients[idx]
            similarity_score = similarities[idx]
            results.append((similar_ingredient, float(similarity_score)))

        return results

    def suggest_substitutions(self, ingredient_name: str, dietary_restrictions: List[str] = None) -> List[
        Dict[str, Any]]:
        """Suggest ingredient substitutions based on dietary needs"""
        if dietary_restrictions is None:
            dietary_restrictions = []

        similar_ingredients = self.find_similar_ingredients(ingredient_name, top_k=10)

        suggestions = []
        for similar_name, similarity in similar_ingredients:
            ingredient_data = self.ingredient_data[similar_name]

            # Check dietary restrictions
            skip = False
            for restriction in dietary_restrictions:
                if restriction == "vegan" and any(
                        allergen in ["milk", "eggs"] for allergen in ingredient_data["allergens"]):
                    skip = True
                elif restriction == "gluten_free" and "gluten" in ingredient_data["allergens"]:
                    skip = True
                elif restriction == "nut_free" and any("nut" in allergen for allergen in ingredient_data["allergens"]):
                    skip = True
                elif restriction == "low_sugar" and ingredient_data["nutrition"]["sugars_g"] > 20:
                    skip = True

            if not skip:
                suggestions.append({
                    "name": similar_name,
                    "similarity": similarity,
                    "reason": self._generate_substitution_reason(ingredient_name, similar_name),
                    "nutrition_comparison": self._compare_nutrition(ingredient_name, similar_name)
                })

        return suggestions[:5]  # Return top 5 valid suggestions

    def _generate_substitution_reason(self, original: str, substitute: str) -> str:
        """Generate explanation for substitution"""
        orig_data = self.ingredient_data[original]
        sub_data = self.ingredient_data[substitute]

        reasons = []

        # Category similarity
        if orig_data["category"] == sub_data["category"]:
            reasons.append(f"same category ({orig_data['category']})")

        # Flavor similarity
        common_flavors = set(orig_data["flavor_profile"]) & set(sub_data["flavor_profile"])
        if common_flavors:
            reasons.append(f"similar {', '.join(common_flavors)} flavor")

        # Texture similarity
        if orig_data["texture"] == sub_data["texture"]:
            reasons.append(f"similar {orig_data['texture']} texture")

        # Nutritional benefits
        orig_protein = orig_data["nutrition"]["protein_g"]
        sub_protein = sub_data["nutrition"]["protein_g"]
        if abs(orig_protein - sub_protein) < 5:
            reasons.append("similar protein content")

        if not reasons:
            reasons.append("complementary nutritional profile")

        return ", ".join(reasons)

    def _compare_nutrition(self, ingredient1: str, ingredient2: str) -> Dict[str, str]:
        """Compare nutritional profiles of two ingredients"""
        data1 = self.ingredient_data[ingredient1]["nutrition"]
        data2 = self.ingredient_data[ingredient2]["nutrition"]

        comparison = {}

        key_nutrients = ["calories_per_100g", "protein_g", "fiber_g", "sugars_g"]

        for nutrient in key_nutrients:
            val1 = data1[nutrient]
            val2 = data2[nutrient]

            if abs(val1 - val2) < val1 * 0.1:  # Within 10%
                comparison[nutrient] = "similar"
            elif val2 > val1:
                comparison[nutrient] = "higher"
            else:
                comparison[nutrient] = "lower"

        return comparison

    def get_ingredient_data(self, ingredient_name: str) -> Optional[Dict[str, Any]]:
        """Get complete data for an ingredient"""
        return self.ingredient_data.get(ingredient_name)

    def search_ingredients(self, query: str, top_k: int = 10) -> List[Tuple[str, float]]:
        """Search ingredients using semantic similarity"""
        if not self.model:
            return []

        # Create embedding for search query
        query_embedding = self.model.encode([query])

        # Calculate similarities
        similarities = cosine_similarity(query_embedding, self.embeddings)[0]

        # Get top k matches
        top_indices = np.argsort(similarities)[::-1][:top_k]

        results = []
        for idx in top_indices:
            ingredient_name = self.ingredients[idx]
            similarity_score = similarities[idx]
            if similarity_score > 0.3:  # Minimum threshold
                results.append((ingredient_name, float(similarity_score)))

        return results