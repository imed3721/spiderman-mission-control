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

  console.log("Running Spider-Peter App checks...\n");

  runTest("Health endpoint is configured", () => {
    if (!server.includes("/health")) {
      throw new Error("Health endpoint is missing");
    }
  });

  runTest("Missions API endpoint is configured", () => {
    if (!server.includes("/api/missions")) {
      throw new Error("Missions API endpoint is missing");
    }
  });

  runTest("Database initialization is configured", () => {
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
