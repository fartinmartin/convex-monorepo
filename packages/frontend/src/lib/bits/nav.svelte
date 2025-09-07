<script lang="ts">
	import { getAuthContext } from "$lib/auth/context.svelte";
	import Account from "./account.svelte";

	const auth = getAuthContext();
</script>

<nav>
	<div>hello, {auth.user?.name}!</div>
	<div class="menu-container">
		<button popovertarget="account">account</button>
		<Account id="account" />
	</div>
</nav>

<style>
	nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	nav * {
		margin-bottom: 1rem;
	}

	.menu-container {
		position: relative;
		margin-bottom: 0;
	}
</style>
