// src/components/3d/SnackCanvas.tsx
import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
    OrbitControls,
    Environment,
    ContactShadows,
    Text,
    Html,
    useTexture,
    Sphere,
    Box,
    Cylinder
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
    Pause
} from 'lucide-react';

// Ingredient 3D Models
interface Ingredient3DProps {
    ingredient: Ingredient;
    position: [number, number, number];
    scale?: [number, number, number];
    onClick?: () => void;
}

const Ingredient3D: React.FC<Ingredient3DProps> = ({
                                                       ingredient,
                                                       position,
                                                       scale = [1, 1, 1],
                                                       onClick
                                                   }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    useFrame((state) => {
        if (meshRef.current) {
            // Gentle floating animation
            meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.02;

            // Slight rotation for visual interest
            meshRef.current.rotation.y += 0.005;

            // Scale on hover
            const targetScale = hovered ? 1.1 : 1;
            meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
        }
    });

    const getIngredientGeometry = () => {
        const category = ingredient.category || 'unknown';
        const name = ingredient.name.toLowerCase();

        // Different shapes based on ingredient type
        if (category === 'nuts_seeds' || name.includes('nut') || name.includes('seed')) {
            return <Sphere args={[0.1, 8, 6]} />;
        } else if (category === 'fruits' || name.includes('berr') || name.includes('date')) {
            return <Sphere args={[0.08, 6, 6]} />;
        } else if (category === 'chocolate' || name.includes('chocolate')) {
            return <Box args={[0.12, 0.06, 0.12]} />;
        } else if (category === 'grains' || name.includes('oat') || name.includes('quinoa')) {
            return <Cylinder args={[0.05, 0.05, 0.02, 6]} />;
        } else if (category === 'protein' || name.includes('protein')) {
            return <Box args={[0.15, 0.15, 0.15]} />;
        } else {
            return <Sphere args={[0.08, 8, 6]} />;
        }
    };

    const getIngredientColor = () => {
        const name = ingredient.name.toLowerCase();

        // Color mapping based on ingredient
        if (name.includes('almond')) return '#D2B48C';
        if (name.includes('walnut')) return '#8B4513';
        if (name.includes('cashew')) return '#F5DEB3';
        if (name.includes('date')) return '#8B4513';
        if (name.includes('cranberr')) return '#DC143C';
        if (name.includes('blueberr')) return '#4169E1';
        if (name.includes('chocolate')) return '#4A2C2A';
        if (name.includes('oat')) return '#F5DEB3';
        if (name.includes('quinoa')) return '#DDBF94';
        if (name.includes('protein')) return '#E6E6FA';
        if (name.includes('chia')) return '#2F2F2F';
        if (name.includes('flax')) return '#8B4513';
        if (name.includes('honey')) return '#FFD700';
        if (name.includes('coconut')) return '#FFFFFF';
        if (name.includes('cinnamon')) return '#D2691E';

        return '#CD853F'; // Default tan color
    };

    return (
        <mesh
            ref={meshRef}
            position={position}
            scale={scale}
            onClick={onClick}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
            castShadow
            receiveShadow
        >
            {getIngredientGeometry()}
            <meshStandardMaterial
                color={getIngredientColor()}
                roughness={0.3}
                metalness={0.1}
            />

            {/* Ingredient label on hover */}
            {hovered && (
                <Html distanceFactor={10}>
                    <div className="bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs whitespace-nowrap pointer-events-none">
                        {ingredient.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        <br />
                        <span className="text-gray-300">{ingredient.amount_g}g</span>
                    </div>
                </Html>
            )}
        </mesh>
    );
};

// Snack Base 3D Models
interface SnackBaseProps {
    type: string;
    ingredients: Ingredient[];
}

const SnackBase: React.FC<SnackBaseProps> = ({ type, ingredients }) => {
    const meshRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (meshRef.current) {
            // Gentle rotation if auto-rotate is enabled
            meshRef.current.rotation.y += 0.002;
        }
    });

    const getBaseGeometry = () => {
        switch (type) {
            case 'energy-bar':
                return (
                    <Box args={[1.5, 0.3, 0.8]}>
                        <meshStandardMaterial color="#DEB887" roughness={0.4} />
                    </Box>
                );
            case 'protein-ball':
                return (
                    <Sphere args={[0.6, 16, 12]}>
                        <meshStandardMaterial color="#DEB887" roughness={0.4} />
                    </Sphere>
                );
            case 'granola-cluster':
                return (
                    <group>
                        {/* Multiple small spheres to create cluster effect */}
                        {Array.from({ length: 8 }, (_, i) => (
                            <Sphere
                                key={i}
                                position={[
                                    (Math.random() - 0.5) * 0.8,
                                    (Math.random() - 0.5) * 0.4,
                                    (Math.random() - 0.5) * 0.8
                                ]}
                                args={[0.15 + Math.random() * 0.1, 8, 6]}
                            >
                                <meshStandardMaterial color="#DEB887" roughness={0.5} />
                            </Sphere>
                        ))}
                    </group>
                );
            case 'smoothie-bowl':
                return (
                    <group>
                        <Cylinder args={[0.8, 0.6, 0.4, 16]}>
                            <meshStandardMaterial color="#E6E6FA" roughness={0.2} />
                        </Cylinder>
                        <Cylinder args={[0.75, 0.55, 0.35, 16]} position={[0, 0.1, 0]}>
                            <meshStandardMaterial color="#DDA0DD" roughness={0.3} />
                        </Cylinder>
                    </group>
                );
            default:
                return (
                    <Box args={[1.2, 0.3, 0.8]}>
                        <meshStandardMaterial color="#DEB887" roughness={0.4} />
                    </Box>
                );
        }
    };

    // Calculate ingredient positions based on snack type
    const getIngredientPositions = (): [number, number, number][] => {
        const positions: [number, number, number][] = [];

        ingredients.forEach((_, index) => {
            switch (type) {
                case 'energy-bar':
                    // Arrange ingredients on top and embedded in bar
                    positions.push([
                        (Math.random() - 0.5) * 1.2,
                        0.2 + Math.random() * 0.1,
                        (Math.random() - 0.5) * 0.6
                    ]);
                    break;
                case 'protein-ball':
                    // Distribute around sphere surface
                    const phi = Math.random() * Math.PI * 2;
                    const theta = Math.random() * Math.PI;
                    const radius = 0.65;
                    positions.push([
                        radius * Math.sin(theta) * Math.cos(phi),
                        radius * Math.cos(theta),
                        radius * Math.sin(theta) * Math.sin(phi)
                    ]);
                    break;
                case 'granola-cluster':
                    // Scatter around cluster
                    positions.push([
                        (Math.random() - 0.5) * 1.2,
                        Math.random() * 0.6,
                        (Math.random() - 0.5) * 1.2
                    ]);
                    break;
                case 'smoothie-bowl':
                    // Place on top of bowl
                    const angle = (index / ingredients.length) * Math.PI * 2;
                    const r = 0.3 + Math.random() * 0.3;
                    positions.push([
                        Math.cos(angle) * r,
                        0.4 + Math.random() * 0.1,
                        Math.sin(angle) * r
                    ]);
                    break;
                default:
                    positions.push([
                        (Math.random() - 0.5) * 1.0,
                        0.2,
                        (Math.random() - 0.5) * 0.6
                    ]);
            }
        });

        return positions;
    };

    const ingredientPositions = getIngredientPositions();

    return (
        <group ref={meshRef}>
            {/* Base shape */}
            {getBaseGeometry()}

            {/* Ingredients */}
            {ingredients.map((ingredient, index) => (
                <Ingredient3D
                    key={`${ingredient.name}-${index}`}
                    ingredient={ingredient}
                    position={ingredientPositions[index] || [0, 0, 0]}
                />
            ))}
        </group>
    );
};

