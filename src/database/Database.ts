import sqlite3 from 'sqlite3';
import path from 'path';
import { ENV } from '../config/env';

export class Database {
    private static instance: sqlite3.Database;

    private constructor() {}

    public static getInstance(): sqlite3.Database {
        if (!Database.instance) {
            const dbPath = path.resolve(process.cwd(), ENV.DB_PATH);
            Database.instance = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    process.exit(1);
                }
            });
            Database.initialize(Database.instance);
        }
        return Database.instance;
    }

    private static initialize(db: sqlite3.Database): void {
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )`, (err) => {
            if (!err) {
                db.run(`INSERT OR IGNORE INTO users (username, password) VALUES ('admin', 'password')`);
            }
        });
    }
}
