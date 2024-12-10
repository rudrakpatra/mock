import * as T from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { gameState, type Block } from './GameState.svelte';

export let scene = new T.Scene();
const skyCanvas = document.createElement('canvas');
skyCanvas.width = 512;
skyCanvas.height = 512;
const ctx = skyCanvas.getContext("2d");
//draw white circles in blue background
ctx?.clearRect(0, 0, skyCanvas.width, skyCanvas.height);
Array(100).fill(0).forEach((c) => {
    const x = Math.random() * skyCanvas.width;
    const y = Math.random() * skyCanvas.height;
    const r = Math.random() * 10;
    ctx?.arc(x, y, r, 0, 360);
})
ctx?.fill();
const ct = new T.CanvasTexture(skyCanvas);
ct.needsUpdate = true;

const background = new T.Mesh(new T.IcosahedronGeometry(500, 3), new T.MeshBasicMaterial({ color: new T.Color(0xaaeeff), side: T.BackSide }))
scene.add(background);

export let camera = new T.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 10000);

export let renderer = new T.WebGLRenderer({ antialias: true });
renderer.setClearColor(0xffffff, 1);
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.5;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(innerWidth, innerHeight);

export let dirLight = new T.DirectionalLight(0xffccaa, 2);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(1024, 1024);
dirLight.shadow.camera.left = -1500;
dirLight.shadow.camera.right = 1500;
dirLight.shadow.camera.top = 1500;
dirLight.shadow.camera.bottom = -1500;
dirLight.shadow.camera.far = 5000;
dirLight.shadow.camera.updateProjectionMatrix();
export let hemisphereLight = new T.HemisphereLight(0xffddcc, 0xaa6622);
scene.add(hemisphereLight);
export let ambientLight = new T.AmbientLight(0xcccccc, 1);
scene.add(ambientLight);
export let gridHelper = new T.GridHelper(10, 10);
scene.add(gridHelper);
export let axisHelper = new T.AxesHelper(1);
scene.add(axisHelper);

export let stats = new Stats();

export type Task = (elapsedTime: number, pastBlockReceiveTime: number, deltaTime: number) => void;
export let clock = new T.Clock();
export let tasks = [] as Task[];
export const canvas = (el: HTMLElement) => {
    function resize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    function animate() {
        stats.update();
        clock.getDelta();
        const elapsedTime = clock.getElapsedTime();
        const pastBlockReceiveTime = elapsedTime - gameState.state.block.receivedAt;
        const deltaTime = clock.getDelta();
        for (let i = 0; i < tasks.length; i++) {
            tasks[i](elapsedTime, pastBlockReceiveTime, deltaTime);
        }
        renderer.render(scene, camera);
    }
    renderer.setAnimationLoop(animate);
    window.addEventListener('resize', resize);
    el.appendChild(renderer.domElement);
    el.appendChild(stats.dom);
    return {
        destroy() {
            window.removeEventListener('resize', resize);
            renderer.dispose();
        }
    };
};