// Camera controls component
const CameraController: React.FC = () => {
    const { camera } = useThree();
    const { camera: cameraState, updateCamera } = useSnackStore();

    useEffect(() => {
        camera.position.set(...cameraState.position);
        camera.lookAt(...cameraState.target);
    }, [camera, cameraState]);

    return null;
};

// Loading fallback
const LoadingFallback: React.FC = () => (
    <Html center>
        <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
            <div className="text-gray-600 text-sm">Loading 3D scene...</div>
        </div>
    </Html>
);

// Drop zone for ingredients
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

        const handleDrop = async (e: DragEvent) => {
            e.preventDefault();
            setIsDragOver(false);

            // Listen for custom ingredient drag events
            const handleIngredientDrop = (event: CustomEvent) => {
                const ingredientData = event.detail;
                addIngredient(ingredientData);
            };

            window.addEventListener('ingredient-drag-start', handleIngredientDrop as EventListener);

            return () => {
                window.removeEventListener('ingredient-drag-start', handleIngredientDrop as EventListener);
            };
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
                <div className="w-full h-full bg-blue-500 bg-opacity-20 border-4 border-dashed border-blue-500 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-6 shadow-lg">
                        <div className="text-2xl text-blue-600 mb-2">🎯</div>
                        <div className="font-semibold text-gray-900">Drop ingredient here!</div>
                        <div className="text-sm text-gray-600">Add to your snack creation</div>
                    </div>
                </div>
            </Html>
        );
    }

    return null;
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
                updateCamera({ position: [0, 0, 5] });
                break;
            case 'side':
                updateCamera({ position: [5, 0, 0] });
                break;
            case 'top':
                updateCamera({ position: [0, 5, 0] });
                break;
            case 'beauty':
                updateCamera({ position: [3, 4, 5] });
                break;
        }
    };

    return (
        <div className="relative w-full h-full bg-gradient-to-br from-blue-50 to-purple-50">
            {/* 3D Canvas */}
            <Canvas
                shadows
                camera={{
                    position: camera.position,
                    fov: 45,
                    near: 0.1,
                    far: 1000
                }}
                gl={{
                    antialias: true,
                    alpha: true,
                    preserveDrawingBuffer: true
                }}
            >
                <Suspense fallback={<LoadingFallback />}>
                    {/* Lighting */}
                    <ambientLight intensity={0.4} />
                    <directionalLight
                        position={[10, 10, 5]}
                        intensity={1}
                        castShadow
                        shadow-mapSize={[1024, 1024]}
                        shadow-camera-far={50}
                        shadow-camera-left={-10}
                        shadow-camera-right={10}
                        shadow-camera-top={10}
                        shadow-camera-bottom={-10}
                    />
                    <pointLight position={[-10, -10, -5]} intensity={0.3} />

                    {/* Environment and background */}
                    <Environment preset="studio" />

                    {/* Ground shadow */}
                    <ContactShadows
                        opacity={0.3}
                        scale={10}
                        blur={1}
                        far={10}
                        resolution={256}
                        color="#000000"
                    />

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
                        autoRotateSpeed={0.5}
                        enablePan={true}
                        enableZoom={true}
                        enableRotate={true}
                        minDistance={2}
                        maxDistance={20}
                        maxPolarAngle={Math.PI / 1.5}
                    />

                    {/* Drop zone */}
                    <DropZone />

                    {/* Empty state message */}
                    {currentSnack.ingredients.length === 0 && (
                        <Text
                            position={[0, -2, 0]}
                            fontSize={0.3}
                            color="#666666"
                            anchorX="center"
                            anchorY="middle"
                        >
                            Drag ingredients here to start building
                        </Text>
                    )}
                </Suspense>
            </Canvas>

            {/* Control Panel */}
            <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 space-y-2">
                <div className="text-sm font-semibold text-gray-700 mb-2">3D Controls</div>

                {/* Camera angles */}
                <div className="grid grid-cols-2 gap-1">
                    {[
                        { label: 'Front', value: 'front' },
                        { label: 'Side', value: 'side' },
                        { label: 'Top', value: 'top' },
                        { label: 'Beauty', value: 'beauty' }
                    ].map((angle) => (
                        <button
                            key={angle.value}
                            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                            onClick={() => handleCameraAngle(angle.value)}
                        >
                            {angle.label}
                        </button>
                    ))}
                </div>

                {/* Action buttons */}
                <div className="flex gap-1">
                    <button
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                        onClick={() => setAutoRotate(!autoRotate)}
                        title={autoRotate ? 'Pause rotation' : 'Start rotation'}
                    >
                        {autoRotate ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>

                    <button
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                        onClick={handleResetCamera}
                        title="Reset camera"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Info panel */}
            <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
                <div className="text-sm font-semibold text-gray-700 mb-1">
                    {currentSnack.name || 'Custom Snack'}
                </div>
                <div className="text-xs text-gray-600">
                    {currentSnack.ingredients.length} ingredients • {currentSnack.base.type.replace('-', ' ')}
                </div>
                {currentSnack.nutrition && (
                    <div className="text-xs text-gray-600 mt-1">
                        Health Score: {Math.round(currentSnack.nutrition.health_score)}/100
                    </div>
                )}
            </div>

            {/* Instructions overlay for empty state */}
            {currentSnack.ingredients.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white bg-opacity-90 rounded-lg p-6 text-center max-w-md">
                        <div className="text-4xl mb-3">🍫</div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Building Your Snack</h3>
                        <p className="text-gray-600 text-sm">
                            Drag ingredients from the library onto this 3D canvas to start creating your perfect healthy snack!
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}