import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, RoundedBox, Sphere, Cylinder, Box } from '@react-three/drei';
import * as THREE from 'three';

interface Ingredient {
    name: string;
    amount_g: number;
    color?: string;
    position?: [number, number, number];
    shape?: string;
    texture?: string;
    density?: number;
    category?: string;
}

interface SnackModelProps {
    ingredients: Ingredient[];
    animationSpeed?: number;
    showLabels?: boolean;
    interactionMode?: 'orbit' | 'inspect' | 'build';
    onIngredientClick?: (ingredient: Ingredient, index: number) => void;
    onIngredientHover?: (ingredient: Ingredient | null, index?: number) => void;
    containerShape?: 'box' | 'ball' | 'bar' | 'custom';
    showNutritionVisualization?: boolean;
    theme?: 'realistic' | 'abstract' | 'minimal';
    qualityLevel?: 'low' | 'medium' | 'high';
}

// Enhanced material properties for different ingredient types
const getMaterialProperties = (ingredient: Ingredient, theme: string) => {
    const baseProps = {
        color: ingredient.color || getIngredientColor(ingredient.name),
        roughness: 0.3,
        metalness: 0.1,
        emissive: ingredient.color || getIngredientColor(ingredient.name),
        emissiveIntensity: 0.05,
    };

    // Add transparency for certain shapes
    const materialProps: any = { ...baseProps };

    if (ingredient.shape === 'liquid' || ingredient.shape === 'powder') {
        materialProps.transparent = true;
        materialProps.opacity = ingredient.shape === 'liquid' ? 0.7 : 0.8;
    }

    // Enhanced properties based on theme
    if (theme === 'realistic') {
        materialProps.roughness = getIngredientRoughness(ingredient.name);
        materialProps.metalness = getIngredientMetalness(ingredient.name);
        materialProps.clearcoat = ingredient.name.includes('chocolate') ? 0.8 : 0;
        materialProps.clearcoatRoughness = 0.1;
    } else if (theme === 'abstract') {
        materialProps.emissiveIntensity = 0.2;
        materialProps.roughness = 0.1;
        materialProps.metalness = 0.3;
    }

    return materialProps;
};

