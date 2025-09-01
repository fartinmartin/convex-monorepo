import type { Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";

import { ConvexHttpClient } from "convex/browser";
import { PUBLIC_CONVEX_API_URL } from "$env/static/public";
import type { Session } from "$convex/auth";
import { api } from "$convex/_generated/api";
import { getCookie, getToken, signInAnonymous } from "$lib/auth";

const convexHandle: Handle = async ({ event, resolve }) => {
  event.locals.convex = new ConvexHttpClient(PUBLIC_CONVEX_API_URL);
  return resolve(event);
};

const authHandle: Handle = async ({ event, resolve }) => {
  if (event.url.pathname.startsWith("/api/auth")) {
    return resolve(event);
  }

  const { convex } = event.locals;

  const getSession = () => convex.query(api.auth.getCurrentSession, {});

  const setLocals = async (session?: Session) => {
    event.locals.session = session ?? (await getSession());
  };

  let token = getToken(event) ?? (await signInAnonymous(event));

  if (token) {
    convex.setAuth(token);
    const session = await getSession();

    if (session) {
      await setLocals(session);
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
