<script lang="ts">
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
	import { camera, renderer } from '$lib/components/T';

	export let controls = new OrbitControls(camera, renderer.domElement);
	controls.maxDistance = 50;
	controls.minDistance = 10;

	camera.position.set(-10, 10, 0);
	camera.lookAt(0, 0, 0);
</script>
