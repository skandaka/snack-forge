// src/components/3d/SnackCanvas.tsx
'use client';

import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
    OrbitControls,
    Environment,
    ContactShadows,
    Grid,
    GizmoHelper,
    GizmoViewport,
    PerspectiveCamera,
    Html,
    useHelper,
    Box,
    Sphere,
    Cylinder,
    Plane
} from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import {
    RotateCcw,
    ZoomIn,
    ZoomOut,
    Camera,
    Grid3X3,
    Sun,
    Moon,
    Eye,
    Target,
    Move3D,
    RotateCw
} from 'lucide-react';

import { useSnackStore } from '../../stores/snackStore';
import SnackModel from './SnackModel';

// Loading fallback component
const LoadingFallback: React.FC = () => (
    <Html center>
        <div className="flex flex-col items-center justify-center p-8">
            <div className="loading-spinner mb-4" />
            <div className="text-[var(--text-primary)] font-medium">Loading 3D Scene...</div>
            <div className="text-[var(--text-muted)] text-sm mt-1">Preparing your workspace</div>
        </div>
    </Html>
);

// Grid component for professional look
const SceneGrid: React.FC<{ visible: boolean }> = ({ visible }) => {
    if (!visible) return null;

    return (
        <Grid
            args={[20, 20]}
            position={[0, -1, 0]}
            cellSize={1}
            cellThickness={0.5}
            cellColor="#404040"
            sectionSize={5}
            sectionThickness={1}
            sectionColor="#606060"
            fadeDistance={30}
            fadeStrength={1}
        />
    );
};

// Camera controller
const CameraController: React.FC = () => {
    const { camera } = useThree();
    const { camera: cameraState } = useSnackStore();

    useEffect(() => {
        if (cameraState.position) {
            camera.position.set(...cameraState.position);
        }
        if (cameraState.target) {
            camera.lookAt(new THREE.Vector3(...cameraState.target));
        }
    }, [camera, cameraState]);

    return null;
};

// Lighting setup for professional look
const SceneLighting: React.FC<{ preset: 'studio' | 'outdoor' | 'dramatic' }> = ({ preset }) => {
    const directionalRef = useRef<THREE.DirectionalLight>(null);

    // Optional: Add light helper for debugging
    // useHelper(directionalRef, THREE.DirectionalLightHelper, 1);

    switch (preset) {
        case 'studio':
            return (
                <>
                    <ambientLight intensity={0.4} color="#ffffff" />
                    <directionalLight
                        ref={directionalRef}
                        position={[10, 10, 5]}
                        intensity={1.2}
                        castShadow
                        shadow-mapSize={[2048, 2048]}
                        shadow-camera-far={50}
                        shadow-camera-left={-10}
                        shadow-camera-right={10}
                        shadow-camera-top={10}
                        shadow-camera-bottom={-10}
                        color="#fff8e1"
                    />
                    <pointLight position={[-5, 5, -5]} intensity={0.6} color="#e3f2fd" />
                    <spotLight
                        position={[0, 15, 0]}
                        angle={0.3}
                        penumbra={0.5}
                        intensity={0.4}
                        castShadow
                        color="#fff3e0"
                    />
                </>
            );

        case 'outdoor':
            return (
                <>
                    <ambientLight intensity={0.6} color="#87ceeb" />
                    <directionalLight
                        position={[15, 20, 10]}
                        intensity={1.5}
                        castShadow
                        color="#ffeaa7"
                    />
                </>
            );

        case 'dramatic':
            return (
                <>
                    <ambientLight intensity={0.2} color="#ffffff" />
                    <directionalLight
                        position={[5, 10, 2]}
                        intensity={2}
                        castShadow
                        color="#ff7675"
                    />
                    <pointLight position={[-8, 3, -8]} intensity={1} color="#74b9ff" />
                </>
            );

        default:
            return (
                <>
                    <ambientLight intensity={0.4} />
                    <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
                </>
            );
    }
};

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

        const handleDrop = (e: DragEvent) => {
            e.preventDefault();
            setIsDragOver(false);

            const data = e.dataTransfer?.getData('application/json');
            if (data) {
                try {
                    const ingredientData = JSON.parse(data);
                    addIngredient(ingredientData);
                } catch (error) {
                    console.error('Failed to parse dropped ingredient data:', error);
                }
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
                    className="w-full h-full bg-[var(--accent-blue)] bg-opacity-10 border-4 border-dashed border-[var(--accent-blue)] flex items-center justify-center backdrop-blur-sm"
                >
                    <div className="panel p-8 text-center border border-[var(--accent-blue)]">
                        <Target className="w-12 h-12 text-[var(--accent-blue)] mx-auto mb-4" />
                        <div className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                            Drop Ingredient Here!
                        </div>
                        <div className="text-[var(--text-secondary)]">
                            Add to your snack creation
                        </div>
                    </div>
                </motion.div>
            </Html>
        );
    }

    return null;
};

