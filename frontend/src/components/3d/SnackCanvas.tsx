import React, { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';

import { useSnackStore } from '../../stores/snackStore';
import SnackModel from './SnackModel';
import Ingredient3D from './Ingredient3D';

const SnackCanvas: React.FC = () => {
    const currentSnack = useSnackStore((state) => state.currentSnack);
    const setCameraAngle = useSnackStore((state) => state.setCameraAngle);
    const camera = useSnackStore((state) => state.camera);
    const triggerAnimation = useSnackStore((state) => state.triggerAnimation);

    useEffect(() => {
        setCameraAngle('default');
        triggerAnimation('ingredient-add');
    }, [currentSnack, setCameraAngle, triggerAnimation]);

    return (
        <div style={{ width: '100%', height: '100vh' }}>
            <Canvas
                camera={{ position: camera.position as [number, number, number], fov: 45 }}
                shadows
            >
                <ambientLight intensity={0.5} />
                <directionalLight
                    castShadow
                    position={[10, 10, 10]}
                    intensity={1}
                    shadow-mapSize-width={1024}
                    shadow-mapSize-height={1024}
                />

                <SnackModel baseType={currentSnack.base.type} />

                {currentSnack.ingredients.map((ingredient) => (
                    <Ingredient3D key={ingredient.name} ingredient={ingredient} />
                ))}

                <OrbitControls enableZoom />
                <Environment preset="city" />
            </Canvas>
        </div>
    );
};

export default SnackCanvas;
