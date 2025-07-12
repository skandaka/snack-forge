// src/components/3d/SnackModel.tsx
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Box, Cylinder } from '@react-three/drei';
import { Ingredient } from '../../types/snack';
import * as THREE from 'three';

// Remove GLTFLoader import since we're using basic geometries
// The error was: Cannot find module 'three/examples/jsm/loaders/GLTFLoader'

interface SnackModelProps {
    ingredients: Ingredient[];
    snackType: string;
}

export default function SnackModel({ ingredients, snackType }: SnackModelProps) {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.005;
        }
    });

    const getSnackBase = () => {
        switch (snackType) {
            case 'energy-bar':
                return (
                    <Box args={[2, 0.4, 1]} position={[0, 0, 0]}>
                        <meshStandardMaterial color="#DEB887" />
                    </Box>
                );
            case 'protein-ball':
                return (
                    <Sphere args={[0.8]} position={[0, 0, 0]}>
                        <meshStandardMaterial color="#DEB887" />
                    </Sphere>
                );
            case 'smoothie-bowl':
                return (
                    <Cylinder args={[1, 0.8, 0.5]} position={[0, 0, 0]}>
                        <meshStandardMaterial color="#E6E6FA" />
                    </Cylinder>
                );
            default:
                return (
                    <Box args={[1.5, 0.3, 0.8]} position={[0, 0, 0]}>
                        <meshStandardMaterial color="#DEB887" />
                    </Box>
                );
        }
    };

    const getIngredientModel = (ingredient: Ingredient, index: number) => {
        const position: [number, number, number] = [
            (Math.random() - 0.5) * 1.5,
            0.3 + Math.random() * 0.2,
            (Math.random() - 0.5) * 1.0
        ];

        const name = ingredient.name.toLowerCase();

        if (name.includes('nut') || name.includes('seed')) {
            return (
                <Sphere key={index} args={[0.08]} position={position}>
                    <meshStandardMaterial color="#8B4513" />
                </Sphere>
            );
        } else if (name.includes('chocolate')) {
            return (
                <Box key={index} args={[0.1, 0.05, 0.1]} position={position}>
                    <meshStandardMaterial color="#4A2C2A" />
                </Box>
            );
        } else if (name.includes('berr')) {
            return (
                <Sphere key={index} args={[0.06]} position={position}>
                    <meshStandardMaterial color="#DC143C" />
                </Sphere>
            );
        } else {
            return (
                <Sphere key={index} args={[0.07]} position={position}>
                    <meshStandardMaterial color="#CD853F" />
                </Sphere>
            );
        }
    };

    return (
        <group ref={groupRef}>
            {getSnackBase()}
            {ingredients.map((ingredient, index) => getIngredientModel(ingredient, index))}
        </group>
    );
}