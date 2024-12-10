<script lang="ts">
	import * as T from 'three';
	import { InstancedMesh2 } from '@three.ez/instanced-mesh';
	import { renderer, scene } from '$lib/components/T';
	import type { Snippet } from 'svelte';
	type Props = {
		geometry: T.BufferGeometry;
		material: T.Material;
		count: number;
		children: Snippet<[{ instancedMesh2: InstancedMesh2 }]>;
	};
	let { geometry, material, count, children }: Props = $props();
	let instancedMesh2 = new InstancedMesh2<{ dir: T.Vector3 }>(renderer, count, geometry, material);
	scene.add(instancedMesh2);
</script>

{@render children({ instancedMesh2 })}
