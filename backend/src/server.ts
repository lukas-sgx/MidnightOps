import app  from "./app";
import { connectRedis } from "./config/redis";

const PORT = 3000;

async function startServer() {
  await connectRedis();
  app.listen(PORT, () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();