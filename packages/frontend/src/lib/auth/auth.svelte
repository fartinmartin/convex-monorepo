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

	const json = (obj: any) => JSON.stringify(sortObject(obj ?? {}), null, 2);
</script>

{#if auth.isLoading}
	<div>hello, {auth.session?.user?.name}!</div>
	<button disabled>sign out</button>
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
	<div>hello, {auth.session?.user?.name}!</div>
	<button onclick={signOut}>sign out</button>
{/if}

<pre>user {json(auth.session?.user)}</pre>
<pre>session {json(auth.session?.session)}</pre>
<pre>auth {json({
		isLoading: auth.isLoading,
		isAuthenticated: auth.isAuthenticated,
	})}</pre>
