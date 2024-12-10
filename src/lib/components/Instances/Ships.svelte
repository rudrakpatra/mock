<script module lang="ts">
	import * as T from 'three';
	import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
	import { gameState, type Motion } from '../GameState.svelte';
	import { InstancedMesh2 } from '@three.ez/instanced-mesh';
	import { renderer, scene, tasks } from '../T';
	import { DEG2RAD } from 'three/src/math/MathUtils.js';
	export type Ships = {
		motion: Motion;
	};
	export const V = 100;
	export const ships = async () => {
		const gltf = await new GLTFLoader().loadAsync('/gltfs/Ship.glb');
		const meshes = gltf.scene.children as T.Mesh<T.BufferGeometry, T.MeshBasicMaterial>[];
		return meshes.map((child) => {
			const geometry = child.geometry;
			const material = child.material;
			const im2 = new InstancedMesh2<Ships>(renderer, 500, geometry, material);
			im2.createInstances((obj, index) => {
				obj.visible = false;
			});

			im2.castShadow = true;
			scene.add(im2);
			scene.background = new T.Color(0x000000);
			return im2;
		});
	};
</script>

<script lang="ts">
	type props = {
		ships: InstancedMesh2<
			Ships,
			T.BufferGeometry<T.NormalBufferAttributes>,
			T.Material | T.Material[],
			T.Object3DEventMap
		>[];
	};
	let { ships }: props = $props();
	$effect(() => {
		const players = gameState.state.block.players;
		ships.forEach((im2) => {
			for (let i = 0; i < im2.instances.length; i++) {
				im2.instances[i].visible = false;
			}
			for (let i = 0; i < players.length; i++) {
				const player = gameState.state.block.players[i];
				const { start, angle, turn } = player.ship.motion;
				im2.instances[i].position.set(start.x, 0, start.y);
				im2.instances[i].visible = true;
				im2.instances[i].updateMatrix();
			}
		});
		tasks.push((e, p, d) => {
			ships.forEach((im2) => {
				for (let i = 0; i < players.length; i++) {
					const player = gameState.state.block.players[i];
					const { start, angle, turn } = player.ship.motion;
					const end = {
						x: start.x + (V / turn) * (Math.cos(angle + p * turn * DEG2RAD) - Math.cos(angle)),
						y: start.y + (V / turn) * (Math.sin(angle + p * turn * DEG2RAD) - Math.sin(angle))
					};
					const vx = -Math.sin(angle + p * turn * DEG2RAD);
					const vy = Math.cos(angle + p * turn * DEG2RAD);
					im2.instances[i].position.set(end.x, 0, end.y);
					//face the ship in the direction of motion
					im2.instances[i].quaternion.setFromEuler(new T.Euler(0, Math.atan2(vx, vy) + Math.PI, 0));
					im2.instances[i].updateMatrix();
				}
			});
		});
	});
</script>
