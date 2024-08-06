import { defineConfig } from "vite"
import solidPlugin from "vite-plugin-solid"
import api from "./src/api"

import type { Application } from "express"
import type { ViteDevServer } from "vite"

function expressPlugin(app: Application) {
  return {
    name: "express-plugin",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(app)
    },
  }
}

export default defineConfig({
  plugins: [solidPlugin(), expressPlugin(api)],
  build: {
    target: "esnext",
  },
  server: {
    port: 3000,
    host: "0.0.0.0",
  },
})
