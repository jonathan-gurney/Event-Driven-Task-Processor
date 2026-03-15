import { buildApp } from "./app.js";

async function start(): Promise<void> {
  const app = buildApp();

  try {
    const address = await app.listen({
      host: "0.0.0.0",
      port: Number(process.env.PORT ?? 3000)
    });

    app.log.info(`Server listening at ${address}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void start();
