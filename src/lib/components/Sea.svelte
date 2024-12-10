<script lang="ts">
	import * as T from 'three';
	import { gameState } from '$lib/components/GameState.svelte';
	import { scene } from '$lib/components/T';
	import { onDestroy, onMount } from 'svelte';
	let mesh = new T.Mesh(
		new T.PlaneGeometry(2000, 2000).rotateX(-Math.PI / 2).translate(0, -0.1, 0),
		new T.MeshBasicMaterial({ color: 0x008fac })
	);
	mesh.receiveShadow = true;
	onMount(() => {
		scene.add(mesh);
	});
	onDestroy(() => {
		scene.remove(mesh);
	});
</script>
