import { DEG2RAD } from "three/src/math/MathUtils.js"
import { V } from "./Instances/Ships.svelte"
import { clock } from "./T"


export type Position = {
    x: number,
    y: number
}
export type Motion = {
    block: number,
    start: Position,
    angle: number,
    turn: number,
}
export type Loot = {
    key: string,
    position: Position
}
export type Shot = {
    key: string,
    block: number,
    origin: Ship,
    offset: Position,
}
export type Ship = {
    key: string,
    motion: Motion,
    health: number,
    bullets: number,
}
export type Player = {
    key: string,
    loot: number,
    ship: Ship
}

export type Block = {
    receivedAt: number,
    height: number,
    players: Player[],
    loots: Loot[],
    shots: Shot[],
}



//create consistent state
class GameState {
    state = $state({
        player: "",
        joinedAt: NaN,
        block: {
            height: NaN,
            receivedAt: NaN,
            players: [] as Player[],
            loots: [] as Loot[],
            shots: [] as Shot[],
        } as Block
    })
    async load(player: string) {
        this.state = {
            player,
            joinedAt: 122414,
            block: {
                height: 2,
                receivedAt: 0,
                players: [],
                loots: [],
                shots: [],
            },
        };
    }
    async fetch() {
        const randomPlayer = (i: number): Player => {

            return {
                key: 'safsfasfasf',
                loot: Math.random() * 10,
                ship: {
                    key: 'asf',
                    motion: {
                        block: 0,
                        start: {
                            x: Math.random() * 500 - 250,
                            y: Math.random() * 500 - 250
                        },
                        angle: Math.random() * 2 * Math.PI,
                        turn: Math.round(Math.random() * 6) * 5 - 15 || 1
                    },
                    health: Math.random() * 10,
                    bullets: Math.random() * 10
                }
            }
        }
        const updatePlayer = (i: number) => {
            const p = clock.getElapsedTime() - this.state.block.receivedAt;
            const player = gameState.state.block.players[i];
            const { start, angle, turn } = player.ship.motion;
            const end = {
                x: start.x + (V / turn) * (Math.cos(angle + p * turn * DEG2RAD) - Math.cos(angle)),
                y: start.y + (V / turn) * (Math.sin(angle + p * turn * DEG2RAD) - Math.sin(angle))
            };
            return {
                key: 'safsfasfasf',
                loot: player.loot,
                ship: {
                    key: 'asf',
                    motion: {
                        block: this.state.block.height + 1,
                        start: end,
                        angle: angle + p * turn * DEG2RAD,
                        turn: Math.round(Math.random() * 6) * 5 - 15 || 1,
                    },
                    health: player.ship.health,
                    bullets: player.ship.bullets
                }
            }
        }
        const randomLoot = (i: number) => {
            return {
                key: "25",
                position: {
                    x: Math.random() * 500 - 250,
                    y: Math.random() * 500 - 250
                }
            }
        }
        const updateLoot = (i: number) => {
            return {
                key: "25",
                position: {
                    x: this.state.block.loots[i]?.position.x,
                    y: this.state.block.loots[i]?.position.y
                }
            }
        }
        this.state = {
            ...this.state,
            block: {
                height: 1,
                receivedAt: clock.getElapsedTime(),
                players: Array(200).fill(0).map((_, i) => this.state.block.players[i] ? updatePlayer(i) : randomPlayer(i)),
                loots: Array(20).fill(0).map((_, i) => this.state.block.loots[i] ? updateLoot(i) : randomLoot(i)),
                shots: [
                    {
                        key: "251",
                        block: 1,
                        origin: {
                            key: "1522",
                            motion: {
                                block: Math.random() * 10,
                                start: {
                                    x: Math.random() * 10,
                                    y: Math.random() * 10
                                },
                                angle: Math.random() * 10,
                                turn: 0,
                            },
                            health: Math.random() * 10,
                            bullets: Math.random() * 10
                        },
                        offset: {
                            x: Math.random() * 10,
                            y: Math.random() * 10
                        }
                    }
                ],
            },
        };
        return true;
    }
}

export const gameState = new GameState();