import DatabaseConstructor, { Database } from 'better-sqlite3';
import path from 'path';
import { ENV } from '../config/env';

export class DatabaseManager {
    private static instance: Database;

    private constructor() {}

    public static getInstance(): Database {
        if (!DatabaseManager.instance) {
            const dbPath = path.resolve(process.cwd(), ENV.DB_PATH);
            try {
                DatabaseManager.instance = new DatabaseConstructor(dbPath);
                DatabaseManager.initialize(DatabaseManager.instance);
            } catch (err: any) {
                console.error('CRITICAL: SQLite failure:', err.message);
                process.exit(1);
            }
        }
        return DatabaseManager.instance;
    }

    private static initialize(db: Database): void {
        db.exec(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )`);
        
        try {
            db.prepare(`INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)`).run('admin', 'password');
        } catch (e) {
            // Ignore constraints failures
        }
    }
}
