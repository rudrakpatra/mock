<script lang="ts" generics="T">
	import * as T from 'three';
	import { InstancedMesh2 } from '@three.ez/instanced-mesh';
	import { renderer, scene } from '$lib/components/T';
	import { onDestroy, onMount } from 'svelte';
	type Props = {
		geometry: T.BufferGeometry;
		material: T.Material;
		count: number;
		ref: (obj: InstancedMesh2<T>) => void;
	};
	let { geometry, material, count }: Props = $props();
	const instancedMesh2 = new InstancedMesh2<T>(renderer, count, geometry, material);
	onMount(() => {
		scene.add(instancedMesh2);
	});
	onDestroy(() => {
		scene.remove(instancedMesh2);
	});
</script>
