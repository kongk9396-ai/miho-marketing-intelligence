import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
      // Vitest doesn't set the "react-server" export condition Next.js uses,
      // so "server-only" would resolve to its throwing variant. Point it at
      // the package's own no-op build instead (same one Next uses for RSC).
      "server-only": path.resolve(import.meta.dirname, "node_modules/server-only/empty.js"),
    },
  },
});