const SnackModel: React.FC<SnackModelProps> = ({
                                                   ingredients,
                                                   animationSpeed = 1,
                                                   showLabels = true,
                                                   interactionMode = 'orbit',
                                                   onIngredientClick,
                                                   onIngredientHover,
                                                   containerShape = 'box',
                                                   showNutritionVisualization = false,
                                                   theme = 'realistic',
                                                   qualityLevel = 'medium'
                                               }) => {
    const groupRef = useRef<THREE.Group>(null);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const { camera } = useThree();

    // Animation states
    const [isExploded, setIsExploded] = useState(false);
    const [rotationSpeed, setRotationSpeed] = useState(animationSpeed);

    // Enhanced animation with physics-like behavior
    useFrame((state, delta) => {
        if (groupRef.current && interactionMode !== 'inspect') {
            groupRef.current.rotation.y += delta * 0.5 * rotationSpeed;

            // Add gentle floating motion
            groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
        }
    });

    // Generate ingredient models with advanced positioning
    const ingredientModels = useMemo(() => {
        return ingredients.map((ingredient, index) => {
            const baseScale = Math.cbrt(ingredient.amount_g / 10);
            const scale = Math.max(0.2, Math.min(3, baseScale));

            let position: [number, number, number];

            if (ingredient.position) {
                position = ingredient.position;
            } else {
                // Advanced positioning based on container shape and ingredient properties
                switch (containerShape) {
                    case 'ball':
                        position = generateSpherePosition(index, ingredients.length, scale);
                        break;
                    case 'bar':
                        position = generateBarPosition(index, ingredients.length, scale);
                        break;
                    case 'custom':
                        position = generateCustomPosition(ingredient, index, ingredients.length, scale);
                        break;
                    default: // box
                        position = generateBoxPosition(index, ingredients.length, scale);
                }
            }

            // Add explosion effect
            if (isExploded) {
                const explosionRadius = 3;
                const angle = (index / ingredients.length) * Math.PI * 2;
                position = [
                    position[0] + Math.cos(angle) * explosionRadius,
                    position[1] + Math.sin(index * 0.7) * explosionRadius,
                    position[2] + Math.sin(angle) * explosionRadius
                ];
            }

            const color = ingredient.color || getIngredientColor(ingredient.name);
            const shape = ingredient.shape || getIngredientShape(ingredient.name);
            const density = ingredient.density || getIngredientDensity(ingredient.name);

            return {
                ...ingredient,
                scale,
                position,
                color,
                shape,
                density,
                key: `${ingredient.name}-${index}`,
                index
            };
        });
    }, [ingredients, containerShape, isExploded]);

    // Nutrition visualization
    const nutritionVisualization = useMemo(() => {
        if (!showNutritionVisualization) return null;

        const totalCalories = ingredients.reduce((sum, ing) => sum + (ing.amount_g * 5), 0); // Simplified
        const proteinRatio = ingredients.filter(ing => ing.category === 'protein').length / ingredients.length;

        return {
            totalCalories,
            proteinRatio,
            healthScore: Math.min(100, Math.max(0, (proteinRatio * 50) + (ingredients.length * 5)))
        };
    }, [ingredients, showNutritionVisualization]);

    const handleIngredientClick = (ingredient: typeof ingredientModels[0], event: any) => {
        event.stopPropagation();

        if (interactionMode === 'build') {
            const newSelected = new Set(selectedIndices);
            if (newSelected.has(ingredient.index)) {
                newSelected.delete(ingredient.index);
            } else {
                newSelected.add(ingredient.index);
            }
            setSelectedIndices(newSelected);
        }

        onIngredientClick?.(ingredient, ingredient.index);
    };

    const handleIngredientHover = (ingredient: typeof ingredientModels[0] | null, entering: boolean) => {
        if (entering && ingredient) {
            setHoveredIndex(ingredient.index);
            onIngredientHover?.(ingredient, ingredient.index);
        } else {
            setHoveredIndex(null);
            onIngredientHover?.(null);
        }
    };

    return (
        <group ref={groupRef}>
            {/* Container visualization */}
            {containerShape !== 'custom' && (
                <ContainerMesh
                    shape={containerShape}
                    size={calculateContainerSize(ingredientModels)}
                    theme={theme}
                />
            )}

            {/* Ingredient models */}
            {ingredientModels.map((ingredient) => (
                <IngredientMesh
                    key={ingredient.key}
                    ingredient={ingredient}
                    showLabel={showLabels}
                    isHovered={hoveredIndex === ingredient.index}
                    isSelected={selectedIndices.has(ingredient.index)}
                    interactionMode={interactionMode}
                    theme={theme}
                    qualityLevel={qualityLevel}
                    onPointerOver={(e) => {
                        e.stopPropagation();
                        handleIngredientHover(ingredient, true);
                    }}
                    onPointerOut={(e) => {
                        e.stopPropagation();
                        handleIngredientHover(null, false);
                    }}
                    onClick={(e) => handleIngredientClick(ingredient, e)}
                />
            ))}

            {/* Nutrition visualization overlay */}
            {showNutritionVisualization && nutritionVisualization && (
                <NutritionVisualization
                    data={nutritionVisualization}
                    position={[4, 2, 0]}
                />
            )}

            {/* Interaction hints */}
            {interactionMode === 'build' && (
                <Text
                    position={[0, -3, 0]}
                    fontSize={0.2}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                >
                    Click ingredients to select • {selectedIndices.size} selected
                </Text>
            )}
        </group>
    );
};

