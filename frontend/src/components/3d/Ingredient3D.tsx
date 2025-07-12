import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import { Ingredient } from '../../types/snack';

interface Ingredient3DProps {
    ingredient: Ingredient;
}

const Ingredient3D: React.FC<Ingredient3DProps> = ({ ingredient }) => {
    const meshRef = useRef<Mesh>(null);

    // Simple animation: rotate the ingredient slowly
    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.01;
        }
    });

    // Position could depend on ingredient or index - placeholder here
    // For now, spread ingredients along x-axis based on amount_g (scaled)
    const positionX = ingredient.amount_g ? ingredient.amount_g / 20 : 0;

    // Map ingredient name/type to a color (basic example)
    const getColor = (name: string) => {
        switch (name.toLowerCase()) {
            case 'oats':
                return 'burlywood';
            case 'dates':
                return 'sienna';
            case 'almonds':
                return 'peru';
            case 'honey':
                return 'goldenrod';
            case 'protein_powder_plant':
                return 'lightgreen';
            default:
                return 'lightgray';
        }
    };

    return (
        <mesh ref={meshRef} position={[positionX, 0, 0]} castShadow receiveShadow>
            <sphereGeometry args={[0.3, 32, 32]} />
            <meshStandardMaterial color={getColor(ingredient.name)} />
        </mesh>
    );
};

export default Ingredient3D;
