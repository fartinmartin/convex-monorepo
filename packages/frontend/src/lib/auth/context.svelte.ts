import { getContext, setContext } from "svelte";
import { browser } from "$app/environment";

import type { AuthTokenFetcher, ConvexClient } from "convex/browser";
import type { GenericAuthClient } from "./context.types";
import type { Session } from "$convex/auth";
import type { authClient } from "$lib/auth/client";

const AUTH_CONTEXT_KEY = Symbol("auth-context");
type AuthClient = typeof authClient;

export function getAuthContext() {
  const context = getContext<AuthContext>(AUTH_CONTEXT_KEY);
  if (!context) throw new Error("Have you run `createAuthContext()` yet?");
  return context;
}

export function createAuthContext(options: {
  authClient: AuthClient;
  convexClient: ConvexClient;
  initialData?: Session;
}) {
  const authContext = new AuthContext(options);
  setContext<AuthContext>(AUTH_CONTEXT_KEY, authContext);
}

class AuthContext {
  client: AuthClient;
  fetchAccessToken: AuthTokenFetcher;
  isLoading: boolean;
  isAuthenticated: boolean;
  session: NonNullable<Session>["session"] | null;
  user: NonNullable<Session>["user"] | null;

  constructor(options: {
    authClient: AuthClient;
    convexClient: ConvexClient;
    initialData?: Session;
  }) {
    const { authClient, convexClient, initialData } = options;

    const auth = new AuthState(authClient, initialData);
    const convex = new ConvexState(convexClient, auth);
    useOneTimeToken(auth, authClient);

    this.client = authClient;
    this.fetchAccessToken = convex.fetchAccessToken;
    this.session = $derived(auth.session?.session ?? null);
    this.user = $derived(auth.session?.user ?? null);

    this.isLoading = $derived.by(() => {
      const convexIsLoading = convex.isAuthenticated === null;
      const isAuthenticated = auth.isAuthenticated && convexIsLoading;
      return auth.isPending || isAuthenticated;
    });

    this.isAuthenticated = $derived.by(() => {
      const convexIsAuthenticated = convex.isAuthenticated ?? false;
      return auth.isAuthenticated && convexIsAuthenticated;
    });
  }
}

class AuthState {
  #initialized: boolean;

  client: AuthClient;
  session: Session | null;
  isPending: boolean;
  isAuthenticated: boolean;

  constructor(authClient: AuthClient, initialData?: Session) {
    this.#initialized = $state(false);

    this.client = authClient;
    this.session = $state(initialData ?? null);
    this.isPending = $state(initialData ? false : true);

    authClient.useSession().subscribe((update) => {
      if (initialData && !this.#initialized && update.data === null) return; // skip first update if initialData is provided // todo: how flaky is this?
      this.#initialized = true;

      this.session = update.data as Session; // enriched with app's user data via customSession plugin! types are not updating (likely because of convex plugin?)
      this.isPending = update.isPending;
    });

    this.isAuthenticated = $derived(this.session !== null);
  }
}

class ConvexState {
  fetchAccessToken: AuthTokenFetcher;
  isAuthenticated: boolean | null;

  constructor(convexClient: ConvexClient, auth: AuthState) {
    this.fetchAccessToken = async ({ forceRefreshToken }) => {
      if (forceRefreshToken) return await fetchToken(auth.client);
      return null;
    };

    this.isAuthenticated = $state(null);

    $effect(() => {
      if (convexClient.disabled) return;

      convexClient.setAuth(
        this.fetchAccessToken,
        (isAuthenticated) => (this.isAuthenticated = isAuthenticated),
      );
    });
  }
}

//

async function createForceRefreshToken(authClient: AuthClient) {
  return (async ({ forceRefreshToken }) => {
    if (forceRefreshToken) return await fetchToken(authClient);
    return null;
  }) as AuthTokenFetcher;
}

async function fetchToken(authClient: AuthClient) {
  try {
    const { data } = await authClient.convex.token();
    return data?.token ?? null;
  } catch (error) {
    return null;
  }
}

//

/* haven't tested this... */
function useOneTimeToken(auth: AuthState, authClient: GenericAuthClient) {
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
