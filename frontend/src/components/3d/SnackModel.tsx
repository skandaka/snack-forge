// src/components/3d/SnackModel.tsx
'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Sphere, Cylinder, RoundedBox, Torus, Float, Html } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { Ingredient } from '../../types/snack';

interface SnackModelProps {
    ingredients: Ingredient[];
    snackType: string;
}

// Enhanced ingredient visual data
const INGREDIENT_VISUALS = {
    almonds: {
        shape: 'oval',
        color: '#D2B48C',
        roughness: 0.6,
        metalness: 0.1,
        scale: [0.12, 0.08, 0.06],
        emissive: '#2a1810',
        emissiveIntensity: 0.05
    },
    walnuts: {
        shape: 'brain',
        color: '#8B4513',
        roughness: 0.8,
        metalness: 0.05,
        scale: [0.15, 0.12, 0.15],
        emissive: '#1a0f0a',
        emissiveIntensity: 0.03
    },
    cashews: {
        shape: 'curved',
        color: '#F5DEB3',
        roughness: 0.4,
        metalness: 0.1,
        scale: [0.18, 0.08, 0.12],
        emissive: '#2a2418',
        emissiveIntensity: 0.04
    },
    dates: {
        shape: 'oval',
        color: '#8B4513',
        roughness: 0.7,
        metalness: 0.0,
        scale: [0.25, 0.15, 0.12],
        emissive: '#1a0f0a',
        emissiveIntensity: 0.02
    },
    cranberries_dried: {
        shape: 'sphere',
        color: '#DC143C',
        roughness: 0.5,
        metalness: 0.0,
        scale: [0.08, 0.08, 0.08],
        emissive: '#2a050a',
        emissiveIntensity: 0.06
    },
    blueberries_dried: {
        shape: 'sphere',
        color: '#4169E1',
        roughness: 0.6,
        metalness: 0.0,
        scale: [0.06, 0.06, 0.06],
        emissive: '#0a0f2a',
        emissiveIntensity: 0.05
    },
    dark_chocolate_70: {
        shape: 'chunk',
        color: '#4A2C2A',
        roughness: 0.2,
        metalness: 0.3,
        scale: [0.15, 0.08, 0.15],
        emissive: '#1a0a0a',
        emissiveIntensity: 0.08
    },
    oats: {
        shape: 'flake',
        color: '#F5DEB3',
        roughness: 0.8,
        metalness: 0.0,
        scale: [0.12, 0.03, 0.08],
        emissive: '#2a2418',
        emissiveIntensity: 0.03
    },
    quinoa: {
        shape: 'tiny_sphere',
        color: '#DDBF94',
        roughness: 0.7,
        metalness: 0.0,
        scale: [0.03, 0.03, 0.03],
        emissive: '#1a1510',
        emissiveIntensity: 0.02
    },
    protein_powder_plant: {
        shape: 'powder',
        color: '#E6E6FA',
        roughness: 0.9,
        metalness: 0.0,
        scale: [0.02, 0.02, 0.02],
        emissive: '#1a1a2a',
        emissiveIntensity: 0.04
    },
    chia_seeds: {
        shape: 'tiny_oval',
        color: '#2F2F2F',
        roughness: 0.8,
        metalness: 0.0,
        scale: [0.02, 0.01, 0.015],
        emissive: '#0a0a0a',
        emissiveIntensity: 0.01
    },
    honey: {
        shape: 'liquid',
        color: '#FFD700',
        roughness: 0.0,
        metalness: 0.0,
        scale: [0.3, 0.1, 0.3],
        emissive: '#2a2200',
        emissiveIntensity: 0.1,
        transparent: true,
        opacity: 0.8
    },
    coconut_flakes: {
        shape: 'flake',
        color: '#FFFFFF',
        roughness: 0.6,
        metalness: 0.0,
        scale: [0.08, 0.02, 0.06],
        emissive: '#1a1a1a',
        emissiveIntensity: 0.02
    }
};

