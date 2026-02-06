import 'dotenv/config';
import app  from "./app";
import { connectRedis } from "./config/redis";
import { startEscalationWorker } from "./services/escalationWorker";

const PORT = 3000;

async function startServer() {
  await connectRedis();
  startEscalationWorker(); // Start every minute by default
  app.listen(PORT, () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();