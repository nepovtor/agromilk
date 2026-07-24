import { Client } from "pg";

const DEFAULT_TEST_DATABASE_URL =
  "postgresql://postgres:postgres@127.0.0.1:55432/landing_admin_test";

const quoteIdentifier = (value: string) => `"${value.replaceAll('"', '""')}"`;

const databaseUrl = process.env.DATABASE_URL || DEFAULT_TEST_DATABASE_URL;
const url = new URL(databaseUrl);
const databaseName = url.pathname.replace(/^\//, "");

if (databaseName.endsWith("_test")) {
  const maintenanceUrl = new URL(url);
  maintenanceUrl.pathname = "/postgres";

  const client = new Client({ connectionString: maintenanceUrl.toString() });
  await client.connect();

  try {
    const existing = await client.query("select 1 from pg_database where datname = $1", [
      databaseName,
    ]);
    if (!existing.rowCount) {
      await client.query(`create database ${quoteIdentifier(databaseName)}`);
    }
  } finally {
    await client.end();
  }
}
