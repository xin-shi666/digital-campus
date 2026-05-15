import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const loadedModels = new Map();
const loadingPromises = [];

export function loadModel(path, name) {
    if (loadedModels.has(name)) {
        return Promise.resolve(loadedModels.get(name).clone());
    }

    const promise = new Promise((resolve) => {
        loader.load(
            path,
            (gltf) => {
                loadedModels.set(name, gltf.scene);
                resolve(gltf.scene.clone());
            },
            undefined,
            () => {
                console.warn(`模型加载失败: ${path}，将使用基础几何体替代`);
                resolve(null);
            }
        );
    });

    loadingPromises.push(promise);
    return promise;
}

export function getLoadedModel(name) {
    const model = loadedModels.get(name);
    return model ? model.clone() : null;
}

export function waitAllLoaded() {
    return Promise.allSettled(loadingPromises);
}
