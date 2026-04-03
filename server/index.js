import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 3000);
const DB_PATH = process.env.DB_PATH ?? path.resolve(__dirname, "../data/map-designer.sqlite");

const app = createApp({ dbPath: DB_PATH });

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Map Designer API listening on http://0.0.0.0:${PORT}`);
  console.log(`Database: ${DB_PATH}`);
});
