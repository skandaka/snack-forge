import React, { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
    OrbitControls,
    Environment,
    Text,
    Html,
    Stats,
    Grid,
    Sky,
    ContactShadows,
    Stage,
    PresentationControls,
    Float,
    Sparkles,
    Effects
} from '@react-three/drei';
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
    Palette,
    ChevronDown,
    Info,
    X
} from 'lucide-react';
// Install with: npm install @react-three/postprocessing --legacy-peer-deps
import { EffectComposer, Bloom, DepthOfField, Noise, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import SnackModel from './SnackModel';

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

interface SnackCanvasProps {
    ingredients: Ingredient[];
    className?: string;
    enableControls?: boolean;
    showLabels?: boolean;
    animationSpeed?: number;
    interactionMode?: 'orbit' | 'inspect' | 'build' | 'presentation';
    onIngredientClick?: (ingredient: Ingredient, index: number) => void;
    onIngredientHover?: (ingredient: Ingredient | null, index?: number) => void;
    containerShape?: 'box' | 'ball' | 'bar' | 'custom';
    showNutritionVisualization?: boolean;
    theme?: 'realistic' | 'abstract' | 'minimal' | 'premium' | 'playful';
    qualityLevel?: 'low' | 'medium' | 'high' | 'ultra';
    lightingPreset?: 'studio' | 'sunset' | 'dawn' | 'night' | 'warehouse' | 'city' | 'forest';
    enablePostProcessing?: boolean;
    showEnvironment?: boolean;
    enablePhysics?: boolean;
    autoRotate?: boolean;
    backgroundColor?: string;
    showGrid?: boolean;
    showStats?: boolean;
    cameraPosition?: [number, number, number];
    cameraTarget?: [number, number, number];
    fieldOfView?: number;
    enableShadows?: boolean;
    shadowIntensity?: number;
    enableParticles?: boolean;
    particleCount?: number;
    enableGlow?: boolean;
    responsive?: boolean;
    performanceMode?: boolean;
    debugMode?: boolean;
}

// Loading component
const LoadingSpinner: React.FC = () => (
    <Html center>
        <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-sm text-gray-600">Loading 3D model...</p>
        </div>
    </Html>
);

// Performance monitor component
const PerformanceMonitor: React.FC<{ onPerformanceChange: (fps: number) => void }> = ({
                                                                                          onPerformanceChange
                                                                                      }) => {
    const { gl } = useThree();
    const frameCount = useRef(0);
    const lastTime = useRef(Date.now());

    useFrame(() => {
        frameCount.current++;
        const now = Date.now();

        if (now - lastTime.current >= 1000) {
            const fps = (frameCount.current * 1000) / (now - lastTime.current);
            onPerformanceChange(fps);
            frameCount.current = 0;
            lastTime.current = now;
        }
    });

    return null;
};

// Lighting setup component
const LightingRig: React.FC<{
    preset: string;
    theme: string;
    enableShadows: boolean;
    shadowIntensity: number;
}> = ({ preset, theme, enableShadows, shadowIntensity }) => {
    const lightConfig = useMemo(() => {
        const configs = {
            studio: {
                ambient: { intensity: 0.4, color: '#ffffff' },
                directional: { intensity: 1, position: [10, 10, 5] as [number, number, number], color: '#ffffff' },
                point: { intensity: 0.5, position: [-10, -10, -10] as [number, number, number], color: '#ffffff' },
                spot: { intensity: 0.8, position: [0, 10, 0] as [number, number, number], color: '#ffffff' }
            },
            // Rest of configs remain the same with proper type annotations
        };

        return configs[preset as keyof typeof configs] || configs.studio;
    }, [preset]);

    return (
        <>
            <ambientLight
                intensity={lightConfig.ambient.intensity}
                color={lightConfig.ambient.color}
            />
            <directionalLight
                intensity={lightConfig.directional.intensity}
                position={new THREE.Vector3(...lightConfig.directional.position)}
                color={lightConfig.directional.color}
                castShadow={enableShadows}
                shadow-mapSize-width={enableShadows ? 2048 : 512}
                shadow-mapSize-height={enableShadows ? 2048 : 512}
                shadow-camera-far={50}
                shadow-camera-left={-10}
                shadow-camera-right={10}
                shadow-camera-top={10}
                shadow-camera-bottom={-10}
                shadow-bias={-0.0001}
                shadow-normalBias={0.02}
            />
            <pointLight
                intensity={lightConfig.point.intensity * shadowIntensity}
                position={new THREE.Vector3(...lightConfig.point.position)}
                color={lightConfig.point.color}
                castShadow={enableShadows}
            />
            <spotLight
                intensity={lightConfig.spot.intensity}
                position={new THREE.Vector3(...lightConfig.spot.position)}
                color={lightConfig.spot.color}
                angle={0.3}
                penumbra={1}
                castShadow={enableShadows}
            />
        </>
    );
};

// Environment component
const EnvironmentSetup: React.FC<{
    preset: string;
    theme: string;
    showGrid: boolean;
    enableShadows: boolean;
}> = ({ preset, theme, showGrid, enableShadows }) => {
    return (
        <>
            {/* Environment mapping */}
            <Environment preset={preset as any} background={theme === 'realistic'} />

            {/* Sky for outdoor presets */}
            {['sunset', 'dawn', 'city', 'forest'].includes(preset) && (
                <Sky
                    distance={450000}
                    sunPosition={[0, 1, 0]}
                    inclination={0.6}
                    azimuth={0.1}
                />
            )}

            {/* Grid */}
            {showGrid && (
                <Grid
                    position={[0, -2.9, 0]}
                    args={[20, 20]}
                    cellSize={1}
                    cellThickness={1}
                    cellColor="#bbbbbb"
                    fadeDistance={20}
                    fadeStrength={1}
                />
            )}

            {/* Contact shadows */}
            {enableShadows && (
                <ContactShadows
                    position={new THREE.Vector3(0, -2.8, 0)}
                    opacity={0.4}
                    scale={20}
                    blur={2}
                    far={4}
                />
            )}
        </>
    );
};

// Particle effects component
const ParticleEffects: React.FC<{
    count: number;
    theme: string;
    ingredients: Ingredient[];
}> = ({ count, theme, ingredients }) => {
    const sparkleColors = useMemo(() => {
        if (theme === 'playful') return ['#ff6b6b', '#4ecdc4', '#45b7d1', '#ffa726', '#ab47bc'];
        if (theme === 'premium') return ['#ffd700', '#e6e6e6', '#b8860b'];
        return ['#ffffff', '#f0f0f0', '#e0e0e0'];
    }, [theme]);

    if (theme === 'minimal' || count === 0) return null;

    return (
        <Sparkles
            count={count}
            scale={[15, 15, 15]}
            size={theme === 'playful' ? 6 : 3}
            speed={0.4}
            color={sparkleColors[0]}
            noise={1}
        />
    );
};

// Post-processing effects
const PostProcessingEffects: React.FC<{
    enabled: boolean;
    theme: 'realistic' | 'abstract' | 'minimal' | 'premium' | 'playful';
    qualityLevel: 'low' | 'medium' | 'high' | 'ultra';
}> = ({ enabled, theme, qualityLevel }) => {
    if (!enabled) return null;

    const intensity = qualityLevel === 'ultra' ? 1 : qualityLevel === 'high' ? 0.8 : 0.6;

    return (
        <Effects>
            <EffectComposer>
                {/* Fix conditional rendering by providing non-boolean default */}
                {theme === 'premium' ? (
                    <>
                        <Bloom
                            luminanceThreshold={0.2}
                            luminanceSmoothing={0.9}
                            intensity={intensity * 1.5}
                        />
                        <DepthOfField
                            focusDistance={0}
                            focalLength={0.02}
                            bokehScale={3}
                        />
                    </>
                ) : null}

                {theme === 'playful' ? (
                    <>
                        <Bloom
                            luminanceThreshold={0.3}
                            luminanceSmoothing={0.7}
                            intensity={intensity}
                        />
                        <Noise opacity={0.05} />
                    </>
                ) : null}

                {theme === 'realistic' ? (
                    <>
                        <Bloom
                            luminanceThreshold={0.4}
                            luminanceSmoothing={0.4}
                            intensity={intensity * 0.6}
                        />
                        <Vignette
                            offset={0.5}
                            darkness={0.5}
                            eskil={false}
                        />
                    </>
                ) : null}
            </EffectComposer>
        </Effects>
    );
};

// Camera controller
const CameraController: React.FC<{
    position: [number, number, number];
    target: [number, number, number];
    autoRotate: boolean;
    enableControls: boolean;
    interactionMode: string;
}> = ({ position, target, autoRotate, enableControls, interactionMode }) => {
    const { camera } = useThree();

    useEffect(() => {
        // Fix Vector3 error by using Vector3 constructor
        camera.position.set(position[0], position[1], position[2]);
        camera.lookAt(target[0], target[1], target[2]);
    }, [camera, position, target]);

    if (interactionMode === 'presentation') {
        return (
            <PresentationControls
                global
                cursor={true}
                snap={true}
                speed={1}
                zoom={0.8}
                rotation={[0.13, 0.1, 0]}
                polar={[-Math.PI / 3, Math.PI / 3]}
                azimuth={[-Math.PI / 1.4, Math.PI / 2]}
            >
                <Float
                    speed={autoRotate ? 2 : 1}
                    rotationIntensity={autoRotate ? 0.5 : 0.2}
                    floatIntensity={0.2}
                />
            </PresentationControls>
        );
    }

    return (
        <OrbitControls
            enabled={enableControls}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            autoRotate={autoRotate}
            autoRotateSpeed={2}
            minDistance={3}
            maxDistance={20}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI - Math.PI / 6}
            target={new THREE.Vector3(target[0], target[1], target[2])}
            dampingFactor={0.05}
            enableDamping={true}
        />
    );
};

