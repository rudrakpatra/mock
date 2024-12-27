<script module lang="ts">
	import * as T from 'three';
	import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
	import { InstancedMesh2 } from '@three.ez/instanced-mesh';
	import { DEG2RAD, seededRandom } from 'three/src/math/MathUtils.js';
	import { onDestroy, onMount } from 'svelte';
	import { BufferGeometryUtils } from 'three/examples/jsm/Addons.js';
	import { computeHeightAndQuaternionAt, up } from '../Sea.svelte';
	import { useGame, type Motion } from '../Game.svelte';

	export const calcPositionAndAngleFromMotion = (motion: Motion, t: number) => {
		const { start, angle: startAngle, turn } = motion;
		const velocity = 200;
		const position = {
			x:
				start.x +
				(velocity / turn) * (Math.cos(startAngle + t * turn * DEG2RAD) - Math.cos(startAngle)),
			y:
				start.y +
				(velocity / turn) * (Math.sin(startAngle + t * turn * DEG2RAD) - Math.sin(startAngle))
		};
		const angle = startAngle + t * turn * DEG2RAD;
		return { position, angle };
	};
	export const useShips = async () => {
		const gltf = await new GLTFLoader().loadAsync('/gltfs/Ship.glb');
		const meshes = gltf.scene.children as T.Mesh<T.BufferGeometry, T.MeshBasicMaterial>[];
		const mergedGeometries = BufferGeometryUtils.mergeGeometries(
			meshes.map((m) => m.geometry.translate(0, -0.5, 0)),
			true
		);
		const materials = meshes.map((m) => {
			//this is highly specialised for the Ship model
			//we create a new material for each ship material and merge it with the ship
			return m.material;
		});
		const h = new InstancedMesh2(mergedGeometries.rotateY(Math.PI), materials);
		const t = new InstancedMesh2(
			new T.IcosahedronGeometry(1, 0),
			new T.MeshBasicMaterial({ color: 0xaecfbc })
			// new T.MeshStandardMaterial({ color: 0xffffff })
		);
		const d = new InstancedMesh2(
			new T.IcosahedronGeometry(1, 0),
			new T.MeshBasicMaterial({ color: 0xf0dfac })
		);
		// h.addLOD(new T.BoxGeometry(), new T.MeshBasicMaterial(), 100);
		h.frustumCulled = false;
		t.frustumCulled = false;
		d.frustumCulled = false;
		return {
			hulls: h,
			trails: t,
			debris: d
		};
	};
	export type Props = Awaited<ReturnType<typeof useShips>>;
</script>

<script lang="ts">
	let { hulls, trails, debris }: Props = $props();
	const g = useGame();
	$effect(() => {
		const ships = g.block.players.map((p) => p.ship);
		hulls.instancesCount = ships.length;
		hulls.updateInstances((obj, i) => {
			const { x, y } = ships[i].motion.start;
			obj.position.x = x;
			obj.position.y = 0;
			obj.position.z = y;
		});
	});
	const task = g.beforeRenderTask((d) => {
		const bt = g.blockTimeClock.getElapsedTime();
		const ships = g.block.players.map((p) => p.ship);
		hulls.updateInstances((obj, i) => {
			const ship = ships[i];
			if (ship.health > 0) {
				obj.visible = true;
				const { position, angle } = calcPositionAndAngleFromMotion(ship.motion, bt);
				const { h, q } = computeHeightAndQuaternionAt(position);
				obj.position.set(position.x, h, position.y);
				obj.quaternion.setFromAxisAngle(up, -angle).multiply(q);
			} else {
				if (bt < 1) {
					obj.visible = true;
					const { start, angle } = ship.motion;
					const { h } = computeHeightAndQuaternionAt(start);
					const s = (x: number) => 1 + x * (1 - x);
					const f = (x: number) => s(x * 1.61803);
					obj.position.set(start.x, h + 2 * (f(bt) - 1), start.y);
					obj.quaternion.setFromAxisAngle(up, -angle);
				} else {
					obj.visible = false;
				}
			}
		});

		//trails
		if (g.renderer.info.render.frame % 12 === 0) {
			const trailPerShip = 20;
			trails.instancesCount = ships.length * trailPerShip;
			trails.updateInstances((obj, i) => {
				const ship = ships[Math.floor(i / trailPerShip)];
				const t = (i % trailPerShip) / trailPerShip;
				const { position } = calcPositionAndAngleFromMotion(ship.motion, bt - t * 5);
				if (ship.health > 0) {
					obj.visible = true;
					const s = (x: number) => x * (1 - x) * (1 - x) * (1 - x) * (1 - x);
					const f = (x: number) => s(x) / s(0.2);
					obj.scale.set(f(t), f(t), f(t));
					const vl = { x: position.x, y: 0.5 * f(t), z: position.y };
					const rl = { x: Math.random() - 0.5, y: 0, z: Math.random() - 0.5 };
					obj.position.add(vl).add(rl);
				} else {
					obj.visible = false;
				}
			});
		}
		//debris
		const debrisPerShip = 10;
		debris.instancesCount = ships.length * debrisPerShip;
		debris.updateInstances((obj, i) => {
			const ship = ships[Math.floor(i / debrisPerShip)];
			const t = (i % debrisPerShip) / debrisPerShip;
			if (ship.health > 0) {
				obj.visible = false;
			} else {
				const { start, angle } = ship.motion;
				const t0 = bt - 0.2;
				if (0 < t0 && t0 < 1) {
					obj.visible = true;
					const t1 = t;
					const d = (s: number) => seededRandom(i * 100 + t1 * 100 + s * 100) - 0.5;
					const dir = { x: d(1), y: 0.5 + d(2), z: d(3) };

					const s = (x: number) => x * Math.exp(-2 * x);
					const f = (x: number) => s(x) / s(0.36788);
					obj.position.x = start.x + dir.x * f(t0) * 6;
					obj.position.y = 0 + dir.y * f(t0) * 5 + t0 * (1 - d(4)) * 4;
					obj.position.z = start.y + dir.z * f(t0) * 6;
					obj.scale.set(5 * d(4) * f(2 * t0), 5 * d(4) * f(2 * t0), 5 * d(4) * f(2 * t0));
				} else {
					obj.visible = false;
				}
			}
		});
	});
	onMount(() => {
		g.scene.add(hulls);
		g.scene.add(trails);
		g.scene.add(debris);
		task.mount();
	});
	onDestroy(() => {
		g.scene.remove(hulls);
		g.scene.remove(trails);
		g.scene.remove(debris);
		task.destroy();
	});
</script>
