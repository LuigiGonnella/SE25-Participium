import "dotenv/config";
import { app } from "@app";
import { CONFIG } from "@config";
import { logError, logInfo } from "@services/loggingService";
import { Server } from "node:http";
import "reflect-metadata";
import { closeDatabase, initializeDatabase } from "@database";

let server: Server;
 
async function startServer() {
  try {
    await initializeDatabase();
    server = app.listen(CONFIG.APP_PORT, () => {
      logInfo(`Server started on http://localhost:${CONFIG.APP_PORT}`);
      //logInfo(`Swagger UI available at http://localhost:${CONFIG.APP_PORT}${CONFIG.ROUTES.V1_SWAGGER}`);
      logInfo(`DB : ${CONFIG.DB_NAME}`);
    });
  } catch (error) {
    logError("Error in app initialization:", error);
    process.exit(1);
  }
}

function closeServer(): Promise<void> {
  if (server) {
    return new Promise((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve()))
    );
  } else {
    return Promise.resolve();
  }
}

async function shutdown() {
  logInfo("Shutting down server...");

  await closeServer();
  await closeDatabase();

  logInfo("Shutdown complete.");
  process.exit(0);
}

startServer();

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
