<script lang="ts">
	import { page } from "$app/state";
	import favicon from "$lib/assets/favicon.svg";

	import { setupConvex, useConvexClient } from "convex-svelte";
	import { PUBLIC_CONVEX_API_URL } from "$env/static/public";

	import { authClient } from "$lib/auth-client";
	import { createAuthContext } from "$lib/auth/client.svelte";

	let { children } = $props();

	setupConvex(PUBLIC_CONVEX_API_URL);

	createAuthContext({
		authClient,
		convexClient: useConvexClient(),
		initialData: page.data.session,
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}

<style>
	:global(*) {
		font-family: inherit;
	}

	:global(*) {
		margin: 0;
		margin-bottom: 1rem;
	}

	:global(body) {
		font-family: monospace;
		padding: 1rem;
	}
</style>
