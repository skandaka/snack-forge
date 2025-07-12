import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import os
import logging
from typing import Dict, List, Any, Optional
import json

logger = logging.getLogger(__name__)


class HealthScorer:
    def __init__(self):
        self.model: Optional[RandomForestRegressor] = None
        self.scaler: Optional[StandardScaler] = None
        self.feature_names: List[str] = [
            'calories_per_100g',
            'protein_g',
            'total_fat_g',
            'saturated_fat_g',
            'carbohydrates_g',
            'sugars_g',
            'fiber_g',
            'sodium_mg',
            'potassium_mg',
            'vitamin_c_mg',
            'calcium_mg',
            'iron_mg',
            'glycemic_index',
            'antioxidant_score',
            'processing_level',  # 1=whole food, 5=highly processed
            'artificial_additives',  # count
            'preservatives',  # count
            'allergen_count',
            'organic_score',  # 0-1
            'sustainability_score'  # 0-1
        ]
        self.model_path = "data/models/health_scorer.joblib"
        self.scaler_path = "data/models/health_scaler.joblib"

    async def load_model(self):
        """Load the trained model or create a new one if not exists"""
        try:
            if os.path.exists(self.model_path) and os.path.exists(self.scaler_path):
                self.model = joblib.load(self.model_path)
                self.scaler = joblib.load(self.scaler_path)
                logger.info("Loaded existing health scoring model")
            else:
                await self._create_and_train_model()
                logger.info("Created and trained new health scoring model")
        except Exception as e:
            logger.error(f"Error loading/creating model: {str(e)}")
            await self._create_and_train_model()

    async def _create_and_train_model(self):
        """Create and train a new health scoring model"""
        # Generate synthetic training data based on nutritional science
        training_data = self._generate_synthetic_data(5000)

        X = training_data[self.feature_names]
        y = training_data['health_score']

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        # Scale features
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        # Train model
        self.model = RandomForestRegressor(
            n_estimators=200,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )

        self.model.fit(X_train_scaled, y_train)

        # Evaluate model
        y_pred = self.model.predict(X_test_scaled)
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)

        logger.info(f"Model training completed - MSE: {mse:.2f}, R²: {r2:.3f}")

        # Save model
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        joblib.dump(self.model, self.model_path)
        joblib.dump(self.scaler, self.scaler_path)

    def _generate_synthetic_data(self, n_samples: int) -> pd.DataFrame:
        """Generate synthetic nutritional data with realistic health scores"""
        np.random.seed(42)

        data = []

        for _ in range(n_samples):
            # Generate base nutritional values
            calories = np.random.uniform(50, 600)
            protein = np.random.uniform(0, 30)
            total_fat = np.random.uniform(0, 40)
            saturated_fat = min(total_fat * 0.6, np.random.uniform(0, 15))
            carbs = np.random.uniform(0, 80)
            sugars = min(carbs * 0.8, np.random.uniform(0, 50))
            fiber = min(carbs * 0.3, np.random.uniform(0, 15))

            # Micronutrients
            sodium = np.random.uniform(0, 2000)
            potassium = np.random.uniform(50, 1000)
            vitamin_c = np.random.uniform(0, 100)
            calcium = np.random.uniform(10, 300)
            iron = np.random.uniform(0, 20)

            # Food quality metrics
            glycemic_index = np.random.uniform(15, 85)
            antioxidant_score = np.random.uniform(0, 100)
            processing_level = np.random.randint(1, 6)
            artificial_additives = np.random.randint(0, 10)
            preservatives = np.random.randint(0, 5)
            allergen_count = np.random.randint(0, 8)
            organic_score = np.random.uniform(0, 1)
            sustainability_score = np.random.uniform(0, 1)

            # Calculate health score based on nutritional science principles
            health_score = self._calculate_health_score(
                calories, protein, total_fat, saturated_fat, carbs, sugars, fiber,
                sodium, potassium, vitamin_c, calcium, iron, glycemic_index,
                antioxidant_score, processing_level, artificial_additives,
                preservatives, allergen_count, organic_score, sustainability_score
            )

            data.append({
                'calories_per_100g': calories,
                'protein_g': protein,
                'total_fat_g': total_fat,
                'saturated_fat_g': saturated_fat,
                'carbohydrates_g': carbs,
                'sugars_g': sugars,
                'fiber_g': fiber,
                'sodium_mg': sodium,
                'potassium_mg': potassium,
                'vitamin_c_mg': vitamin_c,
                'calcium_mg': calcium,
                'iron_mg': iron,
                'glycemic_index': glycemic_index,
                'antioxidant_score': antioxidant_score,
                'processing_level': processing_level,
                'artificial_additives': artificial_additives,
                'preservatives': preservatives,
                'allergen_count': allergen_count,
                'organic_score': organic_score,
                'sustainability_score': sustainability_score,
                'health_score': health_score
            })

        return pd.DataFrame(data)

    def _calculate_health_score(self, calories, protein, total_fat, saturated_fat,
                                carbs, sugars, fiber, sodium, potassium, vitamin_c,
                                calcium, iron, glycemic_index, antioxidant_score,
                                processing_level, artificial_additives, preservatives,
                                allergen_count, organic_score, sustainability_score) -> float:
        """Calculate health score based on nutritional science"""
        score = 50  # Base score

        # Protein bonus (higher is better)
        if protein > 20:
            score += 15
        elif protein > 10:
            score += 10
        elif protein > 5:
            score += 5

        # Fiber bonus (higher is better)
        if fiber > 10:
            score += 15
        elif fiber > 5:
            score += 10
        elif fiber > 2:
            score += 5

        # Sugar penalty (lower is better)
        if sugars > 30:
            score -= 20
        elif sugars > 15:
            score -= 10
        elif sugars > 8:
            score -= 5

        # Saturated fat penalty
        if saturated_fat > 10:
            score -= 15
        elif saturated_fat > 5:
            score -= 8

        # Sodium penalty
        if sodium > 1000:
            score -= 15
        elif sodium > 500:
            score -= 8
        elif sodium > 200:
            score -= 3

        # Micronutrient bonuses
        score += min(vitamin_c / 20, 5)  # Max 5 points
        score += min(potassium / 200, 5)  # Max 5 points
        score += min(iron / 5, 3)  # Max 3 points

        # Antioxidant bonus
        score += antioxidant_score / 10  # Max 10 points

        # Processing penalty
        score -= (processing_level - 1) * 3  # -0 to -12 points

        # Additives penalty
        score -= artificial_additives * 1.5
        score -= preservatives * 2

        # Allergen consideration (mild penalty)
        score -= allergen_count * 0.5

        # Organic and sustainability bonuses
        score += organic_score * 5
        score += sustainability_score * 3

        # Glycemic index consideration
        if glycemic_index < 35:
            score += 5
        elif glycemic_index > 70:
            score -= 8

        # Ensure score is within 0-100 range
        return max(0, min(100, score + np.random.normal(0, 3)))  # Add some noise

    def predict_health_score(self, nutrition_data: Dict[str, float]) -> Dict[str, Any]:
        """Predict health score for given nutrition data"""
        if not self.model or not self.scaler:
            raise ValueError("Model not loaded. Call load_model() first.")

        # Prepare feature vector
        features = []
        for feature_name in self.feature_names:
            if feature_name in nutrition_data:
                features.append(nutrition_data[feature_name])
            else:
                # Use default values for missing features
                defaults = {
                    'glycemic_index': 50,
                    'antioxidant_score': 20,
                    'processing_level': 3,
                    'artificial_additives': 0,
                    'preservatives': 0,
                    'allergen_count': 0,
                    'organic_score': 0.5,
                    'sustainability_score': 0.5
                }
                features.append(defaults.get(feature_name, 0))

        # Scale features and predict
        features_scaled = self.scaler.transform([features])
        score = self.model.predict(features_scaled)[0]

        # Get feature importance for explanation
        feature_importance = dict(zip(
            self.feature_names,
            self.model.feature_importances_
        ))

        # Generate explanation
        explanation = self._generate_explanation(nutrition_data, score)

        return {
            'health_score': max(0, min(100, score)),
            'confidence': self._calculate_confidence(features_scaled),
            'explanation': explanation,
            'feature_importance': feature_importance
        }

    def _calculate_confidence(self, features_scaled: np.ndarray) -> float:
        """Calculate prediction confidence based on model variance"""
        # Use individual tree predictions to estimate variance
        tree_predictions = [tree.predict(features_scaled)[0] for tree in self.model.estimators_]
        variance = np.var(tree_predictions)
        # Convert variance to confidence (0-1 scale)
        confidence = max(0, min(1, 1 - (variance / 100)))
        return confidence

    def _generate_explanation(self, nutrition_data: Dict[str, float], score: float) -> str:
        """Generate human-readable explanation of the health score"""
        explanations = []

        # Analyze key nutritional factors
        protein = nutrition_data.get('protein_g', 0)
        sugars = nutrition_data.get('sugars_g', 0)
        fiber = nutrition_data.get('fiber_g', 0)
        sodium = nutrition_data.get('sodium_mg', 0)
        saturated_fat = nutrition_data.get('saturated_fat_g', 0)

        if protein > 15:
            explanations.append("High protein content boosts the score")
        elif protein < 3:
            explanations.append("Low protein content reduces the score")

        if sugars > 20:
            explanations.append("High sugar content significantly reduces the score")
        elif sugars < 5:
            explanations.append("Low sugar content improves the score")

        if fiber > 8:
            explanations.append("High fiber content significantly boosts the score")
        elif fiber < 2:
            explanations.append("Low fiber content reduces the score")

        if sodium > 800:
            explanations.append("High sodium content reduces the score")
        elif sodium < 100:
            explanations.append("Low sodium content improves the score")

        if saturated_fat > 8:
            explanations.append("High saturated fat content reduces the score")

        # Overall assessment
        if score >= 80:
            overall = "This snack is nutritionally excellent"
        elif score >= 65:
            overall = "This snack is nutritionally good"
        elif score >= 50:
            overall = "This snack is nutritionally moderate"
        elif score >= 35:
            overall = "This snack could be more nutritious"
        else:
            overall = "This snack has poor nutritional value"

        if explanations:
            return f"{overall}. {'. '.join(explanations)}."
        else:
            return overall + "."