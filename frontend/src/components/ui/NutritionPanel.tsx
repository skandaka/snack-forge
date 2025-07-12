// src/components/ui/NutritionPanel.tsx
import React, { useState } from 'react';
import {
    Activity,
    Target,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Info,
    BarChart3,
    PieChart,
    Zap
} from 'lucide-react';
import { useSnackStore } from '../../stores/snackStore';
import { NutritionAnalysis, MacroBreakdown } from '../../types/snack';

interface HealthScoreDisplayProps {
    score: number;
    confidence: number;
    explanation: string;
}

const HealthScoreDisplay: React.FC<HealthScoreDisplayProps> = ({
                                                                   score,
                                                                   confidence,
                                                                   explanation
                                                               }) => {
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 bg-green-100 border-green-200';
        if (score >= 60) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
        if (score >= 40) return 'text-orange-600 bg-orange-100 border-orange-200';
        return 'text-red-600 bg-red-100 border-red-200';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Fair';
        return 'Needs Improvement';
    };

    return (
        <div className={`p-4 rounded-lg border-2 ${getScoreColor(score)}`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    <span className="font-semibold">Health Score</span>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold">{Math.round(score)}</div>
                    <div className="text-sm opacity-75">/ 100</div>
                </div>
            </div>

            <div className="mb-2">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{getScoreLabel(score)}</span>
                    <span className="text-xs opacity-75">Confidence: {Math.round(confidence * 100)}%</span>
                </div>
                <div className="w-full bg-white bg-opacity-50 rounded-full h-2">
                    <div
                        className="h-2 rounded-full bg-current transition-all duration-500"
                        style={{ width: `${score}%` }}
                    />
                </div>
            </div>

            <p className="text-sm opacity-90">{explanation}</p>
        </div>
    );
};

interface MacroChartProps {
    macros: MacroBreakdown;
}

const MacroChart: React.FC<MacroChartProps> = ({ macros }) => {
    const data = [
        { name: 'Protein', value: macros.protein_percent, color: '#3B82F6', calories: macros.protein_calories },
        { name: 'Carbs', value: macros.carb_percent, color: '#10B981', calories: macros.carb_calories },
        { name: 'Fat', value: macros.fat_percent, color: '#F59E0B', calories: macros.fat_calories }
    ];

    return (
        <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Macronutrients</h3>
            </div>

            {/* Visual Bars */}
            <div className="space-y-3 mb-4">
                {data.map((macro) => (
                    <div key={macro.name}>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-gray-700">{macro.name}</span>
                            <span className="text-sm text-gray-600">{macro.value.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="h-2 rounded-full transition-all duration-500"
                                style={{
                                    width: `${macro.value}%`,
                                    backgroundColor: macro.color
                                }}
                            />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            {Math.round(macro.calories)} calories
                        </div>
                    </div>
                ))}
            </div>

            {/* Pie Chart Visualization */}
            <div className="flex justify-center">
                <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                        {data.reduce((acc, macro, index) => {
                            const radius = 40;
                            const circumference = 2 * Math.PI * radius;
                            const strokeDasharray = (macro.value / 100) * circumference;
                            const strokeDashoffset = -acc.offset;

                            acc.elements.push(
                                <circle
                                    key={macro.name}
                                    cx="50"
                                    cy="50"
                                    r={radius}
                                    fill="transparent"
                                    stroke={macro.color}
                                    strokeWidth="8"
                                    strokeDasharray={`${strokeDasharray} ${circumference}`}
                                    strokeDashoffset={strokeDashoffset}
                                    className="transition-all duration-500"
                                />
                            );

                            acc.offset += strokeDasharray;
                            return acc;
                        }, { elements: [] as React.ReactNode[], offset: 0 }).elements}
                    </svg>
                </div>
            </div>
        </div>
    );
};

interface NutrientBarProps {
    label: string;
    value: number;
    unit: string;
    target?: number;
    color?: string;
}

const NutrientBar: React.FC<NutrientBarProps> = ({
                                                     label,
                                                     value,
                                                     unit,
                                                     target,
                                                     color = '#3B82F6'
                                                 }) => {
    const percentage = target ? Math.min((value / target) * 100, 100) : 0;
    const isOverTarget = target && value > target;

    return (
        <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                <span className="text-sm text-gray-600">
          {value.toFixed(1)}{unit}
                    {target && <span className="text-gray-400 ml-1">/ {target}{unit}</span>}
        </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                        isOverTarget ? 'bg-red-400' : ''
                    }`}
                    style={{
                        width: `${percentage}%`,
                        backgroundColor: isOverTarget ? undefined : color
                    }}
                />
            </div>
            {target && (
                <div className="text-xs text-gray-500 mt-1">
                    {percentage.toFixed(0)}% of target
                    {isOverTarget && <span className="text-red-500 ml-1">(Over target)</span>}
                </div>
            )}
        </div>
    );
};

export default function NutritionPanel() {
    const { currentSnack, ui } = useSnackStore();
    const [activeTab, setActiveTab] = useState<'overview' | 'detailed' | 'goals'>('overview');

    const nutrition = currentSnack.nutrition;

    if (!nutrition) {
        return (
            <div className="h-full bg-gray-50 flex flex-col">
                <div className="p-4 bg-white border-b">
                    <h2 className="text-xl font-bold text-gray-900">Nutrition Analysis</h2>
                </div>

                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">No ingredients yet</h3>
                        <p className="text-gray-500">Add ingredients to see nutrition analysis</p>
                    </div>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Activity },
        { id: 'detailed', label: 'Detailed', icon: BarChart3 },
        { id: 'goals', label: 'Goals', icon: Target }
    ];

    return (
        <div className="h-full bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="p-4 bg-white border-b">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Nutrition Analysis</h2>

                {/* Tabs */}
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                    activeTab === tab.id
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                                onClick={() => setActiveTab(tab.id as any)}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeTab === 'overview' && (
                    <>
                        {/* Health Score */}
                        <HealthScoreDisplay
                            score={nutrition.health_score}
                            confidence={nutrition.health_confidence}
                            explanation={nutrition.health_explanation}
                        />

                        {/* Macros */}
                        <MacroChart macros={nutrition.macros} />

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-lg border">
                                <div className="flex items-center gap-2 mb-2">
                                    <Zap className="w-5 h-5 text-orange-500" />
                                    <span className="font-semibold text-gray-900">Calories</span>
                                </div>
                                <div className="text-2xl font-bold text-gray-900">
                                    {Math.round(nutrition.nutrition_per_serving.calories_per_100g)}
                                </div>
                                <div className="text-sm text-gray-600">per serving</div>
                            </div>

                            <div className="bg-white p-4 rounded-lg border">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="w-5 h-5 text-green-500" />
                                    <span className="font-semibold text-gray-900">Glycemic Load</span>
                                </div>
                                <div className="text-2xl font-bold text-gray-900">
                                    {nutrition.glycemic_load}
                                </div>
                                <div className="text-sm text-gray-600">
                                    {nutrition.glycemic_load < 10 ? 'Low' : nutrition.glycemic_load < 20 ? 'Medium' : 'High'}
                                </div>
                            </div>
                        </div>

                        {/* Allergens */}
                        {nutrition.allergens.length > 0 && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                                    <span className="font-semibold text-orange-800">Allergen Information</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {nutrition.allergens.map((allergen) => (
                                        <span
                                            key={allergen}
                                            className="px-2 py-1 bg-orange-100 text-orange-800 text-sm rounded border border-orange-200"
                                        >
                      {allergen}
                    </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Highlights */}
                        {nutrition.nutritional_highlights.length > 0 && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span className="font-semibold text-green-800">Nutritional Highlights</span>
                                </div>
                                <ul className="space-y-1">
                                    {nutrition.nutritional_highlights.map((highlight, index) => (
                                        <li key={index} className="text-sm text-green-700 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                            {highlight}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'detailed' && (
                    <>
                        {/* Detailed Nutrients */}
                        <div className="bg-white p-4 rounded-lg border">
                            <h3 className="font-semibold text-gray-900 mb-4">Detailed Nutrition (per 100g)</h3>

                            <div className="space-y-4">
                                <NutrientBar
                                label="Protein"
                                value={nutrition.nutrition_per_100g.protein_g}
                                unit="g"
                                target={15}
                                color="#3B82F6"
                                />

                                <NutrientBar
                                    label="Fiber"
                                    value={nutrition.nutrition_per_100g.fiber_g}
                                    unit="g"
                                    target={8}
                                    color="#10B981"
                                />

                                <NutrientBar
                                    label="Sugar"
                                    value={nutrition.nutrition_per_100g.sugars_g}
                                    unit="g"
                                    target={20}
                                    color="#F59E0B"
                                />
                                <NutrientBar
                                    label="Sodium"
                                    value={nutrition.nutrition_per_100g.sodium_mg}
                                    unit="mg"
                                    target={300}
                                    color="#EF4444"
                                />

                                <NutrientBar
                                    label="Iron"
                                    value={nutrition.nutrition_per_100g.iron_mg}
                                    unit="mg"
                                    target={5}
                                    color="#8B5CF6"
                                />

                                <NutrientBar
                                    label="Calcium"
                                    value={nutrition.nutrition_per_100g.calcium_mg}
                                    unit="mg"
                                    target={100}
                                    color="#06B6D4"
                                />

                                <NutrientBar
                                    label="Potassium"
                                    value={nutrition.nutrition_per_100g.potassium_mg}
                                    unit="mg"
                                    target={400}
                                    color="#84CC16"
                                />
                            </div>
                        </div>

                        {/* Ingredient Breakdown */}
                        <div className="bg-white p-4 rounded-lg border">
                            <h3 className="font-semibold text-gray-900 mb-4">Ingredient Contributions</h3>

                            <div className="space-y-3">
                                {nutrition.ingredient_breakdown.map((ingredient, index) => (
                                    <div key={ingredient.name} className="border rounded-lg p-3">
                                        <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">
                        {ingredient.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                                            <span className="text-sm text-gray-600">{ingredient.amount_g}g</span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                                            <div>
                                                <span className="font-medium">Protein:</span> {ingredient.nutrition.protein_g.toFixed(1)}g
                                            </div>
                                            <div>
                                                <span className="font-medium">Carbs:</span> {ingredient.nutrition.carbohydrates_g.toFixed(1)}g
                                            </div>
                                            <div>
                                                <span className="font-medium">Fat:</span> {ingredient.nutrition.total_fat_g.toFixed(1)}g
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Sustainability Score */}
                        <div className="bg-white p-4 rounded-lg border">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="font-semibold text-gray-900">Sustainability Score</span>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div
                                            className="h-3 rounded-full bg-green-500 transition-all duration-500"
                                            style={{ width: `${nutrition.sustainability_score}%` }}
                                        />
                                    </div>
                                </div>
                                <span className="font-bold text-lg text-gray-900">
                  {Math.round(nutrition.sustainability_score)}/100
                </span>
                            </div>

                            <p className="text-sm text-gray-600 mt-2">
                                Based on ingredient processing levels, organic content, and environmental impact
                            </p>
                        </div>
                    </>
                )}

                {activeTab === 'goals' && (
                    <>
                        {/* Recommendations */}
                        {nutrition.recommendations.length > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Info className="w-5 h-5 text-blue-600" />
                                    <span className="font-semibold text-blue-800">Recommendations</span>
                                </div>
                                <ul className="space-y-2">
                                    {nutrition.recommendations.map((recommendation, index) => (
                                        <li key={index} className="text-sm text-blue-700 flex items-start gap-2">
                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                                            {recommendation}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Health Goals Progress */}
                        <div className="bg-white p-4 rounded-lg border">
                            <h3 className="font-semibold text-gray-900 mb-4">Health Goals Progress</h3>

                            <div className="space-y-4">
                                {/* Protein Goal */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-700">High Protein Snack</span>
                                        <span className="text-sm text-gray-600">
                      {nutrition.nutrition_per_100g.protein_g >= 15 ? 'Achieved ✅' : 'In Progress 🔄'}
                    </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-500 ${
                                                nutrition.nutrition_per_100g.protein_g >= 15 ? 'bg-green-500' : 'bg-blue-500'
                                            }`}
                                            style={{ width: `${Math.min((nutrition.nutrition_per_100g.protein_g / 15) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Target: 15g protein per 100g (Current: {nutrition.nutrition_per_100g.protein_g.toFixed(1)}g)
                                    </p>
                                </div>

                                {/* Low Sugar Goal */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-700">Low Sugar Content</span>
                                        <span className="text-sm text-gray-600">
                      {nutrition.nutrition_per_100g.sugars_g <= 15 ? 'Achieved ✅' : 'Needs Work ⚠️'}
                    </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-500 ${
                                                nutrition.nutrition_per_100g.sugars_g <= 15 ? 'bg-green-500' : 'bg-red-500'
                                            }`}
                                            style={{ width: `${Math.min((nutrition.nutrition_per_100g.sugars_g / 30) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Target: Under 15g sugar per 100g (Current: {nutrition.nutrition_per_100g.sugars_g.toFixed(1)}g)
                                    </p>
                                </div>

                                {/* High Fiber Goal */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-700">High Fiber Content</span>
                                        <span className="text-sm text-gray-600">
                      {nutrition.nutrition_per_100g.fiber_g >= 8 ? 'Achieved ✅' : 'In Progress 🔄'}
                    </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-500 ${
                                                nutrition.nutrition_per_100g.fiber_g >= 8 ? 'bg-green-500' : 'bg-blue-500'
                                            }`}
                                            style={{ width: `${Math.min((nutrition.nutrition_per_100g.fiber_g / 8) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Target: 8g fiber per 100g (Current: {nutrition.nutrition_per_100g.fiber_g.toFixed(1)}g)
                                    </p>
                                </div>

                                {/* Overall Health Score Goal */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-700">Excellent Health Score</span>
                                        <span className="text-sm text-gray-600">
                      {nutrition.health_score >= 80 ? 'Achieved ✅' : 'In Progress 🔄'}
                    </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-500 ${
                                                nutrition.health_score >= 80 ? 'bg-green-500' : 'bg-blue-500'
                                            }`}
                                            style={{ width: `${nutrition.health_score}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Target: 80+ health score (Current: {Math.round(nutrition.health_score)})
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Goal Suggestions */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 mb-3">Suggested Next Steps</h3>

                            <div className="space-y-2">
                                {nutrition.health_score < 80 && (
                                    <div className="text-sm text-gray-700 flex items-start gap-2">
                                        <Target className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                        Focus on boosting your health score by adding more nutrient-dense ingredients
                                    </div>
                                )}

                                {nutrition.nutrition_per_100g.protein_g < 15 && (
                                    <div className="text-sm text-gray-700 flex items-start gap-2">
                                        <Target className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                        Add protein powder, nuts, or seeds to reach the protein target
                                    </div>
                                )}

                                {nutrition.nutrition_per_100g.fiber_g < 8 && (
                                    <div className="text-sm text-gray-700 flex items-start gap-2">
                                        <Target className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                        Include chia seeds, flax seeds, or oats for more fiber
                                    </div>
                                )}

                                {nutrition.nutrition_per_100g.sugars_g > 15 && (
                                    <div className="text-sm text-gray-700 flex items-start gap-2">
                                        <Target className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                        Consider reducing sweeteners or using natural alternatives
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