// Main SnackCanvas component
const SnackCanvas: React.FC<SnackCanvasProps> = ({
                                                     ingredients,
                                                     className = '',
                                                     enableControls = true,
                                                     showLabels = true,
                                                     animationSpeed = 1,
                                                     interactionMode = 'orbit',
                                                     onIngredientClick,
                                                     onIngredientHover,
                                                     containerShape = 'box',
                                                     showNutritionVisualization = false,
                                                     theme = 'realistic',
                                                     qualityLevel = 'medium',
                                                     lightingPreset = 'studio',
                                                     enablePostProcessing = false,
                                                     showEnvironment = true,
                                                     enablePhysics = false,
                                                     autoRotate = false,
                                                     backgroundColor,
                                                     showGrid = false,
                                                     showStats = false,
                                                     cameraPosition = [5, 5, 5],
                                                     cameraTarget = [0, 0, 0],
                                                     fieldOfView = 75,
                                                     enableShadows = true,
                                                     shadowIntensity = 1,
                                                     enableParticles = false,
                                                     particleCount = 50,
                                                     enableGlow = false,
                                                     responsive = true,
                                                     performanceMode = false,
                                                     debugMode = false
                                                 }) => {
    const [currentFps, setCurrentFps] = useState(60);
    const [adaptiveQuality, setAdaptiveQuality] = useState(qualityLevel);
    const [error, setError] = useState<Error | null>(null);

    return (
        <div className={`w-full h-full min-h-[400px] ${className}`}>
            <Canvas
                camera={{
                    position: new THREE.Vector3(cameraPosition[0], cameraPosition[1], cameraPosition[2]),
                    fov: fieldOfView,
                    near: 0.1,
                    far: 1000
                }}
                shadows={enableShadows}
            >
                <Suspense fallback={<LoadingSpinner />}>
                    {/* Performance monitoring */}
                    <PerformanceMonitor onPerformanceChange={setCurrentFps} />

                    {/* Lighting */}
                    <LightingRig
                        preset={lightingPreset}
                        theme={theme}
                        enableShadows={enableShadows}
                        shadowIntensity={shadowIntensity}
                    />

                    {/* Environment */}
                    {showEnvironment && (
                        <EnvironmentSetup
                            preset={lightingPreset}
                            theme={theme}
                            showGrid={showGrid}
                            enableShadows={enableShadows}
                        />
                    )}

                    {/* Particle effects */}
                    {enableParticles && (
                        <ParticleEffects
                            count={particleCount}
                            theme={theme}
                            ingredients={ingredients}
                        />
                    )}

                    {/* Main snack model */}
                    <SnackModel
                        ingredients={ingredients}
                        containerShape={containerShape}
                        animationSpeed={animationSpeed}
                        showLabels={showLabels}
                        onIngredientClick={onIngredientClick}
                        onIngredientHover={onIngredientHover}
                        showNutritionVisualization={showNutritionVisualization}
                        theme={theme as "realistic" | "abstract" | "minimal"}
                        qualityLevel={qualityLevel as "low" | "medium" | "high"}
                        enablePhysics={enablePhysics}
                    />

                    {/* Camera controls */}
                    <CameraController
                        position={cameraPosition}
                        target={cameraTarget}
                        autoRotate={autoRotate}
                        enableControls={enableControls}
                        interactionMode={interactionMode}
                    />

                    {/* Post-processing effects */}
                    {enablePostProcessing && (
                        <PostProcessingEffects
                            enabled={enablePostProcessing}
                            theme={theme}
                            qualityLevel={qualityLevel}
                        />
                    )}

                    {/* Stats display */}
                    {showStats && <Stats />}
                </Suspense>
            </Canvas>
        </div>
    );
};

export default SnackCanvas;