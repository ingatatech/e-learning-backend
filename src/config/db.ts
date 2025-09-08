import { DataSource } from "typeorm";
import dotenv from "dotenv";

dotenv.config();

const isDev = process.env.NODE_ENV !== "production";


export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DB_URL,
  synchronize: true,
  logging: false,
  entities: [isDev ? "src/database/models/**/*.ts" : "dist/database/models/**/*.js"],
  migrations: [isDev ? "src/database/migrations/*.ts" : "dist/database/migrations/*.js"],
  extra: {
    connectionTimeoutMillis: 30000, 
  },
  ssl: {
    rejectUnauthorized: true,
  },
  schema: 'public',
});