// Individual ingredient component
const Ingredient3D: React.FC<{
    ingredient: Ingredient;
    position: [number, number, number];
    index: number;
}> = ({ ingredient, position, index }) => {
    const meshRef = useRef<THREE.Group>(null);

    const visualData = INGREDIENT_VISUALS[ingredient.name as keyof typeof INGREDIENT_VISUALS] || {
        shape: 'sphere',
        color: '#CD853F',
        roughness: 0.5,
        metalness: 0.1,
        scale: [0.1, 0.1, 0.1],
        emissive: '#1a1510',
        emissiveIntensity: 0.03
    };

    // Size based on amount
    const sizeMultiplier = Math.max(0.5, Math.min(2, ingredient.amount_g / 25));
    const finalScale = visualData.scale.map(s => s * sizeMultiplier) as [number, number, number];

    // Animation
    useFrame((state) => {
        if (meshRef.current) {
            const time = state.clock.elapsedTime;
            const floatOffset = index * 0.5;

            // Gentle floating
            meshRef.current.position.y = position[1] + Math.sin(time * 2 + floatOffset) * 0.02;

            // Subtle rotation
            meshRef.current.rotation.y += 0.003;
        }
    });

    const getGeometry = () => {
        switch (visualData.shape) {
            case 'oval':
                return <Sphere args={[...finalScale, 8, 6]} />;
            case 'brain':
                return (
                    <group>
                        <Sphere args={[finalScale[0], 6, 4]} />
                        <Sphere args={[finalScale[0] * 0.8, 4, 3]} position={[finalScale[0] * 0.3, 0, 0]} />
                        <Sphere args={[finalScale[0] * 0.8, 4, 3]} position={[-finalScale[0] * 0.3, 0, 0]} />
                    </group>
                );
            case 'curved':
                return <Torus args={[finalScale[0], finalScale[1], 4, 8]} />;
            case 'chunk':
                return <RoundedBox args={finalScale} radius={0.02} smoothness={4} />;
            case 'flake':
                return <Cylinder args={[finalScale[0], finalScale[0], finalScale[1], 6]} />;
            case 'tiny_sphere':
                return <Sphere args={[...finalScale, 6, 4]} />;
            case 'tiny_oval':
                return <Sphere args={[...finalScale, 4, 3]} />;
            case 'powder':
                return (
                    <group>
                        {Array.from({ length: Math.min(15, Math.max(3, ingredient.amount_g / 8)) }, (_, i) => (
                            <Sphere
                                key={i}
                                position={[
                                    (Math.random() - 0.5) * 0.2,
                                    (Math.random() - 0.5) * 0.1,
                                    (Math.random() - 0.5) * 0.2
                                ]}
                                args={[finalScale[0] / 2, 4, 3]}
                            />
                        ))}
                    </group>
                );
            case 'liquid':
                return (
                    <group>
                        <Cylinder args={[finalScale[0], finalScale[0] * 0.8, finalScale[1], 16]} />
                        <Sphere args={[finalScale[0] * 0.9, 8, 6]} position={[0, finalScale[1] / 2, 0]} />
                    </group>
                );
            default:
                return <Sphere args={[...finalScale, 8, 6]} />;
        }
    };

    const getMaterial = () => {
        const baseProps = {
            color: visualData.color,
            roughness: visualData.roughness,
            metalness: visualData.metalness,
            emissive: visualData.emissive,
            emissiveIntensity: visualData.emissiveIntensity,
            transparent: visualData.transparent || false,
            opacity: visualData.opacity || 1
        };

        if (visualData.shape === 'liquid') {
            return (
                <meshPhysicalMaterial
                    {...baseProps}
                    transmission={0.9}
                    thickness={0.5}
                    roughness={0.0}
                    clearcoat={1}
                    clearcoatRoughness={0}
                />
            );
        } else if (visualData.metalness > 0.2) {
            return (
                <meshPhysicalMaterial
                    {...baseProps}
                    clearcoat={0.8}
                    clearcoatRoughness={0.2}
                />
            );
        } else {
            return <meshStandardMaterial {...baseProps} />;
        }
    };

    return (
        <Float speed={1 + index * 0.1} rotationIntensity={0.1} floatIntensity={0.2}>
            <group ref={meshRef} position={position}>
                <mesh castShadow receiveShadow>
                    {getGeometry()}
                    {getMaterial()}
                </mesh>

                {/* Ingredient label on hover */}
                <Html distanceFactor={8} style={{ pointerEvents: 'none' }}>
                    <div className="opacity-0 hover:opacity-100 transition-opacity bg-[var(--bg-panel)] text-[var(--text-primary)] px-2 py-1 rounded text-xs border border-[var(--border-color)]">
                        {ingredient.name.replace(/_/g, ' ')} - {ingredient.amount_g}g
                    </div>
                </Html>
            </group>
        </Float>
    );
};

