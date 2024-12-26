import * as T from 'three';
import { getContext, setContext } from 'svelte';
import { calcPositionAndAngleFromMotion } from './instances/Ships.svelte';
import { ClearPass, EffectComposer, RenderPass } from 'three/examples/jsm/Addons.js';

export type Position = {
    x: number;
    y: number;
};
export type Motion = {
    block: number;
    start: Position;
    angle: number;
    turn: number;
};
export type Loot = {
    key: string;
    position: Position;
};
export type Shot = {
    key: string;
    block: number;
    origin: Ship;
    offset: Position;
};
export type Ship = {
    key: string;
    motion: Motion;
    health: number;
    bullets: number;
};
export type Player = {
    key: string;
    loot: number;
    ship: Ship;
};
export type Block = {
    timestamp: number;
    height: number;
    players: Player[];
    loots: Loot[];
    shots: Shot[];
};
type ResizeTask = (w: number, h: number) => void;
type Task = (dt: number) => void;
class Game {
    player = $state('');
    block = $state<Block>({
        height: NaN,
        timestamp: NaN,
        players: [] as Player[],
        loots: [] as Loot[],
        shots: [] as Shot[]
    } as Block);
    clock = $state<T.Clock>(new T.Clock());
    blockTimeClock = $state<T.Clock>(new T.Clock());
    scene = $state<T.Scene>(new T.Scene());
    camera = $state<T.PerspectiveCamera>(new T.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 1000));
    renderer = $state<T.WebGLRenderer>(new T.WebGLRenderer({ antialias: true }));
    dirLight = $state<T.DirectionalLight>(new T.DirectionalLight(0xffccaa, 2));
    hemisphereLight = $state<T.HemisphereLight>(new T.HemisphereLight(0xffffff, 0x444444, 1));
    ambientLight = $state<T.AmbientLight>(new T.AmbientLight(0xcccccc, 1));
    private resizeTasks: Set<ResizeTask> = new Set();
    private animationTasks: Set<Task> = new Set();
    private beforeRenderTasks: Set<Task> = new Set();
    private afterRenderTasks: Set<Task> = new Set();
    constructor() {
        const background = new T.Mesh(
            new T.IcosahedronGeometry(5000, 3),
            new T.MeshBasicMaterial({ color: new T.Color(0xaaeeff), side: T.BackSide })
        );
        this.scene.add(background);
        this.renderer.setClearColor(0xffffff, 1);
        this.renderer.toneMapping = T.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.5;
        this.renderer.setPixelRatio(devicePixelRatio);
        this.renderer.setSize(innerWidth, innerHeight);
        this.scene.add(this.dirLight);
        this.scene.add(this.hemisphereLight);
        this.scene.add(this.ambientLight);
        this.clock.start();
        this.blockTimeClock.start();
        const gridHelper = new T.GridHelper(10, 10);
        this.scene.add(gridHelper);
        const axisHelper = new T.AxesHelper(1);
        this.scene.add(axisHelper);
    }
    canvas(el: HTMLElement) {
        const resize = () => {
            this.camera.aspect = innerWidth / innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(innerWidth, innerHeight);
            const dpr = this.renderer.getPixelRatio();
            this.resizeTasks.forEach((task) => task(innerWidth * dpr, innerHeight * dpr));
        };
        const animationLoop = () => {
            const dt = this.clock.getDelta();
            this.beforeRenderTasks.forEach((task) => task(dt));
            this.renderer.render(this.scene, this.camera);
            this.afterRenderTasks.forEach((task) => task(dt));
        };
        this.renderer.setAnimationLoop(animationLoop);
        window.addEventListener('resize', resize);
        resize();
        el.appendChild(this.renderer.domElement);
        return {
            destroy: () => {
                window.removeEventListener('resize', resize);
                this.renderer.dispose();
            }
        };
    }
    resizeTask(task: ResizeTask) {
        return {
            mount: () => {
                this.resizeTasks.add(task);
            },
            destroy: () => {
                this.resizeTasks.delete(task);
            }
        };
    }
    animationTask(task: Task) {
        return {
            mount: () => {
                this.animationTasks.add(task);
            },
            destroy: () => {
                this.animationTasks.delete(task);
            }
        };
    }
    beforeRenderTask(task: Task) {
        return {
            mount: () => {
                this.beforeRenderTasks.add(task);
            },
            destroy: () => {
                this.beforeRenderTasks.delete(task);
            }
        };
    }
    afterRenderTask(task: Task) {
        return {
            mount: () => {
                this.afterRenderTasks.add(task);
            },
            destroy: () => {
                this.afterRenderTasks.delete(task);
            }
        };
    }
    private async load(player: string) {
        this.player = player;
        this.block = {
            height: 0,
            timestamp: Date.now(),
            players: [],
            loots: [],
            shots: []
        };
        return {
            nextBlockAt: Math.random() * 100 + 1000
        };
    }
    private async fetch() {
        const randomPlayer = (i: number): Player => {
            return {
                key: 'safsfasfasf',
                loot: Math.round(Math.random() * 10),
                ship: {
                    key: 'asf',
                    motion: {
                        block: 0,
                        start: {
                            x: Math.random() * 1000 - 500,
                            y: Math.random() * 1000 - 500
                        },
                        angle: Math.random() * 2 * Math.PI,
                        turn: Math.round(Math.random() * 6) * 5 - 15 || 1
                    },
                    health: Math.round(Math.random() * 5),
                    bullets: Math.round(Math.random() * 10)
                }
            };
        };
        const updatePlayer = (i: number) => {
            const player = this.block.players[i];
            const { position, angle } = calcPositionAndAngleFromMotion(player.ship.motion, this.blockTimeClock.elapsedTime);
            return {
                key: 'safsfasfasf',
                loot: player.loot,
                ship: {
                    key: 'asf',
                    motion: {
                        block: this.block.height + 1,
                        start: position,
                        angle: angle,
                        turn: Math.round(Math.random() * 6) * 5 - 15 || 1
                    },
                    health:
                        player.ship.health <= 0
                            ? -1
                            : Math.random() > 0.6
                                ? player.ship.health - 1
                                : player.ship.health,
                    bullets: player.ship.bullets
                }
            };
        };
        const randomLoot = (i: number) => {
            return {
                key: '25',
                position: {
                    x: Math.random() * 1000 - 500,
                    y: Math.random() * 1000 - 500
                }
            };
        };
        const updateLoot = (i: number) => {
            return {
                key: '25',
                position: {
                    x: this.block.loots[i]?.position.x,
                    y: this.block.loots[i]?.position.y
                }
            };
        };

        const randomShot = (i: number) => {
            return {
                key: '251',
                block: 1,
                origin: {
                    key: '1522',
                    motion: {
                        block: Math.random() * 10,
                        start: {
                            x: Math.random() * 10,
                            y: Math.random() * 10
                        },
                        angle: Math.random() * 10,
                        turn: 0
                    },
                    health: Math.random() * 10,
                    bullets: Math.random() * 10
                },
                offset: {
                    x: Math.random() * 10,
                    y: Math.random() * 10
                }
            };
        };

        let playerCount = Math.max(100, this.block.players.length + Math.round(Math.random() * 2));
        let players = Array(playerCount)
            .fill(0)
            .map((_, i) => (this.block.players[i] ? updatePlayer(i) : randomPlayer(i)));
        players = players.filter((p) => p.ship.health > -1);
        playerCount = players.length;
        const updateShot = (i: number) => {
            return {
                key: '251',
                block: 1,
                origin: players[Math.floor(Math.random() * playerCount)].ship,
                offset: {
                    x: Math.random() * 100 - 50,
                    y: Math.random() * 100 - 50
                }
            };
        };
        this.block = {
            height: this.block.height + 1,
            timestamp: Date.now(),
            players,
            loots: Array(100)
                .fill(0)
                .map((_, i) => (this.block.loots[i] ? updateLoot(i) : randomLoot(i))),
            shots: Array(100)
                .fill(0)
                .map((_, i) => (this.block.shots[i] ? updateShot(i) : updateShot(i)))
        };
        this.blockTimeClock.start();
        return {
            nextBlockAt: Math.random() * 100 + 3000
        };
    }
    private async polling(nextBlockAt: number) {
        while (true) {
            await new Promise((resolve) => setTimeout(resolve, nextBlockAt));
            const data = await this.fetch();
            nextBlockAt = data.nextBlockAt;
            // Optional: Add a termination condition to avoid an infinite loop
            // For example:
            // if (someCondition) break;
        }
    }
    async connect(player: string) {
        let { nextBlockAt } = await this.load(player);
        this.polling(nextBlockAt);
    }
}
export const createGame = () => {
    const g = new Game();
    setContext('game', g);
    return g;
};
export const useGame = () => {
    const g = getContext('game') as Game;
    if (!g) throw new Error('game not found');
    return g;
};