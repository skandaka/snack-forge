import React, { useMemo } from 'react';
import * as THREE from 'three';

const INGREDIENT_ASSETS: Record<string, { geometry: THREE.BufferGeometry; material: THREE.Material }> = {
    almonds: {
        geometry: new THREE.CapsuleGeometry(0.08, 0.1, 4, 8).scale(1, 1.5, 1),
        material: new THREE.MeshStandardMaterial({ color: '#D2B48C', roughness: 0.7 }),
    },
    walnuts: {
        geometry: new THREE.IcosahedronGeometry(0.18, 1),
        material: new THREE.MeshStandardMaterial({ color: '#8B4513', roughness: 0.8 }),
    },
    dark_chocolate_70: {
        geometry: new THREE.BoxGeometry(0.2, 0.2, 0.2),
        material: new THREE.MeshStandardMaterial({ color: '#3D2B1F', roughness: 0.4, metalness: 0.2 }),
    },
    oats: {
        geometry: new THREE.BoxGeometry(0.25, 0.015, 0.18),
        material: new THREE.MeshStandardMaterial({ color: '#F5DEB3', roughness: 0.9, side: THREE.DoubleSide }),
    },
    cranberries_dried: {
        geometry: new THREE.SphereGeometry(0.13, 16, 16).scale(1, 0.8, 1),
        material: new THREE.MeshPhysicalMaterial({ color: '#990F02', roughness: 0.6, transmission: 0.5, thickness: 0.5 }),
    },
    blueberries_dried: {
        geometry: new THREE.SphereGeometry(0.14, 16, 16),
        material: new THREE.MeshStandardMaterial({ color: '#2C3A61', roughness: 0.5 }),
    },
    protein_powder_plant: {
        geometry: new THREE.SphereGeometry(0.05, 8, 8),
        material: new THREE.MeshStandardMaterial({ color: '#D4CFC3', roughness: 1.0 }),
    },
    honey: {
        geometry: new THREE.SphereGeometry(0.08, 16, 16),
        material: new THREE.MeshPhysicalMaterial({ color: '#FFC300', roughness: 0.1, transmission: 0.9, thickness: 0.8 }),
    },
    maple_syrup: {
        geometry: new THREE.SphereGeometry(0.08, 16, 16),
        material: new THREE.MeshPhysicalMaterial({ color: '#C97F24', roughness: 0.2, transmission: 0.9, thickness: 0.8 }),
    },
    default: {
        geometry: new THREE.SphereGeometry(0.1, 8, 8),
        material: new THREE.MeshStandardMaterial({ color: '#A9A9A9', roughness: 0.5 }),
    }
};

type Ingredient3DProps = {
    name: string;
};

export const Ingredient3D: React.FC<Ingredient3DProps> = ({ name }) => {
    const { geometry, material } = useMemo(() => {
        return INGREDIENT_ASSETS[name] || INGREDIENT_ASSETS.default;
    }, [name]);

    return (
        <>
            <primitive object={geometry} attach="geometry" />
            <primitive object={material} attach="material" />
        </>
    );
};