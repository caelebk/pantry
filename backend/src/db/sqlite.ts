import { DB } from "@sqlite";

const db = new DB("pantry.db");

// create tables
db.execute(`
CREATE TABLE IF NOT EXISTS inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT,
  purchaseDate TEXT,
  bestBeforeDate TEXT
);
`);

export default db;
