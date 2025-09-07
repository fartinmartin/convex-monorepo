<script lang="ts">
	import Input from "$lib/bits/input.svelte";

	let {
		open = $bindable(false),
		signIn,
	}: {
		open: boolean;
		signIn: (input: { email: string; password: string }) => Promise<void>;
	} = $props();

	let email = $state("");
	let password = $state("");
	let status: "idle" | "submitting" | "success" | "error" = $state("idle");
</script>

<dialog {open}>
	<button onclick={() => (open = false)}>close</button>
	<p>convert your anonymous account to a permanent account:</p>
	<form
		onsubmit={async (e) => {
			e.preventDefault();
			try {
				status = "submitting";
				await signIn({ email, password });
				status = "success";
			} catch (error) {
				status = "error";
			}
		}}
	>
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
		<button type="submit" disabled={status === "submitting"}>sign in</button>
	</form>
</dialog>

<style>
	:global(body:has(dialog:modal)) {
		overflow: hidden;
	}

	dialog {
		margin: auto;
		padding: 2rem;
	}

	/* why doesn't this work? */
	dialog::backdrop {
		background: hsl(from gainsboro h s l / 0.25);
		backdrop-filter: blur(1px);
	}

	form {
		display: flex;
		flex-direction: column;
	}
</style>
