import type { AppRouter } from "@src/routers";
import { createTRPCClient, httpBatchLink } from "@trpc/client";

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "http://localhost:4000/trpc",
    }),
  ],
});

export const userApi = trpc.user;
export const vaultApi = trpc.vault;
