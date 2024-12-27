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

	let { matcap, renderTarget }: Props = $props();

	const g = useGame();

	const downSampleRatio = 0.2;
	const size = 1000;
	const segments = 300;
	// simple plane pointing up
	const geometry = new T.PlaneGeometry(size, size, segments, segments).rotateX(-Math.PI / 2);
	const material = new T.ShaderMaterial({
		wireframe: false,
		uniforms: {
			uTime: { value: 0 },
			diffuseColor: { value: new T.Color(0x00bbcc) },
			subsurfaceColor: { value: new T.Color(0x22dddd) },
			sheenColor: { value: new T.Color(0xccdddd) }
		},
		vertexShader: `
	            // Vertex shader
varying vec4 vWorldPosition;
uniform float uTime;
${glsl_wave()}

void main() {
    // Start with NDC coordinates
    vec2 screenPos = uv * 2.0 - 1.0;
    
    // Get ray direction in view space
    vec4 rayDir = inverse(projectionMatrix) * vec4(screenPos, 1.0, 1.0);
    rayDir = normalize(vec4(rayDir.xyz, 0.0));
    
    // Transform ray to world space
    vec3 worldRayDir = (inverse(viewMatrix) * rayDir).xyz;
    
    // Camera position in world space
    vec3 cameraPos = (inverse(viewMatrix) * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    
    // Intersect ray with y=0 plane
    // Ray-plane intersection: p = o + t*d where y = 0
    float t = -cameraPos.y / worldRayDir.y;
    vec3 worldPos = cameraPos + t * worldRayDir;
    // Apply wave height
    float h = glsl_wave(worldPos, uTime);
    worldPos.y += h*0.5;
    
    vWorldPosition = vec4(worldPos, 1.0);
	vec4 finalPos = projectionMatrix * viewMatrix * vec4(worldPos, 1.0);
	// finalPos.x=clamp(finalPos.x,-1.0,1.0);
	// finalPos.y=clamp(finalPos.y,-1.0,1.0);
    gl_Position = finalPos;
}
	        `,
		fragmentShader: `// Fragment Shader
varying vec4 vWorldPosition;
uniform vec3 diffuseColor;
uniform vec3 subsurfaceColor;
uniform vec3 sheenColor;
uniform float uTime;
${glsl_wave()}

void main() {
	// Calculate normal for lighting
    float epsilon = 0.01;
	float h = glsl_wave(vWorldPosition.xyz, uTime);
    vec3 normal = glsl_wave_normal(vWorldPosition.xyz, uTime, epsilon);
		
    // Basic lighting
	vec3 color = mix(diffuseColor, subsurfaceColor, h);
    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
    float diff = max(dot(normal, lightDir), 0.0);
    // Water color
    vec3 finalColor = mix(color,sheenColor,diff);
    
    gl_FragColor = vec4(color, 1.0);
}
`
	});
	// vec2 coords = vPos.xy/vPos.w;
	// coords=coords*0.5+0.5;
	const mesh = new T.Mesh(geometry, material);
	const updateTimeTask = g.beforeRenderTask((d) => {
		material.uniforms.uTime.value += 10 / 60;
	});
	onMount(() => {
		g.scene.add(mesh);
		updateTimeTask.mount();
	});
	onDestroy(() => {
		g.scene.remove(mesh);
		updateTimeTask.destroy();
	});
</script>
