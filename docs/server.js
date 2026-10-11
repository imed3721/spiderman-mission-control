const express = require("express");
const path = require("path");
const fs = require("fs");

const {
  SSMClient,
  GetParametersCommand,
} = require("@aws-sdk/client-ssm");

const { Pool } = require("pg");

// ==========================
// Application Configuration
// ==========================

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const AWS_REGION = process.env.AWS_REGION || "eu-west-2";

const SERVICE_NAME = "spiderman-mission-control";
const DB_PORT = Number(process.env.DB_PORT) || 5432;

const CA_CERT_PATH = path.join(
  __dirname,
  "eu-west-2-bundle.pem"
);

let pool;
let server;
let shuttingDown = false;

app.disable("x-powered-by");
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ==========================
// AWS Systems Manager
// ==========================

const REQUIRED_PARAMETERS = [
  "/spiderman/db/host",
  "/spiderman/db/name",
  "/spiderman/db/user",
  "/spiderman/db/password",
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

    if (response.InvalidParameters?.length) {
      throw new Error(
        `Invalid SSM parameters: ${response.InvalidParameters.join(", ")}`
      );
    }

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

    // Verify that the AWS RDS CA bundle is available.
    if (!fs.existsSync(CA_CERT_PATH)) {
      throw new Error(
        `RDS CA certificate bundle not found: ${CA_CERT_PATH}`
      );
    }

    const caCertificate = fs.readFileSync(
      CA_CERT_PATH,
      "utf8"
    );

    pool = new Pool({
      host: parameters["/spiderman/db/host"],
      database: parameters["/spiderman/db/name"],
      user: parameters["/spiderman/db/user"],
      password: parameters["/spiderman/db/password"],
      port: DB_PORT,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 10,
      ssl: {
        rejectUnauthorized: true,
        ca: caCertificate,
      },
    });

    pool.on("error", (error) => {
      console.error(
        "Unexpected PostgreSQL pool error:",
        error.message
      );
    });

    // Confirm database connectivity before accepting traffic.
    await pool.query("SELECT 1");

    console.log("Database connection established.");
  } finally {
    ssm.destroy();
  }
}

// ==========================
// Liveness Check
// ==========================

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: SERVICE_NAME,
  });
});

// ==========================
// Readiness Check
// ==========================

app.get("/ready", async (req, res) => {
  if (!pool || shuttingDown) {
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
    console.error(
      "Database readiness check failed:",
      error.message
    );

    return res.status(503).json({
      status: "not-ready",
      database: "unavailable",
    });
  }
});

// ==========================
// Missions API
// ==========================

app.get("/api/missions", async (req, res) => {
  if (!pool || shuttingDown) {
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
    console.error(
      "Failed to retrieve missions:",
      error.message
    );

    return res.status(500).json({
      error: "Unable to retrieve missions",
    });
  }
});

// ==========================
// Graceful Shutdown
// ==========================

async function shutdown(signal) {
  if (shuttingDown) return;

  shuttingDown = true;

  console.log(
    `${signal} received. Shutting down gracefully.`
  );

  try {
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
      pool = undefined;
    }

    process.exit(0);
  } catch (error) {
    console.error("Shutdown failed:", error.message);
    process.exit(1);
  }
}

// ==========================
// Start Application
// ==========================

async function start() {
  try {
    await loadDatabaseConfiguration();

    server = app.listen(PORT, "0.0.0.0", () => {
      console.log(
        `${SERVICE_NAME} listening on port ${PORT}.`
      );
    });

    server.on("error", (error) => {
      console.error(
        "HTTP server error:",
        error.message
      );

      process.exitCode = 1;
    });
  } catch (error) {
    console.error(
      "Application startup failed:",
      error.message
    );

    if (pool) {
      await pool.end().catch(() => {});
      pool = undefined;
    }

    process.exitCode = 1;
  }
}

// ==========================
// Process Signal Handlers
// ==========================

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

start();
