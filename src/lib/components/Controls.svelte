<script lang="ts">
	import * as T from 'three';
	import { onDestroy, onMount } from 'svelte';
	import { calcPositionAndAngleFromMotion } from './instances/Ships.svelte';
	import { MapControls } from 'three/examples/jsm/controls/MapControls.js';
	import { OrbitControls } from 'three/examples/jsm/Addons.js';
	import { useGame } from './Game.svelte';
	let g = useGame();
	let mapControls = new MapControls(g.camera, g.renderer.domElement);
	mapControls.enabled = false;
	mapControls.enablePan = true;
	mapControls.enableRotate = true;
	mapControls.maxDistance = 200;
	mapControls.minDistance = 10;
	mapControls.dampingFactor = 0.1;
	mapControls.enableDamping = true;

	let orbitControls = new OrbitControls(g.camera, g.renderer.domElement);
	orbitControls.enabled = false;
	orbitControls.enablePan = false;
	orbitControls.enableRotate = true;
	orbitControls.maxDistance = 200;
	orbitControls.minDistance = 10;
	orbitControls.dampingFactor = 0.1;
	orbitControls.enableDamping = true;

	let offset = new T.Vector3(10, 10, 10);
	let target = new T.Vector3();

	let lastIndex = NaN;
	let index = $state(NaN);
	let following = $derived(g.block.players[index] !== undefined);
	const task = g.beforeRenderTask((dt) => {
		if (following) {
			if (!orbitControls.enabled) {
				orbitControls.object.position.copy(target).add(offset);
				orbitControls.target.copy(target);
			}
			if (index === lastIndex)
				offset.copy(orbitControls.object.position.clone().sub(orbitControls.target));
			orbitControls.object.position.copy(target).add(offset);
			orbitControls.target.copy(target);
			orbitControls.update(dt);
			const { position } = calcPositionAndAngleFromMotion(
				g.block.players[index].ship.motion,
				g.blockTimeClock.elapsedTime
			);
			target.lerpVectors(target, { x: position.x, y: 0, z: position.y }, 0.1);
			orbitControls.enabled = true;
			mapControls.enabled = false;
		} else {
			if (!mapControls.enabled) {
				mapControls.object.position.copy(target).add(offset);
				mapControls.target.copy(target);
			}
			offset.copy(mapControls.object.position.clone().sub(mapControls.target));
			mapControls.update(dt);
			mapControls.enabled = true;
			orbitControls.enabled = false;
			target.lerpVectors(target, mapControls.target, 0.1);
		}
		lastIndex = index;
	});

	onMount(task.mount);
	onDestroy(task.destroy);
</script>

<div class="absolute bottom-0 left-0 z-50 bg-black p-2 text-xs text-white">
	camera mode :
	<div>
		{following ? 'following ' + index : 'free'}
	</div>
	{#if g.block.players[index]}
		<div>
			Health: {g.block.players[index].ship.health}
		</div>
		<div>
			Bullets: {g.block.players[index].ship.bullets}
		</div>
		<div>
			Loot: {g.block.players[index].loot}
		</div>
	{/if}
	<input
		class="w-full bg-black"
		type="number"
		min="0"
		max={g.block.players.length - 1}
		oninput={(e) => {
			index = e.currentTarget.valueAsNumber;
		}}
	/>
</div>
<div
	class="absolute bottom-0 left-1/2 z-50 h-[48px] w-[500px] -translate-x-1/2 bg-black p-2 text-xs text-white"
>
	<div class="grid grid-cols-4">
		<div class="text-center">
			{g.block.height}th block
		</div>
		<div class="text-center">
			{g.block.players.length} players
		</div>

		<div class="text-center">
			{g.block.loots.length} loots
		</div>
		<div class="text-center">
			{g.block.shots.length} shots
		</div>
	</div>
</div>
