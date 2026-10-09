const express = require("express");
const path = require("path");
const {
  SSMClient,
  GetParametersCommand,
} = require("@aws-sdk/client-ssm");
const { Pool } = require("pg");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const AWS_REGION = process.env.AWS_REGION || "eu-west-2";

let pool;
let server;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const REQUIRED_PARAMETERS = [
  "/spider-peter/db/host",
  "/spider-peter/db/name",
  "/spider-peter/db/user",
  "/spider-peter/db/password",
];

async function loadDatabaseConfiguration() {
  const ssm = new SSMClient({ region: AWS_REGION });

  try {
    const response = await ssm.send(
      new GetParametersCommand({
        Names: REQUIRED_PARAMETERS,
        WithDecryption: true,
      })
    );

    const parameters = Object.fromEntries(
      (response.Parameters || []).map(({ Name, Value }) => [
        Name,
        Value,
      ])
    );

    const missingParameters = REQUIRED_PARAMETERS.filter(
      (name) => !parameters[name]
    );

    if (missingParameters.length > 0) {
      throw new Error(
        `Missing required SSM parameters: ${missingParameters.join(", ")}`
      );
    }

    pool = new Pool({
      host: parameters["/spider-peter/db/host"],
      database: parameters["/spider-peter/db/name"],
      user: parameters["/spider-peter/db/user"],
      password: parameters["/spider-peter/db/password"],
      port: Number(process.env.DB_PORT) || 5432,
      ssl: {
        rejectUnauthorized: true,
      },
    });

    pool.on("error", (error) => {
      console.error("Unexpected PostgreSQL pool error:", error.message);
    });

    // Verify the database connection before starting the server.
    await pool.query("SELECT 1");

    console.log("Database connection established.");
  } finally {
    ssm.destroy();
  }
}

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "spider-peter-app",
  });
});

app.get("/ready", async (req, res) => {
  if (!pool) {
    return res.status(503).json({
      status: "not-ready",
      database: "unavailable",
    });
  }

  try {
    await pool.query("SELECT 1");

    return res.status(200).json({
      status: "ready",
      database: "connected",
    });
  } catch (error) {
    console.error("Database readiness check failed:", error.message);

    return res.status(503).json({
      status: "not-ready",
      database: "unavailable",
    });
  }
});

app.get("/api/missions", async (req, res) => {
  if (!pool) {
    return res.status(503).json({
      error: "Database is unavailable",
    });
  }

  try {
    const result = await pool.query(`
      SELECT id, name, location, status, priority
      FROM missions
      ORDER BY id
    `);

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Failed to retrieve missions:", error.message);

    return res.status(500).json({
      error: "Unable to retrieve missions",
    });
  }
});

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down gracefully.`);

  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  if (pool) {
    await pool.end();
  }

  process.exit(0);
}

async function start() {
  try {
    await loadDatabaseConfiguration();

    server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`Spider-Peter App listening on port ${PORT}.`);
    });
  } catch (error) {
    console.error("Application startup failed:", error.message);

    if (pool) {
      await pool.end().catch(() => {});
    }

    process.exitCode = 1;
  }
}

process.on("SIGTERM", () => {
  shutdown("SIGTERM").catch((error) => {
    console.error("Shutdown failed:", error.message);
    process.exit(1);
  });
});

process.on("SIGINT", () => {
  shutdown("SIGINT").catch((error) => {
    console.error("Shutdown failed:", error.message);
    process.exit(1);
  });
});

start();
