<script lang="ts">
	import * as T from 'three';
	import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
	const scene = new T.Scene();
	const geo = new T.BoxGeometry(10, 32, 32);
	const mat = new T.ShaderMaterial({
		side: T.DoubleSide,
		uniforms: {
			uTime: { value: 0 }
		},
		dithering: true,
		vertexShader: `
			varying vec4 vPos;
			void main() {
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				vPos = gl_Position;
			}
		`,
		fragmentShader: `
			varying vec4 vPos;
			uniform float uTime;
			void main() {
				gl_FragColor = vec4(vec3(vPos.z/99.9),1.0);
			}
		`
	});
	const mesh = new T.Mesh(geo, mat);
	scene.add(mesh);
	const renderer = new T.WebGLRenderer({ antialias: true });
	const camera = new T.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 100);
	camera.position.set(0, 0, 100);
	camera.lookAt(0, 0, 0);
	const orbitControls = new OrbitControls(camera, renderer.domElement);
	orbitControls.enableDamping = true;

	const canvas = (el: HTMLElement) => {
		function resize() {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
		}
		function animate() {
			orbitControls.update();
			renderer.render(scene, camera);
		}
		renderer.setAnimationLoop(animate);
		window.addEventListener('resize', resize);
		resize();
		el.appendChild(renderer.domElement);
		renderer.domElement.classList.add('canvas');
		return {
			destroy() {
				window.removeEventListener('resize', resize);
				renderer.dispose();
			}
		};
	};
</script>

<div use:canvas></div>

<style>
	:global(.canvas) {
		width: 100vw;
		height: 100vh;
	}
</style>