// Enhanced ingredient mesh component
interface IngredientMeshProps {
    ingredient: {
        name: string;
        amount_g: number;
        scale: number;
        position: [number, number, number];
        color: string;
        shape: string;
        density: number;
        index: number;
        category?: string;
    };
    showLabel: boolean;
    isHovered: boolean;
    isSelected: boolean;
    interactionMode: string;
    theme: string;
    qualityLevel: string;
    onPointerOver: (event: any) => void;
    onPointerOut: (event: any) => void;
    onClick: (event: any) => void;
}

const IngredientMesh: React.FC<IngredientMeshProps> = ({
                                                           ingredient,
                                                           showLabel,
                                                           isHovered,
                                                           isSelected,
                                                           interactionMode,
                                                           theme,
                                                           qualityLevel,
                                                           onPointerOver,
                                                           onPointerOut,
                                                           onClick
                                                       }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [localScale, setLocalScale] = useState(1);

    // Enhanced animations
// In SnackModel.tsx
// Replace the useFrame callback in the IngredientMesh component with:

    useFrame((state, delta) => {
        if (meshRef.current) {
            // Base rotation
            meshRef.current.rotation.x += delta * 0.3;
            meshRef.current.rotation.z += delta * 0.2;

            // Hover effects
            if (isHovered) {
                setLocalScale(1.2);
                if (meshRef.current.material instanceof THREE.MeshStandardMaterial) {
                    meshRef.current.material.emissiveIntensity = 0.3;
                }
            } else if (isSelected) {
                setLocalScale(1.1);
                if (meshRef.current.material instanceof THREE.MeshStandardMaterial) {
                    meshRef.current.material.emissiveIntensity = 0.2;
                }
            } else {
                setLocalScale(1);
                if (meshRef.current.material instanceof THREE.MeshStandardMaterial) {
                    meshRef.current.material.emissiveIntensity = 0.05;
                }
            }

            // Smooth scale transition
            meshRef.current.scale.lerp(
                new THREE.Vector3(localScale, localScale, localScale),
                delta * 5
            );
        }
    });
    const materialProps = getMaterialProperties(ingredient, theme);
    const geometryDetail = qualityLevel === 'high' ? 32 : qualityLevel === 'medium' ? 16 : 8;

    const renderGeometry = () => {
        const scale = ingredient.scale;

        switch (ingredient.shape) {
            case 'sphere':
                return <sphereGeometry args={[scale, geometryDetail, geometryDetail]} />;

            case 'cube':
                return (
                    <RoundedBox args={[scale, scale, scale]} radius={0.1} smoothness={4}>
                        <meshStandardMaterial {...materialProps} />
                    </RoundedBox>
                );

            case 'cylinder':
                return <cylinderGeometry args={[scale * 0.8, scale * 0.8, scale * 1.5, geometryDetail]} />;

            case 'ellipsoid':
                return <sphereGeometry args={[scale, scale * 0.7, scale * 1.2, geometryDetail, geometryDetail]} />;

            case 'irregular':
                return <IrregularGeometry scale={scale} complexity={geometryDetail} seed={ingredient.name} />;

            case 'powder':
                return (
                    <PowderGeometry
                        scale={scale}
                        particleCount={qualityLevel === 'high' ? 20 : qualityLevel === 'medium' ? 12 : 8}
                        material={materialProps}
                    />
                );

            case 'liquid':
                return (
                    <LiquidGeometry
                        scale={scale}
                        viscosity={getIngredientViscosity(ingredient.name)}
                        material={materialProps}
                    />
                );

            case 'flakes':
                return (
                    <FlakeGeometry
                        scale={scale}
                        flakeCount={qualityLevel === 'high' ? 15 : qualityLevel === 'medium' ? 10 : 6}
                        material={materialProps}
                    />
                );

            default:
                return <sphereGeometry args={[scale, geometryDetail, geometryDetail]} />;
        }
    };

    return (
        <group position={ingredient.position}>
            <mesh
                ref={meshRef}
                onPointerOver={onPointerOver}
                onPointerOut={onPointerOut}
                onClick={onClick}
                castShadow
                receiveShadow
            >
                {renderGeometry()}
                {!['cube', 'powder', 'liquid', 'flakes'].includes(ingredient.shape) && (
                    <meshStandardMaterial {...materialProps} />
                )}
            </mesh>

            {/* Selection indicator */}
            {isSelected && (
                <mesh position={[0, 0, 0]} scale={ingredient.scale * 1.3}>
                    <sphereGeometry args={[1, 16, 16]} />
                    <meshBasicMaterial
                        color="#00ff00"
                        transparent
                        opacity={0.2}
                        wireframe
                    />
                </mesh>
            )}

            {/* Enhanced labels */}
            {showLabel && (
                <group position={[0, ingredient.scale + 0.5, 0]}>
                    <Text
                        fontSize={0.25}
                        color="white"
                        anchorX="center"
                        anchorY="middle"
                        outlineWidth={0.02}
                        outlineColor="black"
                    >
                        {ingredient.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Text>
                    <Text
                        position={[0, -0.3, 0]}
                        fontSize={0.15}
                        color="#cccccc"
                        anchorX="center"
                        anchorY="middle"
                    >
                        {ingredient.amount_g}g
                    </Text>
                    {ingredient.category && (
                        <Text
                            position={[0, -0.5, 0]}
                            fontSize={0.12}
                            color="#999999"
                            anchorX="center"
                            anchorY="middle"
                        >
                            {ingredient.category}
                        </Text>
                    )}
                </group>
            )}

            {/* Hover tooltip */}
            {isHovered && (
                <HoverTooltip
                    ingredient={ingredient}
                    position={[ingredient.scale + 1, 0, 0]}
                />
            )}
        </group>
    );
};

// Container mesh component
const ContainerMesh: React.FC<{
    shape: string;
    size: number;
    theme: string;
}> = ({ shape, size, theme }) => {
    const materialProps = {
        color: theme === 'realistic' ? '#8B4513' : '#333333',
        transparent: true,
        opacity: 0.1,
        wireframe: true
    };

    switch (shape) {
        case 'ball':
            return (
                <mesh>
                    <sphereGeometry args={[size, 32, 32]} />
                    <meshBasicMaterial {...materialProps} />
                </mesh>
            );
        case 'bar':
            return (
                <mesh>
                    <boxGeometry args={[size * 2, size * 0.5, size]} />
                    <meshBasicMaterial {...materialProps} />
                </mesh>
            );
        default: // box
            return (
                <mesh>
                    <boxGeometry args={[size, size, size]} />
                    <meshBasicMaterial {...materialProps} />
                </mesh>
            );
    }
};

// Complex geometry components
const IrregularGeometry: React.FC<{ scale: number; complexity: number; seed: string }> = ({
                                                                                              scale, complexity, seed
                                                                                          }) => {
    const geometry = useMemo(() => {
        const geo = new THREE.SphereGeometry(scale, complexity, complexity);
        const positions = geo.attributes.position.array;

        // Add randomness based on seed
        let seedHash = 0;
        for (let i = 0; i < seed.length; i++) {
            seedHash = ((seedHash << 5) - seedHash + seed.charCodeAt(i)) & 0xffffffff;
        }

        for (let i = 0; i < positions.length; i += 3) {
            const noise = ((seedHash + i) % 1000) / 1000;
            const factor = 0.8 + noise * 0.4;
            positions[i] *= factor;
            positions[i + 1] *= factor;
            positions[i + 2] *= factor;
        }

        geo.computeVertexNormals();
        return geo;
    }, [scale, complexity, seed]);

    return <primitive object={geometry} />;
};

const PowderGeometry: React.FC<{
    scale: number;
    particleCount: number;
    material: any;
}> = ({ scale, particleCount, material }) => {
    const particles = useMemo(() => {
        return Array.from({ length: particleCount }, (_, i) => ({
            position: [
                (Math.random() - 0.5) * scale * 2,
                (Math.random() - 0.5) * scale * 2,
                (Math.random() - 0.5) * scale * 2
            ] as [number, number, number],
            size: scale * (0.1 + Math.random() * 0.1)
        }));
    }, [scale, particleCount]);

    return (
        <group>
            {particles.map((particle, i) => (
                <mesh key={i} position={particle.position}>
                    <sphereGeometry args={[particle.size, 8, 8]} />
                    <meshStandardMaterial {...material} />
                </mesh>
            ))}
        </group>
    );
};

const LiquidGeometry: React.FC<{
    scale: number;
    viscosity: number;
    material: any;
}> = ({ scale, viscosity, material }) => {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            const time = state.clock.elapsedTime;
            meshRef.current.scale.y = 1 + Math.sin(time * 2) * 0.1 * (1 - viscosity);
        }
    });

    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[scale, 16, 16]} />
            <meshStandardMaterial {...material} />
        </mesh>
    );
};

