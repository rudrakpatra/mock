<script lang="ts">
	import { wallet, WalletError } from './Wallet';
	import Controls from './Controls.svelte';
	import Loots, { useLoots } from './instances/Loots.svelte';
	import Ships, { useShips } from './instances/Ships.svelte';
	import Shots, { useShots } from './instances/Shots.svelte';
	import Sea, { useSea } from './Sea.svelte';
	import RenderInfo from './RenderInfo.svelte';
	import { createGame } from './Game.svelte';
</script>

{#await wallet()}
	<div>waiting for wallet...</div>
{:then wallet}
	{console.log(wallet)}
	{#await Promise.all([createGame(), useLoots(), useShips(), useShots(), useSea()])}
		<div>game is loading...</div>
	{:then [g, loots, ships, shots, sea]}
		{#await g.connect(wallet.address)}
			<div>connecting to server</div>
		{:then connection}
			<div use:g.canvas></div>
			<Controls />
			<Loots {...loots} />
			<Ships {...ships} />
			<Shots {...shots} />
			<Sea {...sea} />
			<RenderInfo />
		{:catch error}
			{#if error === WalletError.NoExtension}
				<div>install wallet extension</div>
			{:else if error === WalletError.Cancelled}
				<div>you must connect before playing</div>
			{:else}
				{console.error(error)}
				<div>{error}</div>
				<button onclick={() => location.reload()}>retry</button>
			{/if}
		{/await}
	{/await}
{:catch error}
	{console.log(error)}
	<div>could not load the game!{error}</div>
	<button onclick={() => location.reload()}>retry</button>
{/await}
