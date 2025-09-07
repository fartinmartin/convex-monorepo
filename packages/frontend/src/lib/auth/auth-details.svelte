<script lang="ts">
	import { getAuthContext } from "./context.svelte";

	const auth = getAuthContext();
	const isLoading = $derived(auth.isLoading);
	const isAuthenticated = $derived(auth.isAuthenticated);

	function sortObject<T extends Record<string, any>>(obj: T | null): T {
		const entries = Object.entries(obj ?? {});
		const sortedEntries = entries.sort(([a], [b]) => a.localeCompare(b));
		return Object.fromEntries(sortedEntries) as T;
	}

	const json = (obj: any) => JSON.stringify(obj, null, 2);
</script>

<details open>
	<summary>auth</summary>
	<div>
		<pre>user {json(sortObject(auth.user))}</pre>
		<pre>session {json(sortObject(auth.session))}</pre>
		<pre>auth {json({ isLoading, isAuthenticated })}</pre>
	</div>
</details>

<style>
	summary {
		margin: -1rem;
		padding: 1rem;
		border-top: 1px solid gainsboro;

		cursor: pointer;
		user-select: none;
	}

	summary:hover {
		background: plum;
		color: white;
	}

	details {
		margin-top: 1rem;
	}

	details div {
		margin-top: 1.5rem;
	}
</style>
