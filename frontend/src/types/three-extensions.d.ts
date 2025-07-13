import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { StoreApi } from 'zustand';
import { SnackStore } from '../stores/snackStore'; // Adjust path if needed

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

// Add this to declare the global property for your Zustand store
declare global {
    interface Window {
        useSnackStore: StoreApi<SnackStore>;
    }
}