const FlakeGeometry: React.FC<{
    scale: number;
    flakeCount: number;
    material: any;
}> = ({ scale, flakeCount, material }) => {
    const flakes = useMemo(() => {
        return Array.from({ length: flakeCount }, (_, i) => ({
            position: [
                (Math.random() - 0.5) * scale * 1.5,
                (Math.random() - 0.5) * scale * 1.5,
                (Math.random() - 0.5) * scale * 1.5
            ] as [number, number, number],
            rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI] as [number, number, number],
            scale: [scale * 0.3, scale * 0.05, scale * 0.2] as [number, number, number]
        }));
    }, [scale, flakeCount]);

    return (
        <group>
            {flakes.map((flake, i) => (
                <mesh key={i} position={flake.position} rotation={flake.rotation} scale={flake.scale}>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial {...material} />
                </mesh>
            ))}
        </group>
    );
};

// Nutrition visualization component
const NutritionVisualization: React.FC<{
    data: { totalCalories: number; proteinRatio: number; healthScore: number };
    position: [number, number, number];
}> = ({ data, position }) => {
    return (
        <group position={position}>
            <Text
                fontSize={0.3}
                color="white"
                anchorX="center"
                anchorY="middle"
            >
                Nutrition Info
            </Text>
            <Text
                position={[0, -0.4, 0]}
                fontSize={0.2}
                color="#ffcc00"
                anchorX="center"
                anchorY="middle"
            >
                Calories: {Math.round(data.totalCalories)}
            </Text>
            <Text
                position={[0, -0.7, 0]}
                fontSize={0.2}
                color="#00ff00"
                anchorX="center"
                anchorY="middle"
            >
                Health Score: {Math.round(data.healthScore)}
            </Text>
        </group>
    );
};

