import type { Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";

import { ConvexHttpClient } from "convex/browser";
import { PUBLIC_CONVEX_API_URL } from "$env/static/public";
import { getCookie, getToken, signInAnonymous } from "$lib/auth";
import { api } from "$convex/_generated/api";

const convexHandle: Handle = async ({ event, resolve }) => {
  event.locals.convex = new ConvexHttpClient(PUBLIC_CONVEX_API_URL);
  return resolve(event);
};

const authHandle: Handle = async ({ event, resolve }) => {
  if (event.url.pathname.startsWith("/api/auth")) {
    return resolve(event);
  }

  const { convex } = event.locals;

  // prettier-ignore
  const setLocals = async ({ user, session }: Partial<App.Locals> = {}) => {
    event.locals.user = user ?? (await convex.query(api.auth.getCurrentUser, {}));
    event.locals.session = session ?? (await convex.query(api.auth.getCurrentSession, {}));
  };

  let token = getToken(event) ?? (await signInAnonymous(event));

  if (token) {
    convex.setAuth(token);
    const user = await convex.query(api.auth.getCurrentUser, {});

    if (user) {
      await setLocals({ user });
    } else {
      // token is invalid/expired, clear it and sign in anonymously
      event.cookies.delete(getCookie().name, { path: "/" });
      token = await signInAnonymous(event);

      if (token) {
        convex.setAuth(token);
        await setLocals();
      }
    }
  }

  return await resolve(event);
};

export const handle = sequence(convexHandle, authHandle);