// Base snack component
const SnackBase: React.FC<{
    type: string;
    ingredients: Ingredient[];
}> = ({ type, ingredients }) => {
    const groupRef = useRef<THREE.Group>(null);

    // Calculate base color from dominant ingredient
    const dominantColor = useMemo(() => {
        if (ingredients.length === 0) return '#DEB887';

        const dominantIngredient = ingredients.reduce((prev, current) =>
            prev.amount_g > current.amount_g ? prev : current
        );

        const visualData = INGREDIENT_VISUALS[dominantIngredient.name as keyof typeof INGREDIENT_VISUALS];
        return visualData?.color || '#DEB887';
    }, [ingredients]);

    useFrame((state) => {
        if (groupRef.current) {
            // Very subtle rotation
            groupRef.current.rotation.y += 0.001;

            // Breathing animation
            const breathe = Math.sin(state.clock.elapsedTime * 0.5) * 0.02 + 1;
            groupRef.current.scale.setScalar(breathe);
        }
    });

    const getBaseGeometry = () => {
        switch (type) {
            case 'energy-bar':
                return (
                    <group>
                        <RoundedBox args={[2, 0.4, 1]} radius={0.1} smoothness={4}>
                            <meshPhysicalMaterial
                                color={dominantColor}
                                roughness={0.6}
                                clearcoat={0.3}
                                emissive={new THREE.Color(dominantColor).multiplyScalar(0.05)}
                            />
                        </RoundedBox>
                        {/* Surface details */}
                        {Array.from({ length: 3 }, (_, i) => (
                            <Box key={i} args={[1.8, 0.02, 0.02]} position={[0, 0.2 + i * 0.08, 0.4]}>
                                <meshStandardMaterial color="#8B4513" transparent opacity={0.3} />
                            </Box>
                        ))}
                    </group>
                );

            case 'protein-ball':
                return (
                    <group>
                        <Sphere args={[0.8, 16, 12]}>
                            <meshPhysicalMaterial
                                color={dominantColor}
                                roughness={0.7}
                                metalness={0.1}
                                normalScale={[0.5, 0.5]}
                                emissive={new THREE.Color(dominantColor).multiplyScalar(0.03)}
                            />
                        </Sphere>
                        {/* Surface bumps */}
                        {Array.from({ length: 8 }, (_, i) => {
                            const phi = (i / 8) * Math.PI * 2;
                            const theta = Math.PI / 3;
                            const radius = 0.82;
                            return (
                                <Sphere
                                    key={i}
                                    args={[0.03, 4, 3]}
                                    position={[
                                        radius * Math.sin(theta) * Math.cos(phi),
                                        radius * Math.cos(theta),
                                        radius * Math.sin(theta) * Math.sin(phi)
                                    ]}
                                >
                                    <meshStandardMaterial color="#8B4513" />
                                </Sphere>
                            );
                        })}
                    </group>
                );

            case 'granola-cluster':
                return (
                    <group>
                        {Array.from({ length: 6 }, (_, i) => (
                            <Sphere
                                key={i}
                                position={[
                                    (Math.random() - 0.5) * 1.2,
                                    (Math.random() - 0.5) * 0.4,
                                    (Math.random() - 0.5) * 1.2
                                ]}
                                args={[0.12 + Math.random() * 0.08, 8, 6]}
                            >
                                <meshStandardMaterial
                                    color={new THREE.Color(dominantColor).offsetHSL(0, 0, (Math.random() - 0.5) * 0.2)}
                                    roughness={0.8}
                                    emissive={new THREE.Color(dominantColor).multiplyScalar(0.02)}
                                />
                            </Sphere>
                        ))}
                    </group>
                );

            case 'smoothie-bowl':
                return (
                    <group>
                        {/* Bowl */}
                        <Cylinder args={[1, 0.7, 0.5, 16]}>
                            <meshPhysicalMaterial
                                color="#F5F5F5"
                                roughness={0.1}
                                metalness={0.8}
                                clearcoat={1}
                            />
                        </Cylinder>
                        {/* Smoothie content */}
                        <Cylinder args={[0.9, 0.6, 0.4, 16]} position={[0, 0.1, 0]}>
                            <meshPhysicalMaterial
                                color={dominantColor}
                                roughness={0.2}
                                transmission={0.1}
                                thickness={0.5}
                                emissive={new THREE.Color(dominantColor).multiplyScalar(0.05)}
                            />
                        </Cylinder>
                    </group>
                );

            case 'trail-mix':
                return (
                    <group>
                        {/* Scattered base platform */}
                        <Cylinder args={[1.5, 1.5, 0.1, 16]}>
                            <meshStandardMaterial
                                color="#F5DEB3"
                                roughness={0.8}
                                transparent
                                opacity={0.2}
                            />
                        </Cylinder>
                    </group>
                );

            default:
                return (
                    <RoundedBox args={[1.5, 0.4, 1]} radius={0.1} smoothness={4}>
                        <meshStandardMaterial
                            color={dominantColor}
                            roughness={0.6}
                            emissive={new THREE.Color(dominantColor).multiplyScalar(0.03)}
                        />
                    </RoundedBox>
                );
        }
    };

    // Calculate ingredient positions
    const ingredientPositions = useMemo(() => {
        return ingredients.map((_, index) => {
            switch (type) {
                case 'energy-bar':
                    return [
                        (Math.random() - 0.5) * 1.8,
                        0.25 + (index % 3) * 0.15,
                        (Math.random() - 0.5) * 0.8
                    ] as [number, number, number];

                case 'protein-ball':
                    const phi = Math.random() * Math.PI * 2;
                    const theta = Math.random() * Math.PI;
                    const radius = 0.7 + Math.random() * 0.3;
                    return [
                        radius * Math.sin(theta) * Math.cos(phi),
                        radius * Math.cos(theta),
                        radius * Math.sin(theta) * Math.sin(phi)
                    ] as [number, number, number];

                case 'granola-cluster':
                    const clusterRadius = 0.8;
                    const clusterAngle = (index / ingredients.length) * Math.PI * 2;
                    const clusterR = Math.random() * clusterRadius;
                    return [
                        Math.cos(clusterAngle) * clusterR,
                        Math.random() * 0.6 - 0.2,
                        Math.sin(clusterAngle) * clusterR
                    ] as [number, number, number];

                case 'smoothie-bowl':
                    const bowlAngle = (index / ingredients.length) * Math.PI * 2;
                    const bowlRadius = 0.3 + Math.random() * 0.4;
                    return [
                        Math.cos(bowlAngle) * bowlRadius,
                        0.5 + Math.random() * 0.1,
                        Math.sin(bowlAngle) * bowlRadius
                    ] as [number, number, number];

                case 'trail-mix':
                    return [
                        (Math.random() - 0.5) * 2.5,
                        0.1 + Math.random() * 0.3,
                        (Math.random() - 0.5) * 2.5
                    ] as [number, number, number];

                default:
                    return [
                        (Math.random() - 0.5) * 1.2,
                        0.3,
                        (Math.random() - 0.5) * 0.8
                    ] as [number, number, number];
            }
        });
    }, [ingredients, type]);

    return (
        <group ref={groupRef}>
            {/* Base shape */}
            {getBaseGeometry()}

            {/* Ingredients */}
            {ingredients.map((ingredient, index) => (
                <Ingredient3D
                    key={`${ingredient.name}-${index}-${ingredient.amount_g}`}
                    ingredient={ingredient}
                    position={ingredientPositions[index] || [0, 0, 0]}
                    index={index}
                />
            ))}
        </group>
    );
};

export default function SnackModel({ ingredients, snackType }: SnackModelProps) {
    return <SnackBase type={snackType} ingredients={ingredients} />;
}