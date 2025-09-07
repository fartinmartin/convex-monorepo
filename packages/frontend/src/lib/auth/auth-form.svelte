<script lang="ts">
	import Input from "$lib/bits/input.svelte";

	let {
		signIn,
		signUp,
	}: {
		signIn: (input: { email: string; password: string }) => Promise<void>;
		signUp: (input: {
			name: string;
			email: string;
			password: string;
		}) => Promise<void>;
	} = $props();

	let mode = $state<"sign-in" | "sign-up">("sign-in");
	let name = $state("");
	let email = $state("");
	let password = $state("");

	function toggle() {
		mode = mode === "sign-in" ? "sign-up" : "sign-in";
		name = email = password = "";
	}

	async function onsubmit(event: Event, cb: () => Promise<void>) {
		event.preventDefault();
		await cb();
	}
</script>

<h2>{mode}</h2>

{#snippet input(props: {
	id: string;
	type: string;
	placeholder: string;
	value: string;
	oninput: (event: Event) => void;
	required: boolean;
})}
	<label for={props.id}> <input {...props} /> </label>
{/snippet}

{#if mode === "sign-in"}
	<form onsubmit={(e) => onsubmit(e, () => signIn({ email, password }))}>
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
		<button type="submit">sign in</button>
	</form>
	<p>don't have an account?</p>
{:else}
	<form onsubmit={(e) => onsubmit(e, () => signUp({ name, email, password }))}>
		<Input type="name" bind:value={name} placeholder="coolname" required />
		<Input
			type="password"
			bind:value={password}
			placeholder="hunter2"
			required
		/>
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
		<button type="submit">sign in</button>
		<p>already have an account?</p>
	</form>
{/if}

<button type="button" onclick={toggle}
	>{mode === "sign-in" ? "sign up" : "sign in"}</button
>
