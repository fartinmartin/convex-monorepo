// https://github.com/mmailaender/convex-better-auth-svelte/blob/main/src/lib/svelte/client.svelte.ts

import { getContext, setContext } from "svelte";
import type { AuthTokenFetcher, ConvexClient } from "convex/browser";
import type { AuthClient, SessionState } from "./client.types";
import { browser } from "$app/environment";
import type { authClient } from "$lib/auth-client";

const AUTH_CONTEXT_KEY = Symbol("auth-context");
type MyAuthClient = typeof authClient;

type AuthContext = {
  client: MyAuthClient;
  fetchAccessToken: AuthTokenFetcher;
  isLoading: boolean;
  isAuthenticated: boolean;
};

export function getAuthContext() {
  const context = getContext<AuthContext>(AUTH_CONTEXT_KEY);
  if (!context) throw new Error("Have you run `createAuthContext()` yet?");
  return context;
}

export function createAuthContext(options: {
  authClient: MyAuthClient;
  convexClient: ConvexClient;
  initialData?: SessionState["data"] | null;
}) {
  const { authClient, convexClient, initialData } = options;

  const _auth = betterAuth(authClient, initialData);
  const _convex = convex(convexClient, authClient, _auth);

  useOneTimeToken(_auth, authClient);

  setContext<AuthContext>(AUTH_CONTEXT_KEY, {
    client: authClient,
    fetchAccessToken: _convex.fetchAccessToken,
    get isLoading() {
      return _convex.isLoading;
    },
    get isAuthenticated() {
      return _convex.isAuthenticated;
    },
  });
}

function betterAuth(
  authClient: MyAuthClient,
  initialData?: SessionState["data"] | null,
) {
  let sessionData: SessionState["data"] | null = $state(initialData ?? null);
  let sessionPending: boolean = $state(initialData ? false : true);

  authClient.useSession().subscribe((session) => {
    sessionData = session.data;
    sessionPending = session.isPending;
  });

  const isAuthenticated = $derived(sessionData !== null);

  return {
    get sessionData() {
      return sessionData;
    },
    get sessionPending() {
      return sessionPending;
    },
    get isAuthenticated() {
      return isAuthenticated;
    },
  };
}

function convex(
  convexClient: ConvexClient,
  authClient: MyAuthClient,
  _auth: ReturnType<typeof betterAuth>,
) {
  const fetchAccessToken: AuthTokenFetcher = async ({ forceRefreshToken }) => {
    if (forceRefreshToken) return await fetchToken(authClient);
    return null;
  };

  let isConvexAuthenticated: boolean | null = $state(null);

  $effect(() => {
    if (convexClient.disabled) return;

    // TODO: re-sign in anonymously if signed out?
    convexClient.setAuth(
      fetchAccessToken,
      (auth) => (isConvexAuthenticated = auth),
    );
  });

  const isLoading = $derived(
    _auth.sessionPending ||
      (_auth.isAuthenticated && isConvexAuthenticated === null),
  );

  const isAuthenticated = $derived(
    _auth.isAuthenticated && (isConvexAuthenticated ?? false),
  );

  return {
    fetchAccessToken,
    get isConvexAuthenticated() {
      return isConvexAuthenticated;
    },
    get isAuthenticated() {
      return isAuthenticated;
    },
    get isLoading() {
      return isLoading;
    },
  };
}

//

function useOneTimeToken(
  _auth: ReturnType<typeof betterAuth>,
  authClient: AuthClient,
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
    const sessionData = result.data?.session;

    if (sessionData) {
      const headers = { Authorization: `Bearer ${sessionData.token}` };
      await authClient.getSession({ fetchOptions: { headers } });
      authClient.updateSession();
    }

    window.history.replaceState({}, "", url);
  }

  $effect(() => {
    if (_auth.isAuthenticated) handleToken();
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

async function fetchToken(authClient: MyAuthClient) {
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
