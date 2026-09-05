import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets the dev server accept requests when reached through a GitHub
  // Codespaces forwarded port.
  allowedDevOrigins: ["*.app.github.dev"],
  experimental: {
    serverActions: {
      // GitHub Codespaces' port-forwarding proxy rewrites the `Origin`
      // header of forwarded requests to `localhost:<port>` (the address
      // it connects to internally) while correctly setting
      // `x-forwarded-host` to the actual public tunnel hostname. Next.js's
      // Server Actions CSRF check compares those two and, since they
      // legitimately differ here, needs `localhost:3000` allowlisted as a
      // trusted origin — not the tunnel hostname itself, which never
      // actually appears in the `Origin` header.
      allowedOrigins: ["localhost:3000"],
    },
  },
};

export default nextConfig;
