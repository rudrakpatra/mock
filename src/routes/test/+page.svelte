<script>
	let cnt = $state(0);
</script>

{#await cnt}
	Loading...
{:then _}
	{cnt}
	<button onclick={() => cnt++}>click me</button>
{/await}
