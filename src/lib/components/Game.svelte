<script lang="ts">
	import { canvas } from '$lib/components/T';
	import { gameState } from './GameState.svelte';
	import { wallet, WalletError } from './Wallet';
	import Controls from './Controls.svelte';
	import Loots, { loots } from './Instances/Loots.svelte';
	import Ships, { ships } from './Instances/Ships.svelte';
	import Sea from './Sea.svelte';

	const startPolling = () => {
		setInterval(() => gameState.fetch(), 1000);
	};
</script>

{#await wallet()}
	<div>waiting for wallet...</div>
{:then wallet}
	{#await Promise.all([gameState.load(wallet.address), loots(), ships()])}
		<div>game is loading...</div>
	{:then [_, loots, ships]}
		{startPolling()}
		<div use:canvas></div>
		<Controls />
		<Loots {loots} />
		<Ships {ships} />
		<Sea />
	{:catch}
		<div>could not load the game!</div>
		<button onclick={() => location.reload()}>retry</button>
	{/await}
{:catch error}
	{#if error === WalletError.NoExtension}
		<div>install wallet extension</div>
	{:else if error === WalletError.Cancelled}
		<div>you must connect before playing</div>
	{:else}
		<div>{error}</div>
	{/if}
{/await}
