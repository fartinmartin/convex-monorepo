import { createAuthClient } from "better-auth/svelte";
import {
  anonymousClient,
  customSessionClient,
  inferAdditionalFields,
} from "better-auth/client/plugins";
import { convexClient } from "@convex-dev/better-auth/client/plugins";
import type { AuthWithoutCtx } from "$lib/auth/server";

export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields<AuthWithoutCtx>(),
    anonymousClient(),
    convexClient<AuthWithoutCtx>(),
    customSessionClient<AuthWithoutCtx>(),
  ],

  // fetchOptions: {}
});
