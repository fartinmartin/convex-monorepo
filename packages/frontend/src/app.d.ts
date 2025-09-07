import type { ConvexHttpClient } from "convex/browser";
import type { Session } from "$convex/auth";

declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      convex: ConvexHttpClient;
      session: Session;
    }
    interface PageData {
      /* session as sent from server, use `getAuthContext()` for reactive session */
      session: Session;
    }
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