// Hover tooltip component
const HoverTooltip: React.FC<{
    ingredient: any;
    position: [number, number, number];
}> = ({ ingredient, position }) => {
    return (
        <group position={position}>
            <mesh>
                <planeGeometry args={[2, 1]} />
                <meshBasicMaterial color="black" transparent opacity={0.8} />
            </mesh>
            <Text
                position={[0, 0.2, 0.01]}
                fontSize={0.15}
                color="white"
                anchorX="center"
                anchorY="middle"
            >
                {ingredient.name.replace(/_/g, ' ')}
            </Text>
            <Text
                position={[0, 0, 0.01]}
                fontSize={0.12}
                color="#cccccc"
                anchorX="center"
                anchorY="middle"
            >
                Amount: {ingredient.amount_g}g
            </Text>
            <Text
                position={[0, -0.2, 0.01]}
                fontSize={0.12}
                color="#cccccc"
                anchorX="center"
                anchorY="middle"
            >
                Density: {ingredient.density.toFixed(2)}
            </Text>
        </group>
    );
};

// Enhanced helper functions
function generateSpherePosition(index: number, total: number, scale: number): [number, number, number] {
    const phi = Math.acos(-1 + (2 * index) / total);
    const theta = Math.sqrt(total * Math.PI) * phi;
    const radius = 2;

    return [
        radius * Math.cos(theta) * Math.sin(phi),
        radius * Math.cos(phi),
        radius * Math.sin(theta) * Math.sin(phi)
    ];
}

