const fs = require("fs");
const path = require("path");

const {
  SSMClient,
  GetParametersCommand,
} = require("@aws-sdk/client-ssm");

const { Pool } = require("pg");

// ==========================
// Application Configuration
// ==========================

const AWS_REGION = process.env.AWS_REGION || "eu-west-2";
const DB_PORT = Number(process.env.DB_PORT) || 5432;

const SERVICE_NAME = "Spider-Man Mission Control";

const CA_CERT_PATH = path.join(
  __dirname,
  "eu-west-2-bundle.pem"
);

// ==========================
// AWS Systems Manager
// ==========================

const REQUIRED_PARAMETERS = [
  "/spiderman/db/host",
  "/spiderman/db/name",
  "/spiderman/db/user",
  "/spiderman/db/password",
];

// ==========================
// Initial Mission Data
// ==========================

const INITIAL_MISSIONS = [
  {
    name: "Stop Green Goblin",
    location: "Queens",
    status: "ACTIVE",
    priority: "HIGH",
  },
  {
    name: "Track Vulture",
    location: "Brooklyn",
    status: "COMPLETE",
    priority: "MEDIUM",
  },
  {
    name: "Investigate Venom",
    location: "Manhattan",
    status: "ACTIVE",
    priority: "HIGH",
  },
  {
    name: "Rescue Civilians",
    location: "Queens",
    status: "COMPLETE",
    priority: "HIGH",
  },
];

// ==========================
// Load Database Configuration
// ==========================

async function getDatabaseConfiguration() {
  const ssm = new SSMClient({
    region: AWS_REGION,
  });

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

    return parameters;
  } finally {
    ssm.destroy();
  }
}

// ==========================
// Create Database Connection
// ==========================

async function createDatabasePool(parameters) {
  if (!fs.existsSync(CA_CERT_PATH)) {
    throw new Error(
      `RDS CA certificate bundle not found: ${CA_CERT_PATH}`
    );
  }

  const caCertificate = fs.readFileSync(
    CA_CERT_PATH,
    "utf8"
  );

  const pool = new Pool({
    host: parameters["/spiderman/db/host"],
    database: parameters["/spiderman/db/name"],
    user: parameters["/spiderman/db/user"],
    password: parameters["/spiderman/db/password"],
    port: DB_PORT,
    connectionTimeoutMillis: 10000,
    ssl: {
      rejectUnauthorized: true,
      ca: caCertificate,
    },
  });

  return pool;
}

// ==========================
// Create Missions Table
// ==========================

async function createMissionsTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS missions (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      location VARCHAR(100) NOT NULL,
      status VARCHAR(30) NOT NULL,
      priority VARCHAR(30) NOT NULL
    );
  `);

  console.log("Missions table is ready.");
}

// ==========================
// Seed Initial Missions
// ==========================

async function seedMissions(pool) {
  const missions = INITIAL_MISSIONS;

  const result = await pool.query(
    `
      INSERT INTO missions (
        name,
        location,
        status,
        priority
      )
      SELECT
        seed.name,
        seed.location,
        seed.status,
        seed.priority
      FROM UNNEST(
        $1::VARCHAR[],
        $2::VARCHAR[],
        $3::VARCHAR[],
        $4::VARCHAR[]
      ) AS seed(name, location, status, priority)
      WHERE NOT EXISTS (
        SELECT 1 FROM missions
      );
    `,
    [
      missions.map((mission) => mission.name),
      missions.map((mission) => mission.location),
      missions.map((mission) => mission.status),
      missions.map((mission) => mission.priority),
    ]
  );

  if (result.rowCount > 0) {
    console.log(
      `Inserted ${result.rowCount} initial missions.`
    );
  } else {
    console.log(
      "Mission data already exists. Skipping seed."
    );
  }
}

// ==========================
// Initialize Database
// ==========================

async function initializeDatabase() {
  let pool;

  try {
    console.log(
      `Initializing ${SERVICE_NAME} database...`
    );

    const parameters = await getDatabaseConfiguration();

    pool = await createDatabasePool(parameters);

    // Verify database connectivity.
    await pool.query("SELECT 1");

    console.log("Database connection established.");

    // Prepare the database and insert sample data.
    await createMissionsTable(pool);
    await seedMissions(pool);

    console.log(
      `${SERVICE_NAME} database initialized successfully.`
    );
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// ==========================
// Handle Execution
// ==========================

initializeDatabase().catch((error) => {
  console.error(
    "Database initialization failed:",
    error.message
  );

  process.exitCode = 1;
});
