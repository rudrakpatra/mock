<script module lang="ts">
	import * as T from 'three';
	import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
	import { gameState, type Motion } from '../GameState.svelte';
	import { InstancedMesh2 } from '@three.ez/instanced-mesh';
	import { renderer, scene } from '../T';
	export type Loots = {};
	export const loots = async () => {
		const gltf = await new GLTFLoader().loadAsync('/gltfs/Loot.glb');
		const mesh = gltf.scene.children as T.Mesh<T.BufferGeometry, T.MeshBasicMaterial>[];

		return mesh.map((child) => {
			const geometry = child.geometry;
			const material = child.material;
			const im2 = new InstancedMesh2<Loots>(renderer, 500, geometry, material);
			im2.createInstances((obj, index) => {
				obj.visible = false;
			});
			scene.add(im2);
			return im2;
		});
	};
</script>

<script lang="ts">
	type props = {
		loots: InstancedMesh2<
			Loots,
			T.BufferGeometry<T.NormalBufferAttributes>,
			T.Material | T.Material[],
			T.Object3DEventMap
		>[];
	};
	let { loots }: props = $props();
	$effect(() => {
		const data = gameState.state.block.loots;
		loots.forEach((im2) => {
			for (let i = 0; i < im2.instances.length; i++) {
				im2.instances[i].visible = false;
			}
			for (let i = 0; i < data.length; i++) {
				const { x, y } = data[i].position;
				im2.instances[i].position.set(x, 0, y);
				im2.instances[i].visible = true;
				im2.instances[i].updateMatrix();
			}
		});
	});
</script>
