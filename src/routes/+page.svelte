<script lang="ts">
	import ExampleClient from '$lib/worker/ExampleClient';
	let a = $state(NaN);
	let b = $state(NaN);
</script>

<h1>Welcome to SvelteKit</h1>
<h2>Worker Support!</h2>
<div>
	{#await ExampleClient.load()}
		loading worker...
	{:then client}
		<div>worker loaded!</div>
		<input type="number" bind:value={a} /> + <input type="number" bind:value={b} /> =
		{#await client.add(a, b)}
			<input type="text" value={`${a} + ${b}`} readonly />
		{:then sum}
			<input type="number" value={sum} readonly />
		{/await}
	{:catch error}
		<div>{error}</div>
	{/await}
</div>
