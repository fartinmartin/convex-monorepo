<script lang="ts">
	import type { HTMLInputAttributes } from "svelte/elements";

	let { value = $bindable(), ...props }: HTMLInputAttributes = $props();
	const id = props.id ?? props.name ?? props.type;
</script>

<label for={id}>
	{id}
	<input {...props} {id} bind:value />
</label>

<style>
	label {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	input {
		padding: 0.5rem;
		border: 1px solid gainsboro;
	}
</style>
