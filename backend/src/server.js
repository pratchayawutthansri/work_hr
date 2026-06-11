const app = require("./app");
const env = require("./config/env");
const { connectDatabase } = require("./config/db");

async function start() {
  await connectDatabase();
  app.listen(env.port, () => {
    console.log(`HRMS API running at http://127.0.0.1:${env.port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start HRMS API");
  console.error(error);
  process.exit(1);
});
