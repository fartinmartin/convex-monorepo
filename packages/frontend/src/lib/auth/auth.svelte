<script lang="ts">
	import { page } from "$app/state";
	import { getAuthContext } from "./client.svelte";
	import AuthForm from "./auth-form.svelte";

	// TODO: get user/session from authContenxt
	// TODO: make use of initial page.data within authContext so we don't have loading state?
	const auth = getAuthContext();
	const user = page.data.user;

	async function signOut() {
		try {
			await auth.client.signOut();
		} catch (error) {
			console.error("sign out error:", error);
		}
	}
</script>

{#if auth.isLoading}
	<div>
		<div>hello, {user?.name}!</div>
		<div>loading...</div>
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
		<div>hello, {user?.name}!</div>
		<button onclick={signOut}>sign out</button>
	</div>
{/if}