// Empty state component
const EmptyState: React.FC = () => (
    <Html center>
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="panel p-8 text-center max-w-md"
        >
            <div className="text-6xl mb-4">🍪</div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">
                Start Building Your Snack
            </h3>
            <p className="text-[var(--text-secondary)] mb-6">
                Drag ingredients from the library onto this canvas to create your perfect healthy snack.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-[var(--text-muted)]">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[var(--accent-blue)] rounded-full" />
                    <span>Drag & Drop</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[var(--accent-green)] rounded-full" />
                    <span>Real-time Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[var(--accent-purple)] rounded-full" />
                    <span>AI Coaching</span>
                </div>
            </div>
        </motion.div>
    </Html>
);

// Viewport controls
const ViewportControls: React.FC = () => {
    const [lightingPreset, setLightingPreset] = useState<'studio' | 'outdoor' | 'dramatic'>('studio');
    const [showGrid, setShowGrid] = useState(true);
    const [cameraMode, setCameraMode] = useState<'perspective' | 'orthographic'>('perspective');
    const { updateCamera } = useSnackStore();

    const resetCamera = () => {
        updateCamera({
            position: [5, 5, 5],
            target: [0, 0, 0],
            zoom: 1
        });
    };

    const setCameraView = (view: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom') => {
        const positions = {
            front: [0, 0, 8],
            back: [0, 0, -8],
            left: [-8, 0, 0],
            right: [8, 0, 0],
            top: [0, 8, 0],
            bottom: [0, -8, 0]
        };

        updateCamera({
            position: positions[view] as [number, number, number],
            target: [0, 0, 0]
        });
    };

    return (
        <div className="absolute top-4 right-4 z-10">
            <div className="panel p-2">
                <div className="grid grid-cols-2 gap-2">
                    {/* Camera Controls */}
                    <button
                        onClick={resetCamera}
                        className="btn btn-ghost btn-icon"
                        title="Reset Camera"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => setShowGrid(!showGrid)}
                        className={`btn btn-icon ${showGrid ? 'btn-secondary' : 'btn-ghost'}`}
                        title="Toggle Grid"
                    >
                        <Grid3X3 className="w-4 h-4" />
                    </button>

                    {/* Lighting Presets */}
                    <button
                        onClick={() => setLightingPreset(lightingPreset === 'studio' ? 'outdoor' : 'studio')}
                        className="btn btn-ghost btn-icon"
                        title="Toggle Lighting"
                    >
                        {lightingPreset === 'studio' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>

                    <button
                        onClick={() => setCameraMode(cameraMode === 'perspective' ? 'orthographic' : 'perspective')}
                        className="btn btn-ghost btn-icon"
                        title="Camera Mode"
                    >
                        <Camera className="w-4 h-4" />
                    </button>
                </div>

                {/* Quick Camera Views */}
                <div className="mt-2 pt-2 border-t border-[var(--border-color)]">
                    <div className="text-xs text-[var(--text-muted)] mb-1">Quick Views</div>
                    <div className="grid grid-cols-3 gap-1">
                        {['front', 'top', 'right'].map((view) => (
                            <button
                                key={view}
                                onClick={() => setCameraView(view as any)}
                                className="btn btn-ghost text-xs px-2 py-1"
                            >
                                {view}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Performance monitor (optional)
const PerformanceMonitor: React.FC = () => {
    const [fps, setFps] = useState(60);

    useFrame(() => {
        // Simple FPS calculation
        const now = performance.now();
        const delta = now - (PerformanceMonitor as any).lastTime || 0;
        (PerformanceMonitor as any).lastTime = now;

        if (delta > 0) {
            const currentFps = 1000 / delta;
            setFps(Math.round(currentFps));
        }
    });

    return (
        <div className="absolute top-4 left-4 z-10">
            <div className="panel p-2">
                <div className="text-xs text-[var(--text-muted)]">
                    <div>FPS: <span className="text-[var(--text-primary)]">{fps}</span></div>
                    <div className="flex items-center gap-1 mt-1">
                        <div className="w-2 h-2 bg-[var(--accent-green)] rounded-full" />
                        <span>3D Renderer</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main SnackCanvas component
export default function SnackCanvas() {
    const { currentSnack, ui } = useSnackStore();
    const [lightingPreset, setLightingPreset] = useState<'studio' | 'outdoor' | 'dramatic'>('studio');
    const [showGrid, setShowGrid] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    const hasIngredients = currentSnack.ingredients.length > 0;

    useEffect(() => {
        // Simulate loading time
        const timer = setTimeout(() => setIsLoading(false), 1000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="w-full h-full relative bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] rounded-lg overflow-hidden">
            {/* Performance Monitor */}
            <PerformanceMonitor />

            {/* Viewport Controls */}
            <ViewportControls />

            {/* 3D Canvas */}
            <Canvas
                shadows
                camera={{
                    position: [5, 5, 5],
                    fov: 50,
                    near: 0.1,
                    far: 1000
                }}
                gl={{
                    antialias: true,
                    alpha: false,
                    powerPreference: "high-performance",
                    preserveDrawingBuffer: true
                }}
                dpr={[1, 2]}
            >
                <Suspense fallback={<LoadingFallback />}>
                    {/* Lighting */}
                    <SceneLighting preset={lightingPreset} />

                    {/* Environment */}
                    <Environment preset="studio" background={false} />

                    {/* Grid */}
                    <SceneGrid visible={showGrid} />

                    {/* Ground plane */}
                    <Plane
                        args={[50, 50]}
                        rotation={[-Math.PI / 2, 0, 0]}
                        position={[0, -1.01, 0]}
                        receiveShadow
                    >
                        <meshStandardMaterial
                            color="#1a1a1a"
                            transparent
                            opacity={0.1}
                        />
                    </Plane>

                    {/* Contact Shadows */}
                    <ContactShadows
                        opacity={0.5}
                        scale={20}
                        blur={2}
                        far={20}
                        resolution={512}
                        color="#000000"
                        position={[0, -1, 0]}
                    />

                    {/* Camera Controller */}
                    <CameraController />

                    {/* Main snack model */}
                    {hasIngredients ? (
                        <SnackModel
                            ingredients={currentSnack.ingredients}
                            snackType={currentSnack.base.type}
                        />
                    ) : (
                        <EmptyState />
                    )}

                    {/* Controls */}
                    <OrbitControls
                        enablePan={true}
                        enableZoom={true}
                        enableRotate={true}
                        minDistance={2}
                        maxDistance={20}
                        maxPolarAngle={Math.PI / 2.1}
                        dampingFactor={0.05}
                        enableDamping={true}
                        autoRotate={false}
                        autoRotateSpeed={0.5}
                    />

                    {/* Gizmo Helper */}
                    <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
                        <GizmoViewport
                            axisColors={['#ff4757', '#2ed573', '#3742fa']}
                            labelColor="white"
                        />
                    </GizmoHelper>

                    {/* Drop zone */}
                    <DropZone />

                    {/* Loading overlay in 3D space */}
                    {ui.isLoading && (
                        <Html center>
                            <div className="panel p-6 text-center">
                                <div className="loading-spinner mb-3" />
                                <div className="text-[var(--text-primary)] font-medium">
                                    Calculating nutrition...
                                </div>
                            </div>
                        </Html>
                    )}

                </Suspense>
            </Canvas>

            {/* Loading Overlay */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-[var(--bg-primary)] flex items-center justify-center z-50"
                    >
                        <div className="text-center">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="w-16 h-16 border-4 border-[var(--border-color)] border-t-[var(--accent-blue)] rounded-full mx-auto mb-6"
                            />
                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                                Initializing 3D Workspace
                            </h3>
                            <p className="text-[var(--text-secondary)]">
                                Setting up your professional snack design environment...
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stats Overlay */}
            {hasIngredients && currentSnack.nutrition && (
                <div className="absolute bottom-4 right-4 z-10">
                    <div className="panel p-3">
                        <div className="text-xs text-[var(--text-muted)] mb-2">Quick Stats</div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="text-center">
                                <div className="text-lg font-bold text-[var(--accent-green)]">
                                    {Math.round(currentSnack.nutrition.health_score)}
                                </div>
                                <div className="text-xs text-[var(--text-muted)]">Health</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold text-[var(--accent-blue)]">
                                    {Math.round(currentSnack.nutrition.nutrition_per_serving.calories_per_100g)}
                                </div>
                                <div className="text-xs text-[var(--text-muted)]">Calories</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold text-[var(--accent-orange)]">
                                    {currentSnack.nutrition.nutrition_per_100g.protein_g.toFixed(1)}g
                                </div>
                                <div className="text-xs text-[var(--text-muted)]">Protein</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold text-[var(--accent-purple)]">
                                    {currentSnack.nutrition.nutrition_per_100g.fiber_g.toFixed(1)}g
                                </div>
                                <div className="text-xs text-[var(--text-muted)]">Fiber</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Instructions for empty state */}
            {!hasIngredients && !isLoading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-md"
                    >
                        <div className="text-8xl mb-6 opacity-20">
                            🥗
                        </div>
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                            Welcome to SnackSmith
                        </h2>
                        <p className="text-[var(--text-secondary)] leading-relaxed">
                            Create your perfect healthy snack in this professional 3D environment.
                            Drag ingredients from the library to start building.
                        </p>

                        <div className="mt-8 flex items-center justify-center gap-6 text-sm">
                            <div className="flex items-center gap-2 text-[var(--text-muted)]">
                                <Move3D className="w-4 h-4" />
                                <span>Drag & Drop</span>
                            </div>
                            <div className="flex items-center gap-2 text-[var(--text-muted)]">
                                <RotateCw className="w-4 h-4" />
                                <span>3D Interaction</span>
                            </div>
                            <div className="flex items-center gap-2 text-[var(--text-muted)]">
                                <Eye className="w-4 h-4" />
                                <span>Real-time Preview</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Error State */}
            {ui.error && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                    <div className="panel p-6 border-l-4 border-l-[var(--accent-red)] max-w-md">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 bg-[var(--accent-red)] rounded-full flex items-center justify-center">
                                <span className="text-white text-sm">!</span>
                            </div>
                            <div>
                                <div className="font-bold text-[var(--text-primary)]">Error</div>
                                <div className="text-sm text-[var(--text-secondary)]">{ui.error}</div>
                            </div>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="btn btn-secondary text-sm w-full"
                        >
                            Reload Application
                        </button>
                    </div>
                </div>
            )}

            {/* Render Info */}
            <div className="absolute bottom-4 left-4 z-10">
                <div className="panel p-2">
                    <div className="text-xs text-[var(--text-muted)]">
                        <div>WebGL Renderer</div>
                        <div className="flex items-center gap-1 mt-1">
                            <div className={`w-2 h-2 rounded-full ${
                                hasIngredients ? 'bg-[var(--accent-green)]' : 'bg-[var(--accent-orange)]'
                            }`} />
                            <span>{hasIngredients ? 'Active' : 'Standby'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}