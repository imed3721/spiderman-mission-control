const {
  SSMClient,
  GetParametersCommand,
} = require("@aws-sdk/client-ssm");
const { Pool } = require("pg");

const AWS_REGION = process.env.AWS_REGION || "eu-west-2";

const REQUIRED_PARAMETERS = [
  "/spiderman/db/host",
  "/spiderman/db/name",
  "/spiderman/db/user",
  "/spiderman/db/password",
];

const INITIAL_MISSIONS = [
  ["Stop Green Goblin", "Queens", "ACTIVE", "HIGH"],
  ["Track Vulture", "Brooklyn", "COMPLETE", "MEDIUM"],
  ["Investigate Venom", "Manhattan", "ACTIVE", "HIGH"],
  ["Rescue Civilians", "Queens", "COMPLETE", "HIGH"],
];

async function getDatabaseConfiguration() {
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

    return parameters;
  } finally {
    ssm.destroy();
  }
}

async function initializeDatabase() {
  const values = await getDatabaseConfiguration();

  const pool = new Pool({
    host: values["/spiderman/db/host"],
    database: values["/spiderman/db/name"],
    user: values["/spiderman/db/user"],
    password: values["/spiderman/db/password"],
    port: Number(process.env.DB_PORT) || 5432,
    ssl: {
      rejectUnauthorized: true,
    },
  });

  try {
    // Verify that PostgreSQL is reachable.
    await pool.query("SELECT 1");

    // Create the missions table if it does not exist.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS missions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        location VARCHAR(100) NOT NULL,
        status VARCHAR(30) NOT NULL,
        priority VARCHAR(30) NOT NULL
      );
    `);

    // Seed the table only if it contains no mission records.
    await pool.query(
      `
        INSERT INTO missions (name, location, status, priority)
        SELECT name, location, status, priority
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
        INITIAL_MISSIONS.map(([name]) => name),
        INITIAL_MISSIONS.map(([, location]) => location),
        INITIAL_MISSIONS.map(([, , status]) => status),
        INITIAL_MISSIONS.map(([, , , priority]) => priority),
      ]
    );

    console.log("Spider-Man database initialized successfully.");
  } finally {
    await pool.end();
  }
}

initializeDatabase().catch((error) => {
  console.error("Database initialization failed:", error.message);
  process.exitCode = 1;
});
