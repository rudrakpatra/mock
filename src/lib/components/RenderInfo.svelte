<script lang="ts">
	import { useGame } from './Game.svelte';
	import Stats from 'three/addons/libs/stats.module.js';
	const g = useGame();
	const stats = (el: HTMLElement) => {
		const stats = new Stats();
		el.appendChild(stats.dom);
		const updateStats = g.afterRenderTask(() => stats.update());
		updateStats.mount();
		return {
			destroy: () => {
				updateStats.destroy();
			}
		};
	};
</script>

<div use:stats></div>
<div class="absolute left-[80px] top-[0px] z-50">
	<div class="h-[48px] w-[160px] bg-black p-2 text-xs text-white">
		{#if g.renderer.info}
			<div class="grid grid-cols-2">
				<div class="text-center">
					pts
					{Math.round(g.renderer.info.render.points / 1000) + 'k'}<br />
				</div>
				<div class="text-center">
					lines
					{Math.round(g.renderer.info.render.lines / 1000) + 'k'}<br />
				</div>
				<div class="text-center">
					tris
					{Math.round(g.renderer.info.render.triangles / 1000) + 'k'}<br />
				</div>
				<div class="text-center">
					calls
					{g.renderer.info.render.calls}
				</div>
			</div>
		{/if}
	</div>
</div>
