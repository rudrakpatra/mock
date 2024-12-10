<script lang="ts">
	import * as T from 'three';
	import type { InstancedMesh2 } from '@three.ez/instanced-mesh';
	import { onMount } from 'svelte';

	type Props = {
		index: number;
		instancedMesh2: InstancedMesh2;
		matrix?: T.Matrix4;
	};

	let { index, instancedMesh2, matrix = new T.Matrix4() }: Props = $props();
</script>
