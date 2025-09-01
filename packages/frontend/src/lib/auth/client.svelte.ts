// https://github.com/mmailaender/convex-better-auth-svelte/blob/main/src/lib/svelte/client.svelte.ts

import { getContext, setContext } from "svelte";
import type { AuthTokenFetcher, ConvexClient } from "convex/browser";
import type { GenericAuthClient, SessionState } from "./client.types";
import { browser } from "$app/environment";
import type { authClient } from "$lib/auth-client";

const AUTH_CONTEXT_KEY = Symbol("auth-context");
type AuthClient = typeof authClient;

type AuthContext = {
  client: AuthClient;
  fetchAccessToken: AuthTokenFetcher;
  isLoading: boolean;
  isAuthenticated: boolean;
  // todo: is this "generic" session data? should we type it like we type AuthClient vs GenericAuthClient?
  session: SessionState["data"] | null;
};

export function getAuthContext() {
  const context = getContext<AuthContext>(AUTH_CONTEXT_KEY);
  if (!context) throw new Error("Have you run `createAuthContext()` yet?");
  return context;
}

export function createAuthContext(options: {
  authClient: AuthClient;
  convexClient: ConvexClient;
  initialData?: SessionState["data"] | null;
}) {
  const { authClient, convexClient, initialData } = options;

  const auth = createAuthState(authClient, initialData);
  const convex = createConvexState(convexClient, authClient);

  const isLoading = $derived(
    auth.isPending || (auth.isAuthenticated && convex.isAuthenticated === null),
  );

  const isAuthenticated = $derived(
    auth.isAuthenticated && (convex.isAuthenticated ?? false),
  );

  useOneTimeToken(auth, authClient);

  // prettier-ignore
  setContext<AuthContext>(AUTH_CONTEXT_KEY, {
    client: authClient,
    fetchAccessToken: convex.fetchAccessToken,
    get isLoading() { return isLoading; },
    get isAuthenticated() { return isAuthenticated; },
    get session() { return auth.session; },
  });
}

function createAuthState(
  authClient: AuthClient,
  initialData?: SessionState["data"] | null,
) {
  let session: SessionState["data"] | null = $state(initialData ?? null);
  let isPending: boolean = $state(initialData ? false : true);

  authClient.useSession().subscribe((update) => {
    if (update.data) session = update.data;
    isPending = update.isPending;
  });

  const isAuthenticated = $derived(session !== null);

  // prettier-ignore
  return {
    get session() { return session; },
    get isPending() { return isPending; },
    get isAuthenticated() { return isAuthenticated; },
  };
}

function createConvexState(convexClient: ConvexClient, authClient: AuthClient) {
  const fetchAccessToken: AuthTokenFetcher = async ({ forceRefreshToken }) => {
    if (forceRefreshToken) return await fetchToken(authClient);
    return null;
  };

  let isAuthenticated: boolean | null = $state(null);

  $effect(() => {
    if (convexClient.disabled) return;
    // todo: re-sign in anonymously if signed out?
    convexClient.setAuth(fetchAccessToken, (auth) => (isAuthenticated = auth));
  });

  // prettier-ignore
  return {
    fetchAccessToken,
    get isAuthenticated() { return isAuthenticated; },
  };
}

//

function useOneTimeToken(
  auth: ReturnType<typeof createAuthState>,
  authClient: GenericAuthClient,
) {
  if (!browser) return;

  async function handleToken() {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("ott");
    if (!token || !("crossDomain" in authClient)) return;

    url.searchParams.delete("ott");

    const result = await authClient.crossDomain?.oneTimeToken.verify({
      token,
    });
    const session = result.data?.session;

    if (session) {
      const headers = { Authorization: `Bearer ${session.token}` };
      await authClient.getSession({ fetchOptions: { headers } });
      authClient.updateSession();
    }

    window.history.replaceState({}, "", url);
  }

  $effect(() => {
    if (auth.isAuthenticated) handleToken();
  });

  const onUrlChange = () => handleToken();
  window.addEventListener("popstate", onUrlChange);
  window.addEventListener("pushstate", onUrlChange);

  return () => {
    window.removeEventListener("popstate", onUrlChange);
    window.removeEventListener("pushstate", onUrlChange);
  };
}

//

async function fetchToken(authClient: AuthClient) {
  try {
    const { data } = await authClient.convex.token();
    return data?.token ?? null;
  } catch (error) {
    return null;
  }
}

// https://github.com/sindresorhus/is-network-error/blob/main/index.js
function isNetworkError(error: unknown): error is TypeError {
  const objectToString = Object.prototype.toString;

  const isError = (value: unknown): value is TypeError =>
    objectToString.call(value) === "[object Error]";

  const errorMessages = new Set([
    "network error", // chrome
    "Failed to fetch", // chrome
    "NetworkError when attempting to fetch resource.", // firefox
    "The Internet connection appears to be offline.", // safari 16
    "Load failed", // safari 17+
    "Network request failed", // `cross-fetch`
    "fetch failed", // undici (node.js)
    "terminated", // undici (node.js)
  ]);

  const isValid =
    error &&
    isError(error) &&
    error.name === "TypeError" &&
    typeof error.message === "string";

  if (!isValid) {
    return false;
  }

  // we do an extra check for safari 17+ as it has a very generic error message.
  // network errors in safari have no stack.
  if (error.message === "Load failed") {
    return error.stack === undefined;
  }

  return errorMessages.has(error.message);
}
