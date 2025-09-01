<script lang="ts">
	import { getAuthContext } from "./client.svelte";
	import AuthForm from "./auth-form.svelte";

	const auth = getAuthContext();

	async function signOut() {
		try {
			await auth.client.signOut();
		} catch (error) {
			console.error("sign out error:", error);
		}
	}

	function sortObject<T extends Record<string, any>>(obj: T): T {
		const entries = Object.entries(obj);
		const sortedEntries = entries.sort(([a], [b]) => a.localeCompare(b));
		return Object.fromEntries(sortedEntries) as T;
	}
</script>

{#if auth.isLoading}
	<div>
		<div>hello, {auth.session?.user?.name}!</div>
		<button disabled>sign out</button>
	</div>
{:else if !auth.isAuthenticated}
	<AuthForm
		signIn={async ({ email, password }) => {
			await auth.client.signIn.email(
				{ email, password },
				{ onError: (ctx) => alert(ctx.error.message) },
			);
		}}
		signUp={async ({ name, email, password }) => {
			await auth.client.signUp.email(
				{ name, email, password },
				{ onError: (ctx) => alert(ctx.error.message) },
			);
		}}
	/>
{:else if auth.isAuthenticated}
	<div>
		<div>hello, {auth.session?.user?.name}!</div>
		<button onclick={signOut}>sign out</button>
	</div>
{/if}

<pre>{JSON.stringify(sortObject(auth.session?.user ?? {}), null, 2)}</pre>
<pre>{JSON.stringify(sortObject(auth.session?.session ?? {}), null, 2)}</pre>
<pre>{JSON.stringify(
		{ isLoading: auth.isLoading, isAuthenticated: auth.isAuthenticated },
		null,
		2,
	)}</pre>

<style>
	* {
		margin-bottom: 1rem;
	}
</style>
