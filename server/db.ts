import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "../shared/schema";

// Get the database URL from environment variables
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create a client
const queryClient = postgres(databaseUrl);

// Initialize drizzle with the client and schema
export const db = drizzle(queryClient, { schema });