import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import type {Database, Sqlite3Static } from '@sqlite.org/sqlite-wasm';
import type { GameSession, GameTemplate, SessionPlayer, ScoreEntry } from '../types';
import { v4 as uuidv4 } from 'uuid';

const DB_NAME = 'score_store.sqlite3';

class LedgerDatabase {
  private db: Database | null = null;
  private sqlite3: Sqlite3Static | null = null;

  async init() {
    if (this.db) return;

    try {
        this.sqlite3 = await sqlite3InitModule({
            print: console.log,
            printErr: console.error,
            locateFile: (file) => `/${file}`,
        });
    } catch (e) {
        console.error("Failed to load SQLite WASM:", e);
        return;
    }

    if (!this.sqlite3) return;

    try {
        if ('opfs' in this.sqlite3) {
            this.db = new this.sqlite3.oo1.OpfsDb(DB_NAME);
            console.log('Using Persistent OPFS Storage');
        } else {
            this.db = new this.sqlite3.oo1.DB(DB_NAME, 'ct');
            console.warn('Using In-Memory Storage (Data will be lost on refresh)');
        }
    } catch (e) {
        console.error("Storage init failed:", e);
        // Fallback
        this.db = new this.sqlite3.oo1.DB(DB_NAME, 'ct');
    }

    this.runMigrations();
    this.seedTemplates();
  }

  private runMigrations() {
    if (!this.db) return;
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        name TEXT,
        min_players INTEGER,
        max_players INTEGER,
        win_condition TEXT,
        round_structure TEXT,
        default_round_names JSON
      );
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        template_id TEXT,
        played_at TEXT,
        is_finished BOOLEAN DEFAULT 0,
        FOREIGN KEY(template_id) REFERENCES templates(id)
      );
      CREATE TABLE IF NOT EXISTS session_players (
        id TEXT PRIMARY KEY,
        session_id TEXT,
        name TEXT,
        seat_index INTEGER,
        FOREIGN KEY(session_id) REFERENCES sessions(id)
      );
      CREATE TABLE IF NOT EXISTS scores (
        session_id TEXT,
        round_index INTEGER,
        player_id TEXT,
        value INTEGER,
        PRIMARY KEY (session_id, round_index, player_id)
      );
    `);
  }

  private seedTemplates() {
    if (!this.db) return;
    // Check if templates exist using a safe query
    let count = 0;
    this.db.exec({
        sql: 'SELECT count(*) as c FROM templates',
        callback: (vals: any[]) => { count = Number(vals[0]); }
    });
    
    if (count > 0) return;

    // 1. Scrabble (Generic)
    this.createTemplate({
        id: uuidv4(),
        name: "Scrabble / Generic",
        min_players: 2,
        max_players: 8,
        win_condition: 'HIGHEST_SCORE',
        round_structure: 'DYNAMIC',
        default_round_names: []
    });

    // 2. Lórum (Specific Hungarian Card Game)
    this.createTemplate({
        id: uuidv4(),
        name: "Lórum",
        min_players: 4,
        max_players: 4,
        win_condition: 'LOWEST_SCORE',
        round_structure: 'FIXED',
        // Standard Lórum rounds
        default_round_names: ["Piros", "Felső", "Alsó", "Hátul", "Mente", "Lórum", "Piros", "Felső", "Alsó", "Hátul", "Mente", "Lórum"] 
    });
  }

  private createTemplate(t: any) {
    this.db?.exec({
        sql: 'INSERT INTO templates VALUES (?, ?, ?, ?, ?, ?, ?)',
        bind: [t.id, t.name, t.min_players, t.max_players, t.win_condition, t.round_structure, JSON.stringify(t.default_round_names)]
    });
  }

  // --- API ---

  getTemplates(): GameTemplate[] {
    const res: GameTemplate[] = [];
    this.db?.exec({
        sql: 'SELECT * FROM templates',
        rowMode: 'object',
        // Fix: Explicit 'any' type and block { } to return void
        callback: (row: any) => {
            res.push({
                ...row,
                default_round_names: JSON.parse(row.default_round_names || '[]')
            });
        }
    });
    return res;
  }

  getSessionsByDate(dateStr: string): GameSession[] {
    const res: GameSession[] = [];
    this.db?.exec({
        sql: `SELECT s.*, t.name as template_name 
              FROM sessions s 
              JOIN templates t ON s.template_id = t.id 
              WHERE s.played_at = ?`,
        bind: [dateStr],
        rowMode: 'object',
        // Fix: Explicit 'any' type and block { }
        callback: (row: any) => {
            res.push(row);
        }
    });
    return res;
  }

  createSession(templateId: string, playerNames: string[]): string {
    const sessionId = uuidv4();
    const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    this.db?.transaction(() => {
        this.db?.exec({
            sql: 'INSERT INTO sessions (id, template_id, played_at) VALUES (?, ?, ?)',
            bind: [sessionId, templateId, dateStr]
        });

        playerNames.forEach((name, index) => {
            this.db?.exec({
                sql: 'INSERT INTO session_players VALUES (?, ?, ?, ?)',
                bind: [uuidv4(), sessionId, name, index]
            });
        });
    });
    return sessionId;
  }

  getSessionDetails(sessionId: string) {
    if (!this.db) return null;
    
    let session: any = null;
    let template: any = null;
    const players: SessionPlayer[] = [];
    const scores: ScoreEntry[] = [];

    // Get Session
    this.db.exec({
        sql: 'SELECT * FROM sessions WHERE id = ?',
        bind: [sessionId],
        rowMode: 'object',
        callback: (r: any) => { session = r; }
    });

    if(!session) return null;

    // Get Template
    this.db.exec({
        sql: 'SELECT * FROM templates WHERE id = ?',
        bind: [session.template_id],
        rowMode: 'object',
        callback: (r: any) => {
             template = {...r, default_round_names: JSON.parse(r.default_round_names)};
        }
    });

    // Get Players
    this.db.exec({
        sql: 'SELECT * FROM session_players WHERE session_id = ? ORDER BY seat_index',
        bind: [sessionId],
        rowMode: 'object',
        callback: (r: any) => { players.push(r); }
    });

    // Get Scores
    this.db.exec({
        sql: 'SELECT * FROM scores WHERE session_id = ?',
        bind: [sessionId],
        rowMode: 'object',
        callback: (r: any) => { scores.push(r); }
    });

    return { session, template, players, scores };
  }

  saveScore(sessionId: string, roundIdx: number, playerId: string, value: number) {
    this.db?.exec({
        sql: `INSERT INTO scores (session_id, round_index, player_id, value) 
              VALUES (?, ?, ?, ?)
              ON CONFLICT(session_id, round_index, player_id) 
              DO UPDATE SET value=excluded.value`,
        bind: [sessionId, roundIdx, playerId, value]
    });
  }
}

export const db = new LedgerDatabase();