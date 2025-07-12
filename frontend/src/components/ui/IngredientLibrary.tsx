// src/components/ui/IngredientLibrary.tsx
import React from 'react';

const ingredientData = {
    Nuts: ['Almonds', 'Walnuts', 'Peanuts'],
    Fruits: ['Strawberries', 'Blueberries', 'Bananas'],
    Chocolate: ['Dark Chips', 'Milk Chunks', 'White Drizzle'],
    JunkFood: ['Potato Chips', 'Candy Pieces', 'Soda Syrup', 'Gummy Bears'],
};

export default function IngredientLibrary() {
    return (
        <div className="p-4">
            {Object.entries(ingredientData).map(([category, ingredients]) => (
                <div key={category} className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">{category}</h3>
                    <div className="flex flex-wrap gap-2">
                        {ingredients.map((ingredient) => (
                            <button
                                key={ingredient}
                                className="btn-secondary cursor-move"
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('text/plain', ingredient);
                                }}
                            >
                                {ingredient}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
