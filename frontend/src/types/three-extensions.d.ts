// src/types/three-extensions.d.ts
declare module 'three/examples/jsm/loaders/GLTFLoader' {
    import { Loader, Group } from 'three';

    export interface GLTF {
        scene: Group;
        scenes: Group[];
        cameras: any[];
        animations: any[];
    }

    export class GLTFLoader extends Loader {
        load(
            url: string,
            onLoad: (gltf: GLTF) => void,
            onProgress?: (event: ProgressEvent) => void,
            onError?: (event: ErrorEvent) => void
        ): void;
    }
}