<script module lang="ts">
	import * as T from 'three';
	import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
	import { InstancedMesh2 } from '@three.ez/instanced-mesh';
	import { BufferGeometryUtils } from 'three/examples/jsm/Addons.js';
	import { computeHeightAndQuaternionAt, up } from '../Sea.svelte';
	import { onDestroy, onMount } from 'svelte';
	import { seededRandom } from 'three/src/math/MathUtils.js';
	import { useGame } from '../Game.svelte';
	import { MeshFloatingMaterial } from '../materials/Floating';
	export const useLoots = async () => {
		const gltf = await new GLTFLoader().loadAsync('/gltfs/Loot.glb');
		const meshes = gltf.scene.children as T.Mesh<T.BufferGeometry, T.MeshBasicMaterial>[];
		const mergedGeometries = BufferGeometryUtils.mergeGeometries(
			meshes.map((m) => m.geometry),
			true
		);
		const materials = meshes.map((m) => {
			const material = new MeshFloatingMaterial().copy(m.material);
			return material;
		});
		const m = new InstancedMesh2(mergedGeometries.scale(2, 2, 2), materials);
		// m.addLOD(new T.BoxGeometry(), new T.MeshBasicMaterial(), 100);
		m.frustumCulled = false;
		return {
			crates: m
		};
	};
	export type Props = Awaited<ReturnType<typeof useLoots>>;
</script>

<script lang="ts">
	let { crates }: Props = $props();
	const g = useGame();
	crates.name = 'crates';
	$effect(() => {
		const loots = g.block.loots;
		crates.instancesCount = loots.length;
		crates.updateInstances((obj, i) => {
			const loot = loots[i];
			const { x, y } = loot.position;
			obj.position.x = x;
			obj.position.y = 0;
			obj.position.z = y;
			obj.quaternion.setFromAxisAngle(up, seededRandom(x + y));
		});
	});
	const task = g.beforeRenderTask(() => {
		const loots = g.block.loots;
		crates.instancesCount = loots.length;
		crates.updateInstances((obj, i) => {
			const loot = loots[i];
			const { h, q } = computeHeightAndQuaternionAt(loot.position);
			obj.position.set(loot.position.x, h - 0.5, loot.position.y);
			obj.quaternion
				.setFromAxisAngle(up, seededRandom(loot.position.x + loot.position.y))
				.multiply(q);
		});
	});
	onMount(() => {
		g.scene.add(crates);
		task.mount();
	});
	onDestroy(() => {
		g.scene.remove(crates);
		task.destroy();
	});
</script>
