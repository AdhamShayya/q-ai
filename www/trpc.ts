import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@src/routers";

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "http://localhost:4000/trpc",
    }),
  ],
});

export const userApi = trpc.user;
