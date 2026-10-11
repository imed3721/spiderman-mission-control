const fs = require("fs");
const path = require("path");

const SERVER_FILE = path.join(__dirname, "server.js");
const DATABASE_FILE = path.join(__dirname, "init-db.js");

function readSourceFile(filePath, fileName) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required file is missing: ${fileName}`);
  }

  return fs.readFileSync(filePath, "utf8");
}

function runTest(description, testFunction) {
  try {
    testFunction();
    console.log(`PASS: ${description}`);
  } catch (error) {
    console.error(`FAIL: ${description}`);
    throw error;
  }
}

function main() {
  const server = readSourceFile(SERVER_FILE, "server.js");
  const database = readSourceFile(DATABASE_FILE, "init-db.js");

  console.log("Running Spider-Man Mission Control checks...\n");

  // Check that the application has a health endpoint.
  runTest("Health endpoint is configured", () => {
    if (!server.includes("/health")) {
      throw new Error("Health endpoint is missing");
    }
  });

  // Check that the application has a readiness endpoint.
  runTest("Readiness endpoint is configured", () => {
    if (!server.includes("/ready")) {
      throw new Error("Readiness endpoint is missing");
    }
  });

  // Check that the missions API is configured.
  runTest("Missions API endpoint is configured", () => {
    if (!server.includes("/api/missions")) {
      throw new Error("Missions API endpoint is missing");
    }
  });

  // Check that database credentials use AWS Systems Manager Parameter Store.
  runTest("AWS Parameter Store integration is configured", () => {
    if (!server.includes("@aws-sdk/client-ssm")) {
      throw new Error("AWS SSM SDK integration is missing");
    }

    const requiredParameters = [
      "/spiderman/db/host",
      "/spiderman/db/name",
      "/spiderman/db/user",
      "/spiderman/db/password"
    ];

    for (const parameter of requiredParameters) {
      if (!server.includes(parameter)) {
        throw new Error(
          `Required AWS Parameter Store path is missing: ${parameter}`
        );
      }
    }
  });

  // Check that PostgreSQL is configured in the application.
  runTest("PostgreSQL integration is configured", () => {
    if (!server.includes('require("pg")') &&
        !server.includes("require('pg')")) {
      throw new Error("PostgreSQL client integration is missing");
    }
  });

  // Check that the database initialization script creates the missions table.
  runTest("Missions table initialization is configured", () => {
    if (!database.includes("CREATE TABLE IF NOT EXISTS missions")) {
      throw new Error("Missions table initialization is missing");
    }
  });

  console.log("\nAll basic application checks passed.");
}

try {
  main();
} catch (error) {
  console.error(`\nTest suite failed: ${error.message}`);
  process.exitCode = 1;
}
