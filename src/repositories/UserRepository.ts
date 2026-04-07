import { DatabaseManager } from '../database/Database';
import { User } from '../models/User';
import type { Database } from 'better-sqlite3';

export class UserRepository {
    private db: Database;

    constructor() {
        this.db = DatabaseManager.getInstance();
    }

    public async findByCredentials(username: string, password: string): Promise<User | null> {
        const stmt = this.db.prepare(`SELECT id, username FROM users WHERE username = ? AND password = ?`);
        const row = stmt.get(username, password) as User | undefined;
        return row || null;
    }
}
