import path from "path";
import { fileURLToPath } from "url";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Repo-root `.env` (same file Vite uses). `dev` + `forceReload` match Next’s dev/prod file list and avoid stale cache. */
loadEnvConfig(
  path.join(__dirname, ".."),
  process.env.NODE_ENV !== "production",
  console,
  true,
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /** Served under /mission1 in dev (Vite proxy) and when hosted behind the dossier origin. */
  basePath: "/mission1",
};

export default nextConfig;
