import { StoreApi } from 'zustand';
import { SnackStore } from '../stores/snackStore';

declare global {
    interface Window {
        useSnackStore?: StoreApi<SnackStore>;
    }
}

export {};