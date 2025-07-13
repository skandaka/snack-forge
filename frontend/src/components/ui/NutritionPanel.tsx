'use client';

import React, { useState, useMemo } from 'react';
import {
    Activity,
    Target,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Info,
    BarChart3,
    PieChart,
    Zap,
    Heart,
    Shield,
    Sparkles,
    Award,
    Star,
    Leaf,
    Flame,
    Clock,
    ChevronRight,
    ChevronDown,
    Eye,
    Download
} from 'lucide-react';
import { useSnackStore } from '../../stores/snackStore';
import { NutritionAnalysis, MacroBreakdown } from '../../types/snack';
import { motion, AnimatePresence } from 'framer-motion';

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
    const [isExpanded, setIsExpanded] = useState(false);

    const getScoreColor = (score: number) => {
        if (score >= 80) return {
            bg: 'from-green-400 to-emerald-500',
            text: 'text-green-700',
            border: 'border-green-200',
            glow: 'shadow-green-200/50'
        };
        if (score >= 60) return {
            bg: 'from-yellow-400 to-orange-400',
            text: 'text-yellow-700',
            border: 'border-yellow-200',
            glow: 'shadow-yellow-200/50'
        };
        if (score >= 40) return {
            bg: 'from-orange-400 to-red-400',
            text: 'text-orange-700',
            border: 'border-orange-200',
            glow: 'shadow-orange-200/50'
        };
        return {
            bg: 'from-red-400 to-red-500',
            text: 'text-red-700',
            border: 'border-red-200',
            glow: 'shadow-red-200/50'
        };
    };

    const getScoreLabel = (score: number) => {
        if (score >= 80) return { label: 'Excellent', emoji: '🏆' };
        if (score >= 60) return { label: 'Good', emoji: '👍' };
        if (score >= 40) return { label: 'Fair', emoji: '⚖️' };
        return { label: 'Needs Work', emoji: '🔧' };
    };

    const colors = getScoreColor(score);
    const { label, emoji } = getScoreLabel(score);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative overflow-hidden rounded-2xl border-2 ${colors.border} bg-gradient-to-br ${colors.bg} p-6 shadow-xl ${colors.glow}`}
        >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -translate-y-16 translate-x-16" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12" />
            </div>

            <div className="relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">Health Score</h3>
                            <p className="text-white/80 text-sm">AI-powered nutrition analysis</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-black text-white mb-1">
                            {Math.round(score)}
                        </div>
                        <div className="text-white/80 text-sm font-medium">/ 100</div>
                    </div>
                </div>

                {/* Score visualization */}
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">{emoji}</span>
                            <span className="font-bold text-white text-lg">{label}</span>
                        </div>
                        <span className="text-white/80 text-sm">
                            Confidence: {Math.round(confidence * 100)}%
                        </span>
                    </div>

                    {/* Animated progress bar */}
                    <div className="relative">
                        <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${score}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-white/70 to-white/90 rounded-full relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                            </motion.div>
                        </div>

                        {/* Score milestones */}
                        <div className="flex justify-between mt-1 text-xs text-white/60">
                            <span>0</span>
                            <span>40</span>
                            <span>60</span>
                            <span>80</span>
                            <span>100</span>
                        </div>
                    </div>
                </div>

                {/* Expandable explanation */}
                <motion.button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                >
                    <span className="text-white font-medium">View Analysis</span>
                    <motion.div
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronRight className="w-4 h-4 text-white" />
                    </motion.div>
                </motion.button>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 p-3 bg-white/10 rounded-xl"
                        >
                            <p className="text-white/90 text-sm leading-relaxed">{explanation}</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

interface MacroChartProps {
    macros: MacroBreakdown;
}

const MacroChart: React.FC<MacroChartProps> = ({ macros }) => {
    const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

    const data = [
        {
            name: 'Protein',
            value: macros.protein_percent,
            color: '#3B82F6',
            calories: macros.protein_calories,
            emoji: '💪',
            description: 'Builds & repairs muscles'
        },
        {
            name: 'Carbs',
            value: macros.carb_percent,
            color: '#10B981',
            calories: macros.carb_calories,
            emoji: '⚡',
            description: 'Primary energy source'
        },
        {
            name: 'Fat',
            value: macros.fat_percent,
            color: '#F59E0B',
            calories: macros.fat_calories,
            emoji: '🥑',
            description: 'Essential fatty acids'
        }
    ];

    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;
    const segments = data.map(item => {
        const angle = (item.value / total) * 360;
        const segment = {
            ...item,
            startAngle: currentAngle,
            endAngle: currentAngle + angle,
            centerAngle: currentAngle + angle / 2
        };
        currentAngle += angle;
        return segment;
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg"
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-xl">
                    <PieChart className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 text-lg">Macronutrients</h3>
                    <p className="text-gray-600 text-sm">Energy distribution breakdown</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Interactive Bars */}
                <div className="space-y-4">
                    {data.map((macro, index) => (
                        <motion.div
                            key={macro.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onHoverStart={() => setHoveredSegment(macro.name)}
                            onHoverEnd={() => setHoveredSegment(null)}
                            className="group"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{macro.emoji}</span>
                                    <div>
                                        <span className="font-semibold text-gray-900">{macro.name}</span>
                                        <p className="text-xs text-gray-500">{macro.description}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-gray-900">{macro.value.toFixed(1)}%</div>
                                    <div className="text-xs text-gray-500">{Math.round(macro.calories)} cal</div>
                                </div>
                            </div>

                            {/* Animated progress bar */}
                            <div className="relative">
                                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${macro.value}%` }}
                                        transition={{ duration: 1, delay: index * 0.2, ease: "easeOut" }}
                                        className="h-full rounded-full relative group-hover:brightness-110 transition-all duration-200"
                                        style={{ backgroundColor: macro.color }}
                                    >
                                        {/* Shimmer effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-pulse" />
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="flex items-center justify-center">
                    <div className="relative w-48 h-48">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                            {segments.map((segment, index) => {
                                const radius = 80;
                                const innerRadius = 40;
                                const centerX = 100;
                                const centerY = 100;

                                const startAngleRad = (segment.startAngle * Math.PI) / 180;
                                const endAngleRad = (segment.endAngle * Math.PI) / 180;

                                const x1 = centerX + radius * Math.cos(startAngleRad);
                                const y1 = centerY + radius * Math.sin(startAngleRad);
                                const x2 = centerX + radius * Math.cos(endAngleRad);
                                const y2 = centerY + radius * Math.sin(endAngleRad);

                                const x3 = centerX + innerRadius * Math.cos(endAngleRad);
                                const y3 = centerY + innerRadius * Math.sin(endAngleRad);
                                const x4 = centerX + innerRadius * Math.cos(startAngleRad);
                                const y4 = centerY + innerRadius * Math.sin(startAngleRad);

                                const largeArc = segment.value > 50 ? 1 : 0;

                                const pathData = [
                                    `M ${centerX} ${centerY}`,
                                    `L ${x1} ${y1}`,
                                    `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
                                    `L ${x3} ${y3}`,
                                    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}`,
                                    'Z'
                                ].join(' ');

                                const isHovered = hoveredSegment === segment.name;

                                return (
                                    <motion.path
                                        key={segment.name}
                                        d={pathData}
                                        fill={segment.color}
                                        stroke="white"
                                        strokeWidth="2"
                                        initial={{ scale: 0 }}
                                        animate={{
                                            scale: isHovered ? 1.05 : 1,
                                            opacity: hoveredSegment && !isHovered ? 0.6 : 1
                                        }}
                                        transition={{
                                            duration: 0.8,
                                            delay: index * 0.1,
                                            type: "spring",
                                            stiffness: 100
                                        }}
                                        onMouseEnter={() => setHoveredSegment(segment.name)}
                                        onMouseLeave={() => setHoveredSegment(null)}
                                        className="cursor-pointer"
                                        style={{
                                            filter: isHovered ? 'brightness(1.1) drop-shadow(0 4px 8px rgba(0,0,0,0.2))' : 'none'
                                        }}
                                    />
                                );
                            })}
                        </svg>

                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center bg-white rounded-full w-20 h-20 flex flex-col items-center justify-center shadow-lg">
                                <div className="text-lg font-bold text-gray-900">
                                    {Math.round(macros.protein_calories + macros.carb_calories + macros.fat_calories)}
                                </div>
                                <div className="text-xs text-gray-500">calories</div>
                            </div>
                        </div>

                        <AnimatePresence>
                            {hoveredSegment && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full bg-black text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg"
                                >
                                    {hoveredSegment}: {data.find(d => d.name === hoveredSegment)?.value.toFixed(1)}%
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-xl">
                    <div className="text-2xl mb-1">💪</div>
                    <div className="text-xs text-gray-600">Protein</div>
                    <div className="font-bold text-blue-600">{macros.protein_percent.toFixed(0)}%</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-xl">
                    <div className="text-2xl mb-1">⚡</div>
                    <div className="text-xs text-gray-600">Carbs</div>
                    <div className="font-bold text-green-600">{macros.carb_percent.toFixed(0)}%</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-xl">
                    <div className="text-2xl mb-1">🥑</div>
                    <div className="text-xs text-gray-600">Fats</div>
                    <div className="font-bold text-yellow-600">{macros.fat_percent.toFixed(0)}%</div>
                </div>
            </div>
        </motion.div>
    );
};

interface NutrientBarProps {
    label: string;
    value: number;
    unit: string;
    target?: number;
    color?: string;
    icon?: React.ReactNode;
    description?: string;
}

const NutrientBar: React.FC<NutrientBarProps> = ({
                                                     label,
                                                     value,
                                                     unit,
                                                     target,
                                                     color = '#3B82F6',
                                                     icon,
                                                     description
                                                 }) => {
    const [isHovered, setIsHovered] = useState(false);
    const percentage = target ? Math.min((value / target) * 100, 100) : 0;
    const isOverTarget = target && value > target;
    const status = target ? (value >= target ? 'excellent' : value >= target * 0.7 ? 'good' : 'needs-work') : 'neutral';

    const getStatusColor = () => {
        switch (status) {
            case 'excellent': return '#10B981';
            case 'good': return '#F59E0B';
            case 'needs-work': return '#EF4444';
            default: return color;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className="p-4 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-200"
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    {icon && (
                        <div className="p-2 rounded-lg" style={{ backgroundColor: `${getStatusColor()}20` }}>
                            {React.cloneElement(icon as React.ReactElement, {
                                className: "w-5 h-5",
                                style: { color: getStatusColor() }
                            })}
                        </div>
                    )}
                    <div>
                        <span className="font-semibold text-gray-900">{label}</span>
                        {description && (
                            <p className="text-xs text-gray-500">{description}</p>
                        )}
                    </div>
                </div>
                <div className="text-right">
                    <span className="font-bold text-lg text-gray-900">
                        {value.toFixed(1)}{unit}
                    </span>
                    {target && (
                        <div className="text-xs text-gray-500">
                            / {target}{unit}
                        </div>
                    )}
                </div>
            </div>

            {target && (
                <>
                    <div className="relative mb-2">
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className={`h-full rounded-full relative ${
                                    isOverTarget ? 'bg-red-400' : ''
                                }`}
                                style={{
                                    backgroundColor: isOverTarget ? undefined : getStatusColor()
                                }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                            </motion.div>
                        </div>

                        <div
                            className="absolute top-0 w-0.5 h-full bg-gray-400"
                            style={{ left: '100%' }}
                        />
                    </div>

                    <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">
                            {percentage.toFixed(0)}% of target
                        </span>
                        <div className="flex items-center gap-1">
                            {status === 'excellent' && <CheckCircle className="w-3 h-3 text-green-500" />}
                            {status === 'good' && <Target className="w-3 h-3 text-yellow-500" />}
                            {status === 'needs-work' && <AlertTriangle className="w-3 h-3 text-red-500" />}
                            <span
                                className={`font-medium ${
                                    status === 'excellent' ? 'text-green-600' :
                                        status === 'good' ? 'text-yellow-600' :
                                            status === 'needs-work' ? 'text-red-600' : 'text-gray-600'
                                }`}
                            >
                                {status === 'excellent' ? 'Excellent' :
                                    status === 'good' ? 'Good' :
                                        status === 'needs-work' ? 'Low' : 'OK'}
                            </span>
                        </div>
                    </div>

                    {isOverTarget && (
                        <div className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                            ⚠️ Above recommended target
                        </div>
                    )}
                </>
            )}

            {isHovered && description && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600"
                >
                    {description}
                </motion.div>
            )}
        </motion.div>
    );
};

const StatsCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    value: string | number;
    subtitle: string;
    color: string;
    trend?: 'up' | 'down' | 'neutral';
}> = ({ icon, title, value, subtitle, color, trend }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-all duration-200"
    >
        <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}20` }}>
                {React.cloneElement(icon as React.ReactElement, {
                    className: "w-6 h-6",
                    style: { color }
                })}
            </div>
            {trend && (
                <div className={`flex items-center gap-1 text-xs font-medium ${
                    trend === 'up' ? 'text-green-600' :
                        trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                    <TrendingUp className={`w-3 h-3 ${trend === 'down' ? 'rotate-180' : ''}`} />
                    {trend === 'up' ? 'Good' : trend === 'down' ? 'Low' : 'OK'}
                </div>
            )}
        </div>

        <div className="text-3xl font-black text-gray-900 mb-1">
            {value}
        </div>
        <div className="text-sm font-semibold text-gray-700 mb-1">{title}</div>
        <div className="text-xs text-gray-500">{subtitle}</div>
    </motion.div>
);

export default function NutritionPanel() {
    const { currentSnack, ui } = useSnackStore();
    const [activeTab, setActiveTab] = useState<'overview' | 'detailed' | 'goals'>('overview');

    const nutrition = currentSnack.nutrition;

    if (!nutrition) {
        return (
            <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
                <div className="p-6 bg-white border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-xl">
                            <Activity className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Nutrition Analysis</h2>
                            <p className="text-gray-600">Real-time health insights</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-center p-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-8xl mb-6"
                        >
                            🎯
                        </motion.div>
                        <h3 className="text-2xl font-bold text-gray-700 mb-3">Ready for Analysis</h3>
                        <p className="text-gray-500 max-w-md">
                            Add some delicious ingredients to see detailed nutrition insights, health scores, and personalized recommendations.
                        </p>
                        <div className="mt-6 flex items-center justify-center gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                                <span>Real-time Analysis</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                <span>AI Recommendations</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Activity, description: 'Quick health insights' },
        { id: 'detailed', label: 'Detailed', icon: BarChart3, description: 'Complete breakdown' },
        { id: 'goals', label: 'Goals', icon: Target, description: 'Track progress' }
    ];

    return (
        <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
            <div className="bg-white border-b border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-100 rounded-xl">
                        <Activity className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Nutrition Analysis</h2>
                        <p className="text-gray-600">AI-powered health insights for your snack</p>
                    </div>
                </div>

                <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <motion.button
                                key={tab.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex-1 flex flex-col items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                                    activeTab === tab.id
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                                }`}
                                onClick={() => setActiveTab(tab.id as any)}
                            >
                                <Icon className="w-5 h-5" />
                                <div className="text-center">
                                    <div className="font-semibold">{tab.label}</div>
                                    <div className="text-xs opacity-75">{tab.description}</div>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            <HealthScoreDisplay
                                score={nutrition.health_score}
                                confidence={nutrition.health_confidence}
                                explanation={nutrition.health_explanation}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <StatsCard
                                    icon={<Zap />}
                                    title="Calories"
                                    value={Math.round(nutrition.nutrition_per_serving.calories_per_100g)}
                                    subtitle="per serving"
                                    color="#F59E0B"
                                    trend="neutral"
                                />
                                <StatsCard
                                    icon={<TrendingUp />}
                                    title="Glycemic Load"
                                    value={nutrition.glycemic_load}
                                    subtitle={nutrition.glycemic_load < 10 ? 'Low impact' : nutrition.glycemic_load < 20 ? 'Medium impact' : 'High impact'}
                                    color="#10B981"
                                    trend={nutrition.glycemic_load < 10 ? 'up' : nutrition.glycemic_load < 20 ? 'neutral' : 'down'}
                                />
                            </div>

                            <MacroChart macros={nutrition.macros} />

                            {nutrition.allergens.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-400 rounded-xl p-4"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <AlertTriangle className="w-6 h-6 text-orange-500" />
                                        <span className="font-bold text-orange-800 text-lg">Allergen Information</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {nutrition.allergens.map((allergen) => (
                                            <motion.span
                                                key={allergen}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full border border-orange-200 font-medium"
                                            >
                                                ⚠️ {allergen}
                                            </motion.span>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {nutrition.nutritional_highlights.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400 rounded-xl p-4"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <Sparkles className="w-6 h-6 text-green-500" />
                                        <span className="font-bold text-green-800 text-lg">Nutritional Highlights</span>
                                    </div>
                                    <div className="grid gap-2">
                                        {nutrition.nutritional_highlights.map((highlight, index) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="flex items-center gap-3 p-2 bg-green-100/50 rounded-lg"
                                            >
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                <span className="text-green-700 font-medium">{highlight}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'detailed' && (
                        <motion.div
                            key="detailed"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-purple-100 rounded-xl">
                                        <BarChart3 className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">Detailed Nutrition</h3>
                                        <p className="text-gray-600 text-sm">Per 100g breakdown with targets</p>
                                    </div>
                                </div>

                                <div className="grid gap-4">
                                    <NutrientBar
                                        icon={<Zap />}
                                        label="Protein"
                                        value={nutrition.nutrition_per_100g.protein_g}
                                        unit="g"
                                        target={15}
                                        color="#3B82F6"
                                        description="Essential for muscle building and repair"
                                    />

                                    <NutrientBar
                                        icon={<Leaf />}
                                        label="Fiber"
                                        value={nutrition.nutrition_per_100g.fiber_g}
                                        unit="g"
                                        target={8}
                                        color="#10B981"
                                        description="Supports digestive health and satiety"
                                    />

                                    <NutrientBar
                                        icon={<Heart />}
                                        label="Sugar"
                                        value={nutrition.nutrition_per_100g.sugars_g}
                                        unit="g"
                                        target={20}
                                        color="#F59E0B"
                                        description="Natural and added sugars combined"
                                    />

                                    <NutrientBar
                                        icon={<Shield />}
                                        label="Sodium"
                                        value={nutrition.nutrition_per_100g.sodium_mg}
                                        unit="mg"
                                        target={300}
                                        color="#EF4444"
                                        description="Important for fluid balance"
                                    />

                                    <NutrientBar
                                        icon={<Star />}
                                        label="Iron"
                                        value={nutrition.nutrition_per_100g.iron_mg}
                                        unit="mg"
                                        target={5}
                                        color="#8B5CF6"
                                        description="Essential for oxygen transport"
                                    />

                                    <NutrientBar
                                        icon={<Award />}
                                        label="Calcium"
                                        value={nutrition.nutrition_per_100g.calcium_mg}
                                        unit="mg"
                                        target={100}
                                        color="#06B6D4"
                                        description="Builds and maintains strong bones"
                                    />

                                    <NutrientBar
                                        icon={<Flame />}
                                        label="Potassium"
                                        value={nutrition.nutrition_per_100g.potassium_mg}
                                        unit="mg"
                                        target={400}
                                        color="#84CC16"
                                        description="Supports heart and muscle function"
                                    />
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-indigo-100 rounded-xl">
                                        <PieChart className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">Ingredient Breakdown</h3>
                                        <p className="text-gray-600 text-sm">Individual contributions to nutrition</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {nutrition.ingredient_breakdown.map((ingredient, index) => (
                                        <motion.div
                                            key={ingredient.name}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-all duration-200"
                                        >
                                            <div className="flex justify-between items-center mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                                                        <span className="text-xl">
                                                            {ingredient.name.includes('nut') ? '🥜' :
                                                                ingredient.name.includes('berr') ? '🫐' :
                                                                    ingredient.name.includes('choc') ? '🍫' :
                                                                        ingredient.name.includes('oat') ? '🌾' :
                                                                            ingredient.name.includes('protein') ? '💪' :
                                                                                ingredient.name.includes('honey') ? '🍯' : '🥗'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900">
                                                            {ingredient.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                        </h4>
                                                        <p className="text-sm text-gray-500">{ingredient.amount_g}g • {ingredient.category}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-bold text-gray-900">
                                                        {Math.round(ingredient.nutrition.calories_per_100g * ingredient.amount_g / 100)} cal
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-3 text-sm">
                                                <div className="text-center p-2 bg-blue-50 rounded-lg">
                                                    <div className="font-semibold text-blue-700">
                                                        {ingredient.nutrition.protein_g.toFixed(1)}g
                                                    </div>
                                                    <div className="text-blue-600 text-xs">Protein</div>
                                                </div>
                                                <div className="text-center p-2 bg-green-50 rounded-lg">
                                                    <div className="font-semibold text-green-700">
                                                        {ingredient.nutrition.carbohydrates_g.toFixed(1)}g
                                                    </div>
                                                    <div className="text-green-600 text-xs">Carbs</div>
                                                </div>
                                                <div className="text-center p-2 bg-yellow-50 rounded-lg">
                                                    <div className="font-semibold text-yellow-700">
                                                        {ingredient.nutrition.total_fat_g.toFixed(1)}g
                                                    </div>
                                                    <div className="text-yellow-600 text-xs">Fat</div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl border border-green-200 p-6 shadow-lg">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-green-200 rounded-xl">
                                        <Leaf className="w-6 h-6 text-green-700" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-green-900 text-lg">Sustainability Score</h3>
                                        <p className="text-green-700 text-sm">Environmental impact assessment</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 mb-4">
                                    <div className="flex-1">
                                        <div className="w-full bg-green-200 rounded-full h-4 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${nutrition.sustainability_score}%` }}
                                                transition={{ duration: 1.5, ease: "easeOut" }}
                                                className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full relative"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                                            </motion.div>
                                        </div>
                                    </div>
                                    <span className="font-bold text-2xl text-green-800">
                                        {Math.round(nutrition.sustainability_score)}/100
                                    </span>
                                </div>

                                <p className="text-green-700 text-sm">
                                    Based on ingredient processing levels, organic content, and environmental impact
                                </p>

                                <div className="mt-4 grid grid-cols-3 gap-3">
                                    <div className="text-center p-3 bg-green-100 rounded-lg">
                                        <div className="text-2xl mb-1">🌱</div>
                                        <div className="text-xs text-green-700">Organic</div>
                                        <div className="font-bold text-green-800">
                                            {Math.round(nutrition.sustainability_score * 0.8)}/100
                                        </div>
                                    </div>
                                    <div className="text-center p-3 bg-green-100 rounded-lg">
                                        <div className="text-2xl mb-1">♻️</div>
                                        <div className="text-xs text-green-700">Processing</div>
                                        <div className="font-bold text-green-800">Low</div>
                                    </div>
                                    <div className="text-center p-3 bg-green-100 rounded-lg">
                                        <div className="text-2xl mb-1">🌍</div>
                                        <div className="text-xs text-green-700">Impact</div>
                                        <div className="font-bold text-green-800">Minimal</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'goals' && (
                        <motion.div
                            key="goals"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            {nutrition.recommendations.length > 0 && (
                                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-400 rounded-xl p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Info className="w-6 h-6 text-blue-600" />
                                        <span className="font-bold text-blue-800 text-lg">AI Recommendations</span>
                                    </div>
                                    <div className="space-y-3">
                                        {nutrition.recommendations.map((recommendation, index) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="flex items-start gap-3 p-3 bg-blue-100/50 rounded-lg"
                                            >
                                                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <span className="text-blue-700 font-bold text-sm">{index + 1}</span>
                                                </div>
                                                <span className="text-blue-700 font-medium">{recommendation}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-purple-100 rounded-xl">
                                        <Target className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">Health Goals Progress</h3>
                                        <p className="text-gray-600 text-sm">Track your nutrition targets</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="text-2xl">💪</div>
                                                <div>
                                                    <span className="font-semibold text-gray-900">High Protein Snack</span>
                                                    <p className="text-sm text-gray-600">Target: 15g+ protein per 100g</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {nutrition.nutrition_per_100g.protein_g >= 15 ? (
                                                    <>
                                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                                        <span className="text-green-600 font-semibold">Achieved!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Clock className="w-5 h-5 text-yellow-500" />
                                                        <span className="text-yellow-600 font-semibold">In Progress</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min((nutrition.nutrition_per_100g.protein_g / 15) * 100, 100)}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                                className={`h-full rounded-full ${
                                                    nutrition.nutrition_per_100g.protein_g >= 15 ? 'bg-green-500' : 'bg-blue-500'
                                                }`}
                                            />
                                        </div>
                                        <p className="text-sm text-gray-600 mt-2">
                                            Current: {nutrition.nutrition_per_100g.protein_g.toFixed(1)}g protein per 100g
                                        </p>
                                    </div>

                                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="text-2xl">🍯</div>
                                                <div>
                                                    <span className="font-semibold text-gray-900">Low Sugar Content</span>
                                                    <p className="text-sm text-gray-600">Target: Under 15g sugar per 100g</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {nutrition.nutrition_per_100g.sugars_g <= 15 ? (
                                                    <>
                                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                                        <span className="text-green-600 font-semibold">Achieved!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <AlertTriangle className="w-5 h-5 text-red-500" />
                                                        <span className="text-red-600 font-semibold">Needs Work</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min((nutrition.nutrition_per_100g.sugars_g / 30) * 100, 100)}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                                className={`h-full rounded-full ${
                                                    nutrition.nutrition_per_100g.sugars_g <= 15 ? 'bg-green-500' : 'bg-red-500'
                                                }`}
                                            />
                                        </div>
                                        <p className="text-sm text-gray-600 mt-2">
                                            Current: {nutrition.nutrition_per_100g.sugars_g.toFixed(1)}g sugar per 100g
                                        </p>
                                    </div>

                                    <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl">
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="text-2xl">🌾</div>
                                                <div>
                                                    <span className="font-semibold text-gray-900">High Fiber Content</span>
                                                    <p className="text-sm text-gray-600">Target: 8g+ fiber per 100g</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {nutrition.nutrition_per_100g.fiber_g >= 8 ? (
                                                    <>
                                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                                        <span className="text-green-600 font-semibold">Achieved!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Clock className="w-5 h-5 text-yellow-500" />
                                                        <span className="text-yellow-600 font-semibold">In Progress</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min((nutrition.nutrition_per_100g.fiber_g / 8) * 100, 100)}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                                className={`h-full rounded-full ${
                                                    nutrition.nutrition_per_100g.fiber_g >= 8 ? 'bg-green-500' : 'bg-yellow-500'
                                                }`}
                                            />
                                        </div>
                                        <p className="text-sm text-gray-600 mt-2">
                                            Current: {nutrition.nutrition_per_100g.fiber_g.toFixed(1)}g fiber per 100g
                                        </p>
                                    </div>

                                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="text-2xl">🏆</div>
                                                <div>
                                                    <span className="font-semibold text-gray-900">Excellent Health Score</span>
                                                    <p className="text-sm text-gray-600">Target: 80+ health score</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {nutrition.health_score >= 80 ? (
                                                    <>
                                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                                        <span className="text-green-600 font-semibold">Achieved!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Clock className="w-5 h-5 text-yellow-500" />
                                                        <span className="text-yellow-600 font-semibold">In Progress</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${nutrition.health_score}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                                className={`h-full rounded-full ${
                                                    nutrition.health_score >= 80 ? 'bg-green-500' : 'bg-purple-500'
                                                }`}
                                            />
                                        </div>
                                        <p className="text-sm text-gray-600 mt-2">
                                            Current: {Math.round(nutrition.health_score)} health score
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-indigo-50 to-purple-100 rounded-2xl border border-indigo-200 p-6 shadow-lg">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-indigo-200 rounded-xl">
                                        <Award className="w-6 h-6 text-indigo-700" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-indigo-900 text-lg">Next Steps</h3>
                                        <p className="text-indigo-700 text-sm">Recommended improvements</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {nutrition.health_score < 80 && (
                                        <div className="flex items-start gap-3 p-3 bg-indigo-100/50 rounded-lg">
                                            <Target className="w-5 h-5 text-indigo-600 mt-0.5" />
                                            <span className="text-indigo-700 font-medium">
                                                Focus on boosting your health score by adding more nutrient-dense ingredients
                                            </span>
                                        </div>
                                    )}

                                    {nutrition.nutrition_per_100g.protein_g < 15 && (
                                        <div className="flex items-start gap-3 p-3 bg-indigo-100/50 rounded-lg">
                                            <Target className="w-5 h-5 text-indigo-600 mt-0.5" />
                                            <span className="text-indigo-700 font-medium">
                                                Add protein powder, nuts, or seeds to reach the protein target
                                            </span>
                                        </div>
                                    )}

                                    {nutrition.nutrition_per_100g.fiber_g < 8 && (
                                        <div className="flex items-start gap-3 p-3 bg-indigo-100/50 rounded-lg">
                                            <Target className="w-5 h-5 text-indigo-600 mt-0.5" />
                                            <span className="text-indigo-700 font-medium">
                                                Include chia seeds, flax seeds, or oats for more fiber
                                            </span>
                                        </div>
                                    )}

                                    {nutrition.nutrition_per_100g.sugars_g > 15 && (
                                        <div className="flex items-start gap-3 p-3 bg-indigo-100/50 rounded-lg">
                                            <Target className="w-5 h-5 text-indigo-600 mt-0.5" />
                                            <span className="text-indigo-700 font-medium">
                                                Consider reducing sweeteners or using natural alternatives
                                            </span>
                                        </div>
                                    )}

                                    {nutrition.health_score >= 80 &&
                                        nutrition.nutrition_per_100g.protein_g >= 15 &&
                                        nutrition.nutrition_per_100g.fiber_g >= 8 &&
                                        nutrition.nutrition_per_100g.sugars_g <= 15 && (
                                            <div className="flex items-start gap-3 p-3 bg-green-100/50 rounded-lg">
                                                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                                                <span className="text-green-700 font-medium">
                                                🎉 Congratulations! You've achieved all health goals. Your snack is nutritionally excellent!
                                            </span>
                                            </div>
                                        )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}