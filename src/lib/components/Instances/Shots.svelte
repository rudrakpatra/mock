<script module lang="ts">
	import * as T from 'three';
	import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
	import { InstancedMesh2 } from '@three.ez/instanced-mesh';
	import { DEG2RAD, seededRandom } from 'three/src/math/MathUtils.js';
	import { onDestroy, onMount } from 'svelte';
	import { useGame, type Motion, type Position } from '../Game.svelte';
	export const calcPositionAndAngle = (motion: Motion, offset: Position, t: number) => {
		const { start } = motion;
		const position = {
			x: start.x + offset.x * t,
			y: start.y + offset.y * t
		};
		const angle = Math.atan2(offset.y, offset.x);
		return { position, angle };
	};
	export const useShots = async () => {
		// const gltf = await new GLTFLoader().loadAsync('/gltfs/Ship.glb');
		// const meshes = gltf.scene.children as T.Mesh<T.BufferGeometry, T.MeshBasicMaterial>[];
		// const mergedGeometries = BufferGeometryUtils.mergeGeometries(
		// 	meshes.map((m) => m.geometry),
		// 	true
		// );

		// const materials = meshes.map((m) => m.material);
		// const h = new InstancedMesh2(mergedGeometries.rotateY(Math.PI), materials);
		// const t = new InstancedMesh2(
		// 	new T.IcosahedronGeometry(1, 0),
		// 	new T.MeshBasicMaterial({ color: 0x00afdc })
		// 	// new T.MeshStandardMaterial({ color: 0xffffff })
		// );
		// h.addLOD(new T.BoxGeometry(), new T.MeshBasicMaterial(), 100);
		// h.frustumCulled = false;
		// scene.add(h);
		// t.frustumCulled = false;
		// scene.add(t);

		const b = new InstancedMesh2(
			new T.IcosahedronGeometry(0.4, 0),
			new T.MeshBasicMaterial({ color: 0xaa6644 })
		);
		b.frustumCulled = false;
		const t = new InstancedMesh2(
			new T.IcosahedronGeometry(0.2, 0),
			new T.MeshBasicMaterial({ color: 0xffccaa })
		);
		t.frustumCulled = false;
		const s = new InstancedMesh2(
			new T.IcosahedronGeometry(0.8, 0),
			new T.MeshBasicMaterial({ color: 0xddddcc })
		);
		s.frustumCulled = false;
		return {
			balls: b,
			trails: t,
			splashes: s
		};
	};
	export type Props = Awaited<ReturnType<typeof useShots>>;
</script>

<script lang="ts">
	let { balls, trails, splashes }: Props = $props();
	const g = useGame();
	const shots = g.block.shots;
	balls.instancesCount = shots.length;
	balls.updateInstances((obj, i) => {
		const { x, y } = shots[i].origin.motion.start;
		obj.visible = true;
		obj.position.x = x;
		obj.position.y = 0;
		obj.position.z = y;
	});

	const task = g.beforeRenderTask(() => {
		const maxShotDelay = 0.5;
		const shots = g.block.shots;
		//balls
		balls.instancesCount = shots.length;
		const bt = g.blockTimeClock.getElapsedTime();
		balls.updateInstances((obj, i) => {
			const shotFlightTime = bt - maxShotDelay * seededRandom(i);
			if (0 < shotFlightTime && shotFlightTime < 1) {
				obj.visible = true;
				const shot = shots[i];
				const { position } = calcPositionAndAngle(shot.origin.motion, shot.offset, shotFlightTime);
				const p = (x: number) => 50 * x * (1 - x);
				obj.position.x = position.x;
				obj.position.y = p(shotFlightTime);
				obj.position.z = position.y;
				if (shotFlightTime > 1.0) {
					obj.scale.set(2 - shotFlightTime, 2 - shotFlightTime, 2 - shotFlightTime);
				}
			} else {
				obj.visible = false;
			}
		});

		//trails
		const trailsPerShot = 12;
		trails.instancesCount = shots.length * trailsPerShot;
		trails.updateInstances((obj, i) => {
			const shotIndex = Math.floor(i / trailsPerShot);
			const shot = shots[shotIndex];
			const shotFlightTime = bt - maxShotDelay * seededRandom(shotIndex);
			if (0 < shotFlightTime && shotFlightTime < 1) {
				obj.visible = true;
				const t1 = (i % trailsPerShot) / trailsPerShot;
				const t2 = shotFlightTime - 0.1 * t1;
				const { position } = calcPositionAndAngle(shot.origin.motion, shot.offset, t2);
				const p = (x: number) => 50 * x * (1 - x);
				obj.position.x = position.x;
				obj.position.y = p(t2);
				obj.position.z = position.y;

				const s = (x: number) => x * (1 - x) * (1 - x) * (1 - x) * (1 - x);
				const f = (x: number) => s(x) / s(0.2);
				obj.scale.set(f(t1), f(t1), f(t1));
				const rl = {
					x: 0.02 * (Math.random() - 0.5),
					y: 0.02 * (Math.random() - 0.5),
					z: 0.02 * (Math.random() - 0.5)
				};
				obj.position.add(rl);
			} else {
				obj.visible = false;
			}
		});

		//splashes
		const splashesPerShot = 6;

		splashes.instancesCount = shots.length * splashesPerShot;
		splashes.updateInstances((obj, i) => {
			const shotIndex = Math.floor(i / splashesPerShot);
			const shot = shots[shotIndex];
			const shotFlightTime = bt - maxShotDelay * seededRandom(shotIndex);
			if (1 < shotFlightTime && shotFlightTime < 1.5) {
				obj.visible = true;
				const t0 = (shotFlightTime - 1) * 2;
				const { position } = calcPositionAndAngle(shot.origin.motion, shot.offset, 1.0);
				const t1 = (i % splashesPerShot) / splashesPerShot;
				const d = (s: number) => seededRandom(i * 100 + t1 * 100 + s * 100) - 0.5;
				const dir = { x: d(1), y: 0.5 + d(2), z: d(3) };

				const s = (x: number) => x * Math.exp(-2 * x);
				const f = (x: number) => s(x) / s(0.36788);
				obj.position.x = position.x + dir.x * f(t0) * 3;
				obj.position.y = 0 + dir.y * f(t0) * 1.5;
				obj.position.z = position.y + dir.z * f(t0) * 3;
				obj.scale.set(f(2 * t0), f(2 * t0), f(2 * t0));

				const rl = {
					x: 0.05 * (Math.random() - 0.5),
					y: 0.05 * (Math.random() - 0.5),
					z: 0.05 * (Math.random() - 0.5)
				};
				obj.position.add(rl);
			} else {
				obj.visible = false;
			}
		});
		// }
	});
	onMount(() => {
		g.scene.add(balls);
		g.scene.add(trails);
		g.scene.add(splashes);
		task.mount();
	});
	onDestroy(() => {
		g.scene.remove(balls);
		g.scene.remove(trails);
		g.scene.remove(splashes);
		task.destroy();
	});
</script>
