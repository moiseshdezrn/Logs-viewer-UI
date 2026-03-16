import type { NextConfig } from "next";
import packageJson from "./package.json";

const nextConfig: NextConfig = {
  // Allows configuring the API base URL from package.json or the environment.
  // Prefer the environment variable for CI / runtime overrides.
  env: {
    API_BASE_URL:
      process.env.API_BASE_URL ?? packageJson.baseUrl ?? "/api",
  },
};

export default nextConfig;
