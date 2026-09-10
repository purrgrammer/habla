import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  // `~/` comes from tsconfig. Vite 8 resolves tsconfig paths natively, so the
  // vite-tsconfig-paths plugin this replaced is no longer a dependency.
  resolve: { tsconfigPaths: true },
  plugins: [tailwindcss(), reactRouter()],
});
