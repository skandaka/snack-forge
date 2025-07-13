// src/components/3d/SnackCanvas.tsx
import React, { Suspense, useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import {
    OrbitControls,
    Environment,
    ContactShadows,
    Text,
    Html,
    Sphere,
    Box,
    Cylinder,
    RoundedBox,
    Torus,
    Icosahedron,
    useTexture,
    Float,
    Text3D,
    Center,
    Effects,
    Sparkles,
    Stars,
    Info,
    X
} from '@react-three/drei';
import { useSnackStore } from '../../stores/snackStore';
import { Ingredient } from '../../types/snack';
import * as THREE from 'three';
import {
    RotateCcw,
    ZoomIn,
    ZoomOut,
    RotateCw,
    Camera,
    Play,
    Pause,
    Download,
    Share2,
    Eye,
    EyeOff,
    Maximize2,
    Minimize2,
    Settings,
    Lightbulb,
    Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Enhanced ingredient visual data for 3D rendering
const INGREDIENT_3D_DATA = {
    almonds: {
        shape: 'oval',
        color: '#D2B48C',
        roughness: 0.6,
        metalness: 0.1,
        scale: [0.12, 0.08, 0.06],
        texture: 'bumpy'
    },
    walnuts: {
        shape: 'brain',
        color: '#8B4513',
        roughness: 0.8,
        metalness: 0.05,
        scale: [0.15, 0.12, 0.15],
        texture: 'wrinkled'
    },
    cashews: {
        shape: 'curved',
        color: '#F5DEB3',
        roughness: 0.4,
        metalness: 0.1,
        scale: [0.18, 0.08, 0.12],
        texture: 'smooth'
    },
    dates: {
        shape: 'oval',
        color: '#8B4513',
        roughness: 0.7,
        metalness: 0.0,
        scale: [0.25, 0.15, 0.12],
        texture: 'wrinkled'
    },
    cranberries_dried: {
        shape: 'sphere',
        color: '#DC143C',
        roughness: 0.5,
        metalness: 0.0,
        scale: [0.08, 0.08, 0.08],
        texture: 'shriveled'
    },
    blueberries_dried: {
        shape: 'sphere',
        color: '#4169E1',
        roughness: 0.6,
        metalness: 0.0,
        scale: [0.06, 0.06, 0.06],
        texture: 'shriveled'
    },
    dark_chocolate_70: {
        shape: 'chunk',
        color: '#4A2C2A',
        roughness: 0.2,
        metalness: 0.3,
        scale: [0.15, 0.08, 0.15],
        texture: 'smooth'
    },
    oats: {
        shape: 'flake',
        color: '#F5DEB3',
        roughness: 0.8,
        metalness: 0.0,
        scale: [0.12, 0.03, 0.08],
        texture: 'flat'
    },
    quinoa: {
        shape: 'tiny_sphere',
        color: '#DDBF94',
        roughness: 0.7,
        metalness: 0.0,
        scale: [0.03, 0.03, 0.03],
        texture: 'granular'
    },
    protein_powder_plant: {
        shape: 'powder',
        color: '#E6E6FA',
        roughness: 0.9,
        metalness: 0.0,
        scale: [0.02, 0.02, 0.02],
        texture: 'powdery'
    },
    protein_powder_whey: {
        shape: 'powder',
        color: '#F0F8FF',
        roughness: 0.9,
        metalness: 0.0,
        scale: [0.02, 0.02, 0.02],
        texture: 'powdery'
    },
    chia_seeds: {
        shape: 'tiny_oval',
        color: '#2F2F2F',
        roughness: 0.8,
        metalness: 0.0,
        scale: [0.02, 0.01, 0.015],
        texture: 'smooth'
    },
    flax_seeds: {
        shape: 'tiny_oval',
        color: '#8B4513',
        roughness: 0.7,
        metalness: 0.0,
        scale: [0.025, 0.015, 0.02],
        texture: 'smooth'
    },
    honey: {
        shape: 'liquid',
        color: '#FFD700',
        roughness: 0.0,
        metalness: 0.0,
        scale: [0.3, 0.1, 0.3],
        texture: 'glossy'
    },
    maple_syrup: {
        shape: 'liquid',
        color: '#DEB887',
        roughness: 0.1,
        metalness: 0.0,
        scale: [0.3, 0.1, 0.3],
        texture: 'glossy'
    },
    coconut_flakes: {
        shape: 'flake',
        color: '#FFFFFF',
        roughness: 0.6,
        metalness: 0.0,
        scale: [0.08, 0.02, 0.06],
        texture: 'fibrous'
    },
    cinnamon: {
        shape: 'powder',
        color: '#D2691E',
        roughness: 0.9,
        metalness: 0.0,
        scale: [0.015, 0.015, 0.015],
        texture: 'fine'
    },
    vanilla_extract: {
        shape: 'liquid',
        color: '#F5DEB3',
        roughness: 0.1,
        metalness: 0.0,
        scale: [0.2, 0.05, 0.2],
        texture: 'glossy'
    }
};

// Enhanced Ingredient 3D Component
interface Ingredient3DProps {
    ingredient: Ingredient;
    position: [number, number, number];
    scale?: [number, number, number];
    onClick?: () => void;
    index: number;
}

const Ingredient3D: React.FC<Ingredient3DProps> = ({
                                                       ingredient,
                                                       position,
                                                       scale = [1, 1, 1],
                                                       onClick,
                                                       index
                                                   }) => {
    const meshRef = useRef<THREE.Group>(null);
    const [hovered, setHovered] = useState(false);
    const [isBeingAdded, setIsBeingAdded] = useState(false);

    const ingredientData = INGREDIENT_3D_DATA[ingredient.name as keyof typeof INGREDIENT_3D_DATA] || {
        shape: 'sphere',
        color: '#CD853F',
        roughness: 0.5,
        metalness: 0.1,
        scale: [0.1, 0.1, 0.1],
        texture: 'smooth'
    };

    // Animation based on ingredient amount (size)
    const sizeMultiplier = Math.max(0.5, Math.min(2, ingredient.amount_g / 25));
    const finalScale = [
        ingredientData.scale[0] * sizeMultiplier * scale[0],
        ingredientData.scale[1] * sizeMultiplier * scale[1],
        ingredientData.scale[2] * sizeMultiplier * scale[2]
    ] as [number, number, number];

    useFrame((state) => {
        if (meshRef.current) {
            // Gentle floating animation with individual offsets
            const time = state.clock.elapsedTime;
            const floatOffset = index * 0.5; // Stagger animations

            meshRef.current.position.y = position[1] + Math.sin(time * 2 + floatOffset) * 0.02;

            // Subtle rotation
            meshRef.current.rotation.y += 0.005;

            // Scale animation on hover
            const targetScale = hovered ? 1.15 : 1;
            meshRef.current.scale.lerp(
                new THREE.Vector3(targetScale, targetScale, targetScale),
                0.1
            );

            // Glow effect when being added
            if (isBeingAdded) {
                const pulse = Math.sin(time * 10) * 0.1 + 1;
                meshRef.current.scale.setScalar(pulse);
            }
        }
    });

    // Trigger "being added" animation
    useEffect(() => {
        setIsBeingAdded(true);
        const timer = setTimeout(() => setIsBeingAdded(false), 1000);
        return () => clearTimeout(timer);
    }, []);

    const getIngredientGeometry = () => {
        const props = { args: finalScale };

        switch (ingredientData.shape) {
            case 'oval':
                return <Sphere {...props} args={[...finalScale, 8, 6]} />;
            case 'brain':
                return <Icosahedron {...props} args={[finalScale[0], 1]} />;
            case 'curved':
                return <Torus {...props} args={[finalScale[0], finalScale[1], 4, 8]} />;
            case 'chunk':
                return <RoundedBox {...props} args={finalScale} radius={0.02} smoothness={4} />;
            case 'flake':
                return <Cylinder {...props} args={[finalScale[0], finalScale[0], finalScale[1], 6]} />;
            case 'tiny_sphere':
                return <Sphere {...props} args={[...finalScale, 6, 4]} />;
            case 'tiny_oval':
                return <Sphere {...props} args={[...finalScale, 4, 3]} />;
            case 'powder':
                // Multiple tiny spheres for powder effect
                return (
                    <group>
                        {Array.from({ length: Math.min(20, Math.max(5, ingredient.amount_g / 5)) }, (_, i) => (
                            <Sphere
                                key={i}
                                position={[
                                    (Math.random() - 0.5) * 0.3,
                                    (Math.random() - 0.5) * 0.2,
                                    (Math.random() - 0.5) * 0.3
                                ]}
                                args={[finalScale[0] / 2, 4, 3]}
                            />
                        ))}
                    </group>
                );
            case 'liquid':
                return <Cylinder {...props} args={[finalScale[0], finalScale[0] * 0.8, finalScale[1], 16]} />;
            default:
                return <Sphere {...props} args={[...finalScale, 8, 6]} />;
        }
    };

    const getMaterial = () => {
        const baseProps = {
            color: ingredientData.color,
            roughness: ingredientData.roughness,
            metalness: ingredientData.metalness,
            transparent: ingredientData.shape === 'liquid',
            opacity: ingredientData.shape === 'liquid' ? 0.8 : 1
        };

        // Add special effects for certain ingredients
        if (ingredientData.texture === 'glossy') {
            return <meshPhysicalMaterial {...baseProps} clearcoat={1} clearcoatRoughness={0} />;
        } else if (ingredientData.texture === 'powdery') {
            return <meshLambertMaterial {...baseProps} />;
        } else {
            return <meshStandardMaterial {...baseProps} />;
        }
    };

    return (
        <Float speed={1} rotationIntensity={0.2} floatIntensity={0.3}>
            <group
                ref={meshRef}
                position={position}
                onClick={onClick}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                <mesh castShadow receiveShadow>
                    {getIngredientGeometry()}
                    {getMaterial()}
                </mesh>

                {/* Glow effect for special ingredients */}
                {(ingredientData.texture === 'glossy' || isBeingAdded) && (
                    <mesh scale={1.2}>
                        {getIngredientGeometry()}
                        <meshBasicMaterial
                            color={ingredientData.color}
                            transparent
                            opacity={0.1}
                            side={THREE.BackSide}
                        />
                    </mesh>
                )}

                {/* Particle effects for powder ingredients */}
                {ingredientData.texture === 'powdery' && (
                    <Sparkles
                        count={10}
                        scale={0.5}
                        size={1}
                        speed={0.3}
                        color={ingredientData.color}
                    />
                )}

                {/* Ingredient label on hover */}
                {hovered && (
                    <Html distanceFactor={8}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-black/80 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap pointer-events-none shadow-lg border border-white/20"
                        >
                            <div className="font-semibold">
                                {ingredient.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                            <div className="text-gray-300 text-xs">{ingredient.amount_g}g</div>
                        </motion.div>
                    </Html>
                )}
            </group>
        </Float>
    );
};

// Enhanced Snack Base 3D Component
interface SnackBaseProps {
    type: string;
    ingredients: Ingredient[];
}

const SnackBase: React.FC<SnackBaseProps> = ({ type, ingredients }) => {
    const meshRef = useRef<THREE.Group>(null);
    const [baseColor, setBaseColor] = useState('#DEB887');

    // Calculate base color based on dominant ingredients
    useEffect(() => {
        if (ingredients.length > 0) {
            const dominantIngredient = ingredients.reduce((prev, current) =>
                prev.amount_g > current.amount_g ? prev : current
            );
            const ingredientData = INGREDIENT_3D_DATA[dominantIngredient.name as keyof typeof INGREDIENT_3D_DATA];
            if (ingredientData) {
                setBaseColor(ingredientData.color);
            }
        }
    }, [ingredients]);

    useFrame((state) => {
        if (meshRef.current) {
            // Very gentle rotation
            meshRef.current.rotation.y += 0.001;

            // Subtle breathing animation
            const breathe = Math.sin(state.clock.elapsedTime * 0.5) * 0.02 + 1;
            meshRef.current.scale.setScalar(breathe);
        }
    });

    const getBaseGeometry = () => {
        switch (type) {
            case 'energy-bar':
                return (
                    <group>
                        <RoundedBox args={[2, 0.4, 1]} radius={0.1} smoothness={4}>
                            <meshPhysicalMaterial
                                color={baseColor}
                                roughness={0.6}
                                clearcoat={0.3}
                                transmission={0.1}
                            />
                        </RoundedBox>
                        {/* Base texture lines */}
                        {Array.from({ length: 5 }, (_, i) => (
                            <Box key={i} args={[1.8, 0.02, 0.02]} position={[0, 0.2 + i * 0.08, 0.4]}>
                                <meshStandardMaterial color="#8B4513" />
                            </Box>
                        ))}
                    </group>
                );

            case 'protein-ball':
                return (
                    <group>
                        <Sphere args={[0.8, 16, 12]}>
                            <meshPhysicalMaterial
                                color={baseColor}
                                roughness={0.7}
                                metalness={0.1}
                                bumpScale={0.1}
                            />
                        </Sphere>
                        {/* Surface texture bumps */}
                        {Array.from({ length: 12 }, (_, i) => {
                            const phi = Math.random() * Math.PI * 2;
                            const theta = Math.random() * Math.PI;
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
                        {/* Multiple interconnected spheres */}
                        {Array.from({ length: 8 }, (_, i) => (
                            <Sphere
                                key={i}
                                position={[
                                    (Math.random() - 0.5) * 1.2,
                                    (Math.random() - 0.5) * 0.6,
                                    (Math.random() - 0.5) * 1.2
                                ]}
                                args={[0.15 + Math.random() * 0.1, 8, 6]}
                            >
                                <meshStandardMaterial
                                    color={new THREE.Color(baseColor).offsetHSL(0, 0, (Math.random() - 0.5) * 0.2)}
                                    roughness={0.8}
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
                                color={baseColor}
                                roughness={0.2}
                                transmission={0.3}
                                thickness={0.5}
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
                                opacity={0.3}
                            />
                        </Cylinder>
                    </group>
                );

            default:
                return (
                    <RoundedBox args={[1.5, 0.4, 1]} radius={0.1} smoothness={4}>
                        <meshStandardMaterial color={baseColor} roughness={0.6} />
                    </RoundedBox>
                );
        }
    };

    // Calculate ingredient positions based on snack type
    const getIngredientPositions = (): [number, number, number][] => {
        const positions: [number, number, number][] = [];

        ingredients.forEach((ingredient, index) => {
            switch (type) {
                case 'energy-bar':
                    // Layer ingredients on and in the bar
                    const barX = (Math.random() - 0.5) * 1.8;
                    const barZ = (Math.random() - 0.5) * 0.8;
                    const barY = 0.25 + (index % 3) * 0.15;
                    positions.push([barX, barY, barZ]);
                    break;

                case 'protein-ball':
                    // Distribute around sphere surface with some embedded
                    const phi = Math.random() * Math.PI * 2;
                    const theta = Math.random() * Math.PI;
                    const radius = 0.7 + Math.random() * 0.3;
                    positions.push([
                        radius * Math.sin(theta) * Math.cos(phi),
                        radius * Math.cos(theta),
                        radius * Math.sin(theta) * Math.sin(phi)
                    ]);
                    break;

                case 'granola-cluster':
                    // Cluster around central area
                    const clusterRadius = 0.8;
                    const clusterAngle = (index / ingredients.length) * Math.PI * 2 + Math.random() * 0.5;
                    const clusterR = Math.random() * clusterRadius;
                    positions.push([
                        Math.cos(clusterAngle) * clusterR,
                        Math.random() * 0.6 - 0.2,
                        Math.sin(clusterAngle) * clusterR
                    ]);
                    break;

                case 'smoothie-bowl':
                    // Arrange on top of smoothie surface in patterns
                    const bowlAngle = (index / ingredients.length) * Math.PI * 2;
                    const bowlRadius = 0.3 + Math.random() * 0.4;
                    positions.push([
                        Math.cos(bowlAngle) * bowlRadius,
                        0.5 + Math.random() * 0.1,
                        Math.sin(bowlAngle) * bowlRadius
                    ]);
                    break;

                case 'trail-mix':
                    // Scatter naturally across platform
                    const mixX = (Math.random() - 0.5) * 2.5;
                    const mixZ = (Math.random() - 0.5) * 2.5;
                    const mixY = 0.1 + Math.random() * 0.3;
                    positions.push([mixX, mixY, mixZ]);
                    break;

                default:
                    positions.push([
                        (Math.random() - 0.5) * 1.2,
                        0.3,
                        (Math.random() - 0.5) * 0.8
                    ]);
            }
        });

        return positions;
    };

    const ingredientPositions = useMemo(() => getIngredientPositions(), [ingredients, type]);

    return (
        <group ref={meshRef}>
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

            {/* Ambient particles for visual appeal */}
            {ingredients.length > 3 && (
                <Sparkles
                    count={20}
                    scale={2}
                    size={0.5}
                    speed={0.1}
                    opacity={0.3}
                    color="#FFD700"
                />
            )}
        </group>
    );
};

// Loading component
const LoadingFallback: React.FC = () => (
    <Html center>
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg"
        >
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mb-4"
            />
            <div className="text-gray-700 font-semibold">Loading 3D Kitchen...</div>
            <div className="text-gray-500 text-sm">Preparing your ingredients</div>
        </motion.div>
    </Html>
);

// Enhanced drop zone
const DropZone: React.FC = () => {
    const [isDragOver, setIsDragOver] = useState(false);
    const { addIngredient } = useSnackStore();

    useEffect(() => {
        const handleDragOver = (e: DragEvent) => {
            e.preventDefault();
            setIsDragOver(true);
        };

        const handleDragLeave = () => {
            setIsDragOver(false);
        };

        const handleDrop = (e: DragEvent) => {
            e.preventDefault();
            setIsDragOver(false);

            try {
                const ingredientData = JSON.parse(e.dataTransfer?.getData('text/plain') || '{}');
                if (ingredientData.name) {
                    addIngredient(ingredientData);
                }
            } catch (error) {
                console.error('Drop error:', error);
            }
        };

        const canvas = document.querySelector('canvas');
        if (canvas) {
            canvas.addEventListener('dragover', handleDragOver);
            canvas.addEventListener('dragleave', handleDragLeave);
            canvas.addEventListener('drop', handleDrop);

            return () => {
                canvas.removeEventListener('dragover', handleDragOver);
                canvas.removeEventListener('dragleave', handleDragLeave);
                canvas.removeEventListener('drop', handleDrop);
            };
        }
    }, [addIngredient]);

    if (isDragOver) {
        return (
            <Html fullscreen>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-4 border-dashed border-blue-500 flex items-center justify-center backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.8, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="bg-white/90 rounded-2xl p-8 shadow-2xl text-center border border-white/50"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="text-6xl mb-4"
                        >
                            🎯
                        </motion.div>
                        <div className="text-2xl font-bold text-gray-900 mb-2">Drop Ingredient Here!</div>
                        <div className="text-gray-600">Add to your delicious snack creation</div>
                    </motion.div>
                </motion.div>
            </Html>
        );
    }

    return null;
};

// Camera controller
const CameraController: React.FC = () => {
    const { camera } = useThree();
    const { camera: cameraState } = useSnackStore();

    useEffect(() => {
        camera.position.set(...cameraState.position);
        camera.lookAt(...cameraState.target);
    }, [camera, cameraState]);

    return null;
};

// Control panel component
const ControlPanel: React.FC<{
    autoRotate: boolean;
    setAutoRotate: (value: boolean) => void;
    onResetCamera: () => void;
    onCameraAngle: (angle: string) => void;
    onToggleFullscreen: () => void;
    isFullscreen: boolean;
    onToggleWireframe: () => void;
    wireframe: boolean;
}> = ({
          autoRotate,
          setAutoRotate,
          onResetCamera,
          onCameraAngle,
          onToggleFullscreen,
          isFullscreen,
          onToggleWireframe,
          wireframe
      }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-4 right-4 z-10"
        >
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/50 overflow-hidden">
                {/* Header */}
                <div className="p-3 border-b border-gray-200/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Settings className="w-4 h-4 text-gray-600" />
                            <span className="text-sm font-semibold text-gray-700">3D Controls</span>
                        </div>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                            <motion.div
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                            </motion.div>
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="p-3 space-y-3">
                                {/* Camera Presets */}
                                <div>
                                    <label className="text-xs font-medium text-gray-600 mb-2 block">Camera Angles</label>
                                    <div className="grid grid-cols-2 gap-1">
                                        {[
                                            { label: 'Front', value: 'front' },
                                            { label: 'Side', value: 'side' },
                                            { label: 'Top', value: 'top' },
                                            { label: 'Beauty', value: 'beauty' }
                                        ].map((angle) => (
                                            <button
                                                key={angle.value}
                                                className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                                                onClick={() => onCameraAngle(angle.value)}
                                            >
                                                {angle.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="space-y-2">
                                    <div className="flex gap-1">
                                        <button
                                            className="flex-1 p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                            onClick={() => setAutoRotate(!autoRotate)}
                                            title={autoRotate ? 'Pause rotation' : 'Start rotation'}
                                        >
                                            {autoRotate ? <Pause className="w-4 h-4 mx-auto" /> : <Play className="w-4 h-4 mx-auto" />}
                                        </button>

                                        <button
                                            className="flex-1 p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                            onClick={onResetCamera}
                                            title="Reset camera"
                                        >
                                            <RotateCcw className="w-4 h-4 mx-auto" />
                                        </button>
                                    </div>

                                    <div className="flex gap-1">
                                        <button
                                            className="flex-1 p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                            onClick={onToggleFullscreen}
                                            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                                        >
                                            {isFullscreen ? <Minimize2 className="w-4 h-4 mx-auto" /> : <Maximize2 className="w-4 h-4 mx-auto" />}
                                        </button>

                                        <button
                                            className="flex-1 p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                            onClick={onToggleWireframe}
                                            title="Toggle wireframe"
                                        >
                                            {wireframe ? <EyeOff className="w-4 h-4 mx-auto" /> : <Eye className="w-4 h-4 mx-auto" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Lighting Controls */}
                                <div>
                                    <label className="text-xs font-medium text-gray-600 mb-2 block">Environment</label>
                                    <div className="grid grid-cols-3 gap-1">
                                        {['Studio', 'Sunset', 'Dawn'].map((env) => (
                                            <button
                                                key={env}
                                                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                                            >
                                                {env}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

// Info panel component
const InfoPanel: React.FC<{
    currentSnack: any;
}> = ({ currentSnack }) => {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) {
        return (
            <button
                onClick={() => setIsVisible(true)}
                className="absolute bottom-4 left-4 p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 hover:bg-white transition-colors"
            >
                <Info className="w-5 h-5 text-gray-600" />
            </button>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/50 p-4 max-w-sm"
        >
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900">
                    {currentSnack.name || 'Custom Snack'}
                </h3>
                <button
                    onClick={() => setIsVisible(false)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                    <X className="w-4 h-4 text-gray-500" />
                </button>
            </div>

            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-600">Ingredients:</span>
                    <span className="font-medium">{currentSnack.ingredients.length}</span>
                </div>

                <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium capitalize">
                        {currentSnack.base.type.replace('-', ' ')}
                    </span>
                </div>

                {currentSnack.nutrition && (
                    <>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Health Score:</span>
                            <span className="font-bold text-green-600">
                                {Math.round(currentSnack.nutrition.health_score)}/100
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-600">Calories:</span>
                            <span className="font-medium">
                                {Math.round(currentSnack.nutrition.nutrition_per_serving.calories_per_100g)}
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-600">Protein:</span>
                            <span className="font-medium">
                                {currentSnack.nutrition.nutrition_per_100g.protein_g.toFixed(1)}g
                            </span>
                        </div>
                    </>
                )}
            </div>

            {/* Quick tip */}
            <div className="mt-3 pt-3 border-t border-gray-200/50">
                <div className="flex items-start gap-2 text-xs text-gray-600">
                    <Lightbulb className="w-3 h-3 mt-0.5 text-yellow-500" />
                    <span>Drag ingredients from the library to add them to your snack!</span>
                </div>
            </div>
        </motion.div>
    );
};

// Main Canvas Component
export default function SnackCanvas() {
    const {
        currentSnack,
        camera,
        updateCamera,
        ui
    } = useSnackStore();

    const [autoRotate, setAutoRotate] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [wireframe, setWireframe] = useState(false);
    const [environment, setEnvironment] = useState<'studio' | 'sunset' | 'dawn'>('studio');

    const handleResetCamera = () => {
        updateCamera({
            position: [5, 5, 5],
            target: [0, 0, 0],
            zoom: 1
        });
    };

    const handleCameraAngle = (angle: string) => {
        switch (angle) {
            case 'front':
                updateCamera({ position: [0, 2, 6] });
                break;
            case 'side':
                updateCamera({ position: [6, 2, 0] });
                break;
            case 'top':
                updateCamera({ position: [0, 8, 0] });
                break;
            case 'beauty':
                updateCamera({ position: [4, 6, 4] });
                break;
        }
    };

    const handleToggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const hasIngredients = currentSnack.ingredients.length > 0;

    return (
        <div className="relative w-full h-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
            {/* 3D Canvas */}
            <Canvas
                shadows
                camera={{
                    position: camera.position,
                    fov: 50,
                    near: 0.1,
                    far: 1000
                }}
                gl={{
                    antialias: true,
                    alpha: true,
                    preserveDrawingBuffer: true,
                    powerPreference: "high-performance"
                }}
            >
                <Suspense fallback={<LoadingFallback />}>
                    {/* Lighting Setup */}
                    <ambientLight intensity={0.6} color="#ffffff" />
                    <directionalLight
                        position={[15, 15, 10]}
                        intensity={1.2}
                        castShadow
                        shadow-mapSize={[2048, 2048]}
                        shadow-camera-far={50}
                        shadow-camera-left={-15}
                        shadow-camera-right={15}
                        shadow-camera-top={15}
                        shadow-camera-bottom={-15}
                        color="#fff8e1"
                    />
                    <pointLight position={[-10, 10, -10]} intensity={0.8} color="#e3f2fd" />
                    <spotLight
                        position={[0, 20, 0]}
                        angle={0.3}
                        penumbra={0.5}
                        intensity={0.5}
                        castShadow
                        color="#fff3e0"
                    />

                    {/* Environment */}
                    <Environment
                        preset={environment}
                        background={false}
                        blur={0.8}
                    />

                    {/* Background */}
                    <Stars
                        radius={100}
                        depth={50}
                        count={1000}
                        factor={4}
                        saturation={0}
                        fade
                        speed={0.5}
                    />

                    {/* Ground and Shadows */}
                    <ContactShadows
                        opacity={0.4}
                        scale={15}
                        blur={2}
                        far={20}
                        resolution={512}
                        color="#000000"
                        position={[0, -2, 0]}
                    />

                    {/* Invisible ground plane for better depth perception */}
                    <mesh receiveShadow position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[50, 50]} />
                        <shadowMaterial transparent opacity={0.2} />
                    </mesh>

                    {/* Main snack model */}
                    <SnackBase
                        type={currentSnack.base.type}
                        ingredients={currentSnack.ingredients}
                    />

                    {/* Camera controller */}
                    <CameraController />

                    {/* Controls */}
                    <OrbitControls
                        autoRotate={autoRotate}
                        autoRotateSpeed={0.8}
                        enablePan={true}
                        enableZoom={true}
                        enableRotate={true}
                        minDistance={3}
                        maxDistance={25}
                        maxPolarAngle={Math.PI / 1.4}
                        dampingFactor={0.05}
                        enableDamping={true}
                    />

                    {/* Drop zone */}
                    <DropZone />

                    {/* Empty state */}
                    {!hasIngredients && (
                        <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
                            <Center>
                                <Text3D
                                    font="/fonts/helvetiker_regular.typeface.json"
                                    size={0.5}
                                    height={0.1}
                                    curveSegments={12}
                                    bevelEnabled
                                    bevelThickness={0.02}
                                    bevelSize={0.01}
                                    bevelOffset={0}
                                    bevelSegments={5}
                                    position={[0, 1, 0]}
                                >
                                    Start Building
                                    <meshPhysicalMaterial
                                        color="#3B82F6"
                                        roughness={0.1}
                                        metalness={0.8}
                                        clearcoat={1}
                                    />
                                </Text3D>
                            </Center>
                        </Float>
                    )}

                    {/* Celebration particles when snack is complete */}
                    {hasIngredients && currentSnack.nutrition && currentSnack.nutrition.health_score > 80 && (
                        <Sparkles
                            count={50}
                            scale={5}
                            size={2}
                            speed={0.5}
                            opacity={0.6}
                            color="#FFD700"
                        />
                    )}
                </Suspense>
            </Canvas>

            {/* UI Overlays */}
            <ControlPanel
                autoRotate={autoRotate}
                setAutoRotate={setAutoRotate}
                onResetCamera={handleResetCamera}
                onCameraAngle={handleCameraAngle}
                onToggleFullscreen={handleToggleFullscreen}
                isFullscreen={isFullscreen}
                onToggleWireframe={() => setWireframe(!wireframe)}
                wireframe={wireframe}
            />

            <InfoPanel currentSnack={currentSnack} />

            {/* Loading Overlay */}
            {ui.isLoading && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-xl shadow-xl p-6 flex flex-col items-center"
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-3"
                        />
                        <p className="text-gray-700 font-medium">Calculating nutrition...</p>
                    </motion.div>
                </div>
            )}

            {/* Instructions for empty state */}
            {!hasIngredients && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 text-center max-w-md mx-4 shadow-xl border border-white/50">
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-6xl mb-4"
                        >
                            🍪
                        </motion.div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">Create Your Perfect Snack</h3>
                        <p className="text-gray-600 mb-6">
                            Drag delicious ingredients from the library onto this 3D canvas to start building your healthy masterpiece!
                        </p>
                        <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                                <span>Drag & Drop</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full" />
                                <span>Real-time Nutrition</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-purple-500 rounded-full" />
                                <span>AI Coaching</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Performance indicator */}
            <div className="absolute top-4 left-4 bg-black/20 backdrop-blur-sm rounded-lg px-3 py-1 text-white text-xs font-mono">
                3D Renderer Active
            </div>
        </div>
    );
}