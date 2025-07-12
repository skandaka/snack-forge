// frontend/src/components/3d/SnackModel.tsx

import React, { useMemo } from 'react';
import { useSnackStore } from '../../stores/snackStore';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

import { Group } from 'three';

interface ModelProps {
    modelPath: string;
    position?: [number, number, number];
    scale?: [number, number, number];
    rotation?: [number, number, number];
}

const Model: React.FC<ModelProps> = ({ modelPath, position = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0] }) => {
    const gltf = useLoader(GLTFLoader, modelPath);

    return (
        <primitive
            object={gltf.scene}
            position={position}
            scale={scale}
            rotation={rotation}
            dispose={null}
        />
    );
};

const SnackModel: React.FC = () => {
    const currentSnack = useSnackStore(state => state.currentSnack);

    // Base model path mapping based on snack base type
    const baseModelMap: Record<string, string> = {
        'energy-bar': '/models/energy_bar.glb',
        'protein-ball': '/models/protein_ball.glb',
        'granola-cluster': '/models/granola_cluster.glb',
        // Add more mappings as needed
    };

    // Ingredient model paths map (example)
    const ingredientModelMap: Record<string, string> = {
        oats: '/models/oats.glb',
        dates: '/models/dates.glb',
        almonds: '/models/almonds.glb',
        honey: '/models/honey.glb',
        protein_powder_plant: '/models/protein_powder_plant.glb',
        // Add more as needed
    };

    const baseModelPath = baseModelMap[currentSnack.base.type] || '/models/default_base.glb';

    // For simplicity, position ingredients on the base in a line with some offset
    // You can expand this logic later for better 3D arrangement or layering
    const ingredientPositions = useMemo(() => {
        return currentSnack.ingredients.map((_, idx) => [idx * 0.3 - (currentSnack.ingredients.length / 2) * 0.3, 0.1, 0]);
    }, [currentSnack.ingredients.length]);

    return (
        <group>
            {/* Base Model */}
            <Model modelPath={baseModelPath} scale={[1, 1, 1]} />

            {/* Ingredients Models */}
            {currentSnack.ingredients.map((ingredient, idx) => {
                const modelPath = ingredientModelMap[ingredient.name];
                if (!modelPath) return null; // Skip if no model available

                return (
                    <Model
                        key={ingredient.name}
                        modelPath={modelPath}
                        position={ingredientPositions[idx]}
                        scale={[0.15, 0.15, 0.15]}
                    />
                );
            })}
        </group>
    );
};

export default SnackModel;
