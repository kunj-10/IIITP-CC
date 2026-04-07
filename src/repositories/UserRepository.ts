import { Database } from '../database/Database';
import { User } from '../models/User';
import sqlite3 from 'sqlite3';

export class UserRepository {
    private db: sqlite3.Database;

    constructor() {
        this.db = Database.getInstance();
    }

    public async findByCredentials(username: string, password: string): Promise<User | null> {
        return new Promise((resolve, reject) => {
            this.db.get(
                `SELECT id, username FROM users WHERE username = ? AND password = ?`, 
                [username, password], 
                (err, row: User) => {
                    if (err) return reject(err);
                    resolve(row || null);
                }
            );
        });
    }
}
