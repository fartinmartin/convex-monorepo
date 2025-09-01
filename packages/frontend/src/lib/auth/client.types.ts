import type { BetterAuthClientPlugin, ClientOptions } from "better-auth";
import type { createAuthClient } from "better-auth/svelte";
import type {
  crossDomainClient,
  convexClient,
} from "@convex-dev/better-auth/client/plugins";

type CrossDomainClient = ReturnType<typeof crossDomainClient>;
type ConvexClientBetterAuth = ReturnType<typeof convexClient>;

type PluginsWithCrossDomain = (
  | CrossDomainClient
  | ConvexClientBetterAuth
  | BetterAuthClientPlugin
)[];

type PluginsWithoutCrossDomain = (
  | ConvexClientBetterAuth
  | BetterAuthClientPlugin
)[];

type AuthClientWithPlugins<
  Plugins extends PluginsWithCrossDomain | PluginsWithoutCrossDomain,
> = ReturnType<
  typeof createAuthClient<
    ClientOptions & {
      plugins: Plugins;
    }
  >
>;

export type GenericAuthClient =
  | AuthClientWithPlugins<PluginsWithCrossDomain>
  | AuthClientWithPlugins<PluginsWithoutCrossDomain>;
