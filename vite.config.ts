import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { execSync } from "child_process";

// Получаем информацию о билде
const getBuildInfo = () => {
  const buildTime = new Date().toISOString();
  let gitCommit = "unknown";
  let gitBranch = "unknown";

  try {
    gitCommit = execSync("git rev-parse --short HEAD").toString().trim();
    gitBranch = execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
  } catch {
    // Git не доступен или не в репозитории
  }

  return { buildTime, gitCommit, gitBranch };
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const buildInfo = getBuildInfo();

  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
      proxy: {
        "/ws": {
          target: "ws://localhost:8080",
          ws: true,
          changeOrigin: true,
        },
      },
    },
    plugins: [react()],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      __BUILD_TIME__: JSON.stringify(buildInfo.buildTime),
      __GIT_COMMIT__: JSON.stringify(buildInfo.gitCommit),
      __GIT_BRANCH__: JSON.stringify(buildInfo.gitBranch),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
