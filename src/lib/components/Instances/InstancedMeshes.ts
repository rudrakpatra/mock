import { InstancedMesh2 } from '@three.ez/instanced-mesh';
import * as T from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { renderer, scene } from '../T';
export class InstancedGLTF<T> {
    count: number;
    im2s: InstancedMesh2<T>[] = [];
    constructor(count = 100) {
        this.count = count;
    }

    async load(path: string, f: (gltf: GLTF) => T.Mesh<T.BufferGeometry, T.MeshBasicMaterial>[]) {
        const gltf = await new GLTFLoader().loadAsync(path);
        const afterF = f(gltf);
        this.im2s = afterF.map((child) => {
            const geometry = child.geometry;
            const material = child.material;
            const im2 = new InstancedMesh2<T>(renderer, 1000, geometry, material);
            im2.createInstances((obj, index) => {
                obj.visible = false;
            });
            scene.add(im2);
            return im2;
        });
    }
    update(indices: number[], updater: (obj: T, index: number) => void) {
        this.im2s.forEach((im2) => {
            for (let i = 0; i < this.count; i++) {
                im2.instances[i].visible = indices.includes(i);
                if (im2.instances[i].visible)
                    updater(im2.instances[i], i);
            }
        });
    }

}