function generateBarPosition(index: number, total: number, scale: number): [number, number, number] {
    const x = (index - total / 2) * (scale * 2.5);
    const y = Math.sin(index * 0.5) * 0.3;
    const z = Math.cos(index * 0.3) * 0.3;

    return [x, y, z];
}

function generateBoxPosition(index: number, total: number, scale: number): [number, number, number] {
    const layer = Math.floor(Math.cbrt(index));
    const itemsPerLayer = Math.ceil(Math.cbrt(total));
    const posInLayer = index % (itemsPerLayer * itemsPerLayer);

    const x = (posInLayer % itemsPerLayer - itemsPerLayer / 2) * scale * 2.5;
    const y = (layer - Math.cbrt(total) / 2) * scale * 2.5;
    const z = (Math.floor(posInLayer / itemsPerLayer) - itemsPerLayer / 2) * scale * 2.5;

    return [x, y, z];
}

function generateCustomPosition(ingredient: Ingredient, index: number, total: number, scale: number): [number, number, number] {
    // Custom positioning based on ingredient properties
    const density = getIngredientDensity(ingredient.name);
    const category = ingredient.category || 'other';

    let baseRadius = 2;
    if (category === 'nuts_seeds') baseRadius = 1.5;
    else if (category === 'fruits') baseRadius = 2.5;
    else if (category === 'protein') baseRadius = 1;

    const angle = (index / total) * Math.PI * 2;
    const height = (density - 0.5) * 2; // Denser ingredients sink

    return [
        Math.cos(angle) * baseRadius,
        height,
        Math.sin(angle) * baseRadius
    ];
}

function calculateContainerSize(ingredients: any[]): number {
    const totalVolume = ingredients.reduce((sum, ing) => sum + Math.pow(ing.scale, 3), 0);
    return Math.cbrt(totalVolume) * 1.5;
}

function getIngredientColor(name: string): string {
    const colorMap: Record<string, string> = {
        almonds: '#D2B48C',
        walnuts: '#8B4513',
        cashews: '#F5DEB3',
        pistachios: '#9ACD32',
        pecans: '#A0522D',
        dates: '#654321',
        cranberries_dried: '#DC143C',
        blueberries_dried: '#191970',
        raisins: '#722F37',
        apricots_dried: '#FBCEB1',
        dark_chocolate_70: '#3C1810',
        dark_chocolate_85: '#2F120B',
        milk_chocolate: '#7B3F00',
        white_chocolate: '#F7E7CE',
        oats: '#F5DEB3',
        quinoa: '#F4F4E6',
        brown_rice: '#E6D3A3',
        protein_powder_whey: '#FFFFFF',
        protein_powder_plant: '#90EE90',
        protein_powder_casein: '#FFF8DC',
        chia_seeds: '#2F2F2F',
        flax_seeds: '#8B4513',
        hemp_seeds: '#A0522D',
        sunflower_seeds: '#F5DEB3',
        pumpkin_seeds: '#2E8B57',
        honey: '#FFD700',
        maple_syrup: '#D2691E',
        agave_nectar: '#DAA520',
        coconut_flakes: '#FFFFFF',
        coconut_oil: '#F7F7F7',
        coconut_butter: '#FFFDD0',
        cinnamon: '#D2691E',
        vanilla_extract: '#F5DEB3',
        cocoa_powder: '#8B4513',
        matcha_powder: '#7CB342',
        spirulina: '#006A4E',
        goji_berries: '#FF4500',
        acai_powder: '#4B0082',
        maca_powder: '#D2B48C'
    };

    return colorMap[name.toLowerCase()] || '#8B4513';
}

