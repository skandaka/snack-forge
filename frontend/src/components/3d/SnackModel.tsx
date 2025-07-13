import React, { useMemo } from 'react';
import { useSnackStore } from '../../stores/snackStore';
import { Ingredient as IngredientType } from '../../types/snack';
import { Instance, Instances } from '@react-three/drei';
import * as THREE from 'three';
import { Ingredient3D } from './Ingredient3D';

const Bowl: React.FC = () => {
    const points = [];
    for (let i = 0; i < 10; i++) {
        points.push(new THREE.Vector2(Math.sin(i * 0.2) * 2.5 + 1, (i - 5) * 0.2));
    }
    const geometry = new THREE.LatheGeometry(points, 32);
    const material = new THREE.MeshStandardMaterial({ color: '#c0c0c0', side: THREE.DoubleSide, metalness: 0.2, roughness: 0.3 });
    return <mesh geometry={geometry} material={material} position={[0, -0.5, 0]} rotation={[0, 0, 0]} />;
};

const distributeIngredients = (ingredients: IngredientType[], base: 'bar' | 'ball' | 'bowl') => {
    const totalAmount = ingredients.reduce((sum, ing) => sum + ing.amount_g, 1);
    const allPositions: { name: string, position: THREE.Vector3, rotation: THREE.Euler }[] = [];

    for (const ingredient of ingredients) {
        const count = Math.ceil((ingredient.amount_g / totalAmount) * 200);
        for (let i = 0; i < count; i++) {
            let pos: THREE.Vector3;
            const rotation = new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

            if (base === 'bar') {
                pos = new THREE.Vector3(
                    THREE.MathUtils.lerp(-2, 2, Math.random()),
                    THREE.MathUtils.lerp(-0.5, 0.5, Math.random()),
                    THREE.MathUtils.lerp(-0.75, 0.75, Math.random())
                );
            } else if (base === 'ball') {
                pos = new THREE.Vector3().setFromSphericalCoords(
                    THREE.MathUtils.lerp(0.5, 1.5, Math.random()),
                    Math.acos(1 - 2 * Math.random()),
                    Math.random() * 2 * Math.PI
                );
            } else { // bowl
                const radius = 2.5;
                const angle = Math.random() * Math.PI * 2;
                const r = radius * Math.sqrt(Math.random());
                pos = new THREE.Vector3(
                    r * Math.cos(angle),
                    (Math.random() * 0.5) - 0.8, // This raises the ingredients to sit inside the bowl
                    r * Math.sin(angle)
                );
            }
            allPositions.push({ name: ingredient.name, position: pos, rotation });
        }
    }
    return allPositions;
};

export default function SnackModel({ ingredients }: { ingredients: IngredientType[] }) {
    const snackBase = useSnackStore((state) => state.snackBase);

    const allInstances = useMemo(() => {
        return distributeIngredients(ingredients, snackBase);
    }, [ingredients, snackBase]);

    const groupedInstances = useMemo(() => {
        const groups: Record<string, { position: THREE.Vector3, rotation: THREE.Euler }[]> = {};
        for (const instance of allInstances) {
            if (!groups[instance.name]) {
                groups[instance.name] = [];
            }
            groups[instance.name].push({ position: instance.position, rotation: instance.rotation });
        }
        return groups;
    }, [allInstances]);

    return (
        <group>
            {snackBase === 'bowl' && <Bowl />}
            {Object.entries(groupedInstances).map(([name, instances]) => (
                <Instances key={name} limit={instances.length}>
                    <Ingredient3D name={name} />
                    {instances.map(({ position, rotation }, i) => (
                        <Instance key={i} position={position} rotation={rotation} />
                    ))}
                </Instances>
            ))}
        </group>
    );
}