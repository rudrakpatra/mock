<script module lang="ts">
	import * as T from 'three';

	export const up = new T.Vector3(0, 1, 0);
	const q = new T.Quaternion();
	export let computeHeightAndQuaternionAt = (position: Position) => {
		const h0 = 0;
		const h1 = 0;
		const h2 = 0;

		const v1 = { x: 0.0, y: h1 - h0, z: 0.1 };
		const v2 = { x: 0.1, y: h2 - h0, z: 0.0 };
		const normal = {
			x: v1.y * v2.z - v1.z * v2.y,
			y: v1.z * v2.x - v1.x * v2.z,
			z: v1.x * v2.y - v1.y * v2.x
		};
		return {
			h: h0,
			q: q.setFromUnitVectors(up, normal)
		};
	};
	export let useSea = async () => {
		const textureLoader = new T.TextureLoader();
		const texture = await textureLoader.loadAsync('/textures/water/matcap.jpg');
		texture.wrapS = T.RepeatWrapping;
		texture.wrapT = T.RepeatWrapping;
		texture.magFilter = T.LinearFilter;
		texture.minFilter = T.LinearFilter;
		texture.colorSpace = T.SRGBColorSpace;
		const renderTarget = new T.WebGLRenderTarget(window.innerWidth, window.innerHeight);
		renderTarget.texture.minFilter = T.NearestFilter;
		renderTarget.texture.magFilter = T.NearestFilter;
		renderTarget.texture.generateMipmaps = false;
		return { matcap: texture, renderTarget };
	};
	type Props = Awaited<ReturnType<typeof useSea>>;
</script>

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	// import { InstancedMesh2 } from '@three.ez/instanced-mesh';
	import { glsl_wave } from './materials/Sea';
	import { useGame, type Position } from './Game.svelte';
	import { floatingMaterials } from './materials/Floating';

	let { matcap, renderTarget }: Props = $props();

	const g = useGame();

	const downSampleRatio = 0.2;
	const size = 1000;
	const segments = 100;
	const geometry = new T.PlaneGeometry(size, size, segments, segments).rotateX(-Math.PI / 2);
	const material = new T.ShaderMaterial({
		uniforms: {
			uTime: { value: 0 },
			ymin: { value: -1.0 },
			ymax: { value: 0.0 },
			diffuseColor: { value: new T.Color(0x0077ff) },
			subsurfaceColor: { value: new T.Color(0xffffff) },
			sheenColor: { value: new T.Color(0xccdddd) },
			reflection: { value: null },
			iResolution: { value: new T.Vector2(window.innerWidth, window.innerHeight) }
		},
		vertexShader: `
				varying vec4 vPos;
	            varying vec3 vWorldPosition;
				uniform float uTime;
				${glsl_wave()}
	            void main() {
	                vWorldPosition = (modelMatrix * vec4( position, 1.0 )).xyz;
					float h = glsl_wave(vWorldPosition, uTime);
					vWorldPosition.y += h;
	                vPos = projectionMatrix * viewMatrix * vec4(vWorldPosition, 1.0);
					gl_Position = vPos;
	            }
	        `,
		fragmentShader: `
				varying vec4 vPos;
	            varying vec3 vWorldPosition;
	            uniform vec3 diffuseColor;
	            uniform vec3 subsurfaceColor;
	            uniform vec3 sheenColor;
	            uniform float uTime;
	            uniform sampler2D reflection;
				${glsl_wave()}
	            void main() {
	                float h = glsl_wave(vWorldPosition, uTime);
	                vec3 water = mix(diffuseColor, subsurfaceColor, h);
					vec2 coords = vPos.xy/vPos.w;
					coords=coords*0.5+0.5;
					vec4 reflectionColor = texture2D(reflection, coords);
					vec3 finalColor = mix(diffuseColor, reflectionColor.rgb, 0.5);
	                gl_FragColor = vec4(finalColor, 1.0);
	            }`
	});
	const mesh = new T.Mesh(geometry, material);
	const updateTimeTask = g.beforeRenderTask((d) => {
		material.uniforms.uTime.value += 10 / 60;
	});
	const renderReflectionTask = g.beforeRenderTask(() => {
		//reflect the whole scene
		g.scene.scale.setY(-1);
		mesh.visible = false;
		floatingMaterials.forEach((m) => m.onBeforeReflection());
		g.renderer.setRenderTarget(renderTarget);
		g.renderer.render(g.scene, g.camera);
		material.uniforms.reflection.value = renderTarget.texture;
		//reset
		g.scene.scale.setY(1);
		mesh.visible = true;
		floatingMaterials.forEach((m) => m.onAfterReflection());
		g.renderer.setRenderTarget(null);
	});
	const updateRenderTargetTask = g.resizeTask((w, h) => {
		renderTarget.setSize(w, h);
	});
	onMount(() => {
		g.scene.add(mesh);
		updateTimeTask.mount();
		renderReflectionTask.mount();
		updateRenderTargetTask.mount();
	});
	onDestroy(() => {
		g.scene.remove(mesh);
		updateTimeTask.destroy();
		renderReflectionTask.destroy();
		updateRenderTargetTask.destroy();
	});
</script>
