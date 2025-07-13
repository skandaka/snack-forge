import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import SnackModel from './SnackModel';
import { Ingredient as StoreIngredient } from '../../types/snack';

interface SnackCanvasProps {
    ingredients?: StoreIngredient[];
    className?: string;
    autoRotate?: boolean;
}

const Lighting: React.FC = () => {
    return (
        <>
            <ambientLight intensity={0.2} />
            <directionalLight
                position={[5, 10, 5]}
                intensity={1}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
            />
            <directionalLight position={[-5, 5, -10]} intensity={0.3} color="#a0b0ff" />
        </>
    );
};

const SnackCanvas: React.FC<SnackCanvasProps> = ({
                                                     ingredients = [],
                                                     className = '',
                                                     autoRotate = false,
                                                 }) => {

    return (
        <div className={`w-full h-full min-h-[400px] relative ${className} bg-[#181818]`}>
            <Canvas
                shadows
                camera={{ position: [0, 2, 8], fov: 50 }}
                gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
            >
                <Suspense fallback={null}>
                    <Lighting />
                    <Environment preset="city" />

                    <group position={[0, 0.75, 0]}>
                        <SnackModel ingredients={ingredients} />
                    </group>

                    <ContactShadows position={[0, -2.0, 0]} opacity={0.5} scale={20} blur={1.5} far={2.0} />

                    <Grid
                        position={[0, -2.01, 0]}
                        args={[20, 20]}
                        cellSize={1}
                        cellThickness={1}
                        cellColor="#404040"
                        sectionSize={5}
                        sectionThickness={1.5}
                        sectionColor="#606060"
                        fadeDistance={30}
                        fadeStrength={1}
                        infiniteGrid
                    />

                    <OrbitControls
                        autoRotate={autoRotate}
                        autoRotateSpeed={0.5}
                        enablePan={false}
                        minDistance={3}
                        maxDistance={15}
                        minPolarAngle={Math.PI / 4}
                        maxPolarAngle={Math.PI / 2}
                        target={[0, 0, 0]}
                    />
                </Suspense>
            </Canvas>
        </div>
    );
};

export default SnackCanvas;