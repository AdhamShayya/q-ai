import type { AppRouter } from "@src/routers";
import { createTRPCClient, httpBatchLink } from "@trpc/client";

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "http://localhost:4000/trpc",
      fetch(url, opts) {
        return fetch(url, { ...opts, credentials: "include" });
      },
    }),
  ],
});

export const userApi = trpc.user;
export const vaultApi = trpc.vault;
export const conversationApi = trpc.conversation;
export const personaApi = trpc.persona;
