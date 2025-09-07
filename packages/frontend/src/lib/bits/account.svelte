<script lang="ts">
	import { getAuthContext } from "$lib/auth/context.svelte";
	import Input from "./input.svelte";

	let { id }: { id: string } = $props();

	const auth = getAuthContext();

	const modes = ["sign in", "sign up", "sign out"] as const;
	let active: (typeof modes)[number] = $state("sign in");

	let email = $state("");
	let password = $state("");
	let status: "idle" | "submitting" | "success" | "error" = $state("idle");

	const messages = $derived({
		["sign in"]: `sign into your permanent account. <span>optionally merge the current anonymous account into your account?</span>`,
		["sign up"]: `convert the current anonymous account into a new permanent account.`,
		["signed in"]: `you're already signed in! <span>you can only sign out right now :)</span>`,
		["sign out"]: `sign out of ${auth.user?.isAnonymous ? "the current anonymous account" : "your account"}. <span>a new anonymous account will be created.</span>`,
	});

	async function signUp(input: { email: string; password: string }) {
		try {
			await auth.client.signUp.email({
				...input,
				name: (auth.user?.name ?? "") + "+legit",
			});
		} catch (error) {
			alert("sign in error:\n" + error);
		}
	}

	async function signIn(input: { email: string; password: string }) {
		try {
			await auth.client.signIn.email(input, {
				// todo: is this the best way to have a single sign in/up form?
				// onError: async () => await signUp(input),
			});
		} catch (error) {
			alert("sign in error:\n" + error);
		}
	}

	async function signOut() {
		try {
			await auth.client.signOut();
			await auth.client.signIn.anonymous();
		} catch (error) {
			alert("sign out error:\n" + error);
		}
	}

	async function onsubmit(event: Event) {
		event.preventDefault();
		try {
			status = "submitting";

			if (active === "sign in") {
				await signIn({ email, password });
			} else if (active === "sign up") {
				await signUp({ email, password });
			}

			status = "success";
		} catch {
			status = "error";
		}
	}
</script>

<div {id} popover>
	<ul>
		{#each modes as mode}
			<li class:active={active === mode}>
				<button onclick={() => (active = mode)}>{mode}</button>
			</li>
		{/each}
	</ul>

	<div class="content">
		{#if active === "sign out"}
			<p>{@html messages[active]}</p>
			<button onclick={signOut}>sign out</button>
		{:else if auth.user?.isAnonymous}
			<p>{@html messages[active]}</p>
			<form {onsubmit}>
				<Input
					type="email"
					bind:value={email}
					placeholder="example@email.com"
					required
				/>
				<Input
					type="password"
					bind:value={password}
					placeholder="hunter2"
					required
				/>
				<button type="submit" disabled={status === "submitting"}>
					{active}
				</button>
			</form>
		{:else}
			<p>{@html messages["signed in"]}</p>
		{/if}
	</div>
</div>

<style>
	[popover]:popover-open {
		inset: unset;
		top: 3rem;
		right: 1rem;
		padding: 1rem;
		width: 400px;
	}

	ul,
	li {
		margin: 0;
		padding: 0;
	}

	ul {
		list-style: none;
		display: flex;
	}

	li {
		flex-basis: 100%;
	}

	li button {
		width: 100%;
		padding: 0.5rem 1rem;
		padding-top: calc(0.5rem + 4px);
		background: ghostwhite;
		border: none;
		border-bottom: 4px solid transparent;
	}

	li.active button {
		background: plum;
		border-bottom-color: mediumorchid;
		color: white;
	}

	.content {
		margin-top: 1rem;
	}

	.content :global(span) {
		opacity: 0.5;
	}
</style>