function getIngredientShape(name: string): string {
    const shapeMap: Record<string, string> = {
        // Nuts - irregular shapes
        almonds: 'ellipsoid',
        walnuts: 'irregular',
        cashews: 'irregular',
        pistachios: 'ellipsoid',
        pecans: 'ellipsoid',

        // Seeds - small spheres
        chia_seeds: 'sphere',
        flax_seeds: 'ellipsoid',
        hemp_seeds: 'sphere',
        sunflower_seeds: 'ellipsoid',
        pumpkin_seeds: 'sphere',

        // Dried fruits - irregular chunks
        dates: 'irregular',
        cranberries_dried: 'irregular',
        blueberries_dried: 'sphere',
        raisins: 'irregular',
        apricots_dried: 'irregular',
        goji_berries: 'ellipsoid',

        // Powders
        protein_powder_whey: 'powder',
        protein_powder_plant: 'powder',
        protein_powder_casein: 'powder',
        cinnamon: 'powder',
        cocoa_powder: 'powder',
        matcha_powder: 'powder',
        spirulina: 'powder',
        acai_powder: 'powder',
        maca_powder: 'powder',

        // Liquids
        honey: 'liquid',
        maple_syrup: 'liquid',
        agave_nectar: 'liquid',
        vanilla_extract: 'liquid',
        coconut_oil: 'liquid',

        // Flakes and grains
        coconut_flakes: 'flakes',
        oats: 'flakes',
        quinoa: 'sphere',
        brown_rice: 'ellipsoid',

        // Chocolate - cubes/chunks
        dark_chocolate_70: 'cube',
        dark_chocolate_85: 'cube',
        milk_chocolate: 'cube',
        white_chocolate: 'cube',

        // Butters
        coconut_butter: 'liquid'
    };

    return shapeMap[name.toLowerCase()] || 'sphere';
}

function getIngredientRoughness(name: string): number {
    const roughnessMap: Record<string, number> = {
        // Smooth ingredients
        honey: 0.1,
        maple_syrup: 0.1,
        dark_chocolate_70: 0.2,

        // Medium roughness
        almonds: 0.4,
        cashews: 0.3,
        walnuts: 0.6,
        dates: 0.7,

        // Rough ingredients
        coconut_flakes: 0.8,
        oats: 0.7,
        chia_seeds: 0.5,
        flax_seeds: 0.6,

        // Very rough/powdery
        protein_powder_whey: 0.9,
        protein_powder_plant: 0.9,
        cinnamon: 0.8,
        cocoa_powder: 0.8
    };

    return roughnessMap[name.toLowerCase()] || 0.5;
}

function getIngredientMetalness(name: string): number {
    const metalnessMap: Record<string, number> = {
        // No metallic properties for food
        honey: 0.0,
        maple_syrup: 0.0,
        dark_chocolate_70: 0.1, // Slight sheen
        almonds: 0.0,

        // Oils have slight metallic look
        coconut_oil: 0.2,

        // Most ingredients are non-metallic
        default: 0.0
    };

    return metalnessMap[name.toLowerCase()] || 0.0;
}

function getIngredientDensity(name: string): number {
    const densityMap: Record<string, number> = {
        // Heavy/dense ingredients (sink)
        nuts: 0.8,
        almonds: 0.8,
        walnuts: 0.7,
        cashews: 0.6,
        dates: 0.9,

        // Medium density
        oats: 0.4,
        quinoa: 0.5,
        chia_seeds: 0.6,

        // Light ingredients (float)
        coconut_flakes: 0.2,
        protein_powder_whey: 0.3,
        protein_powder_plant: 0.3,

        // Liquids
        honey: 1.0,
        maple_syrup: 0.9,
        coconut_oil: 0.7
    };

    return densityMap[name.toLowerCase()] || 0.5;
}

function getIngredientViscosity(name: string): number {
    const viscosityMap: Record<string, number> = {
        honey: 0.9,
        maple_syrup: 0.6,
        agave_nectar: 0.7,
        coconut_oil: 0.3,
        vanilla_extract: 0.1
    };

    return viscosityMap[name.toLowerCase()] || 0.5;
}

export default SnackModel;