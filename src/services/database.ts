import sqlite3InitModule, { type Database, type Sqlite3Static } from '@sqlite.org/sqlite-wasm';
import type { Game, Player, Round, GridRow } from '../types';
import { v4 as uuidv4 } from 'uuid'; // You'll need: npm i uuid @types/uuid

const DB_NAME = 'score_store.sqlite3';

// Helper type for SQLite rows when using rowMode: 'object'
// The library types can be tricky, so we use 'any' for the raw row 
// to avoid "SqlValue is not assignable to..." errors, then cast manually.
type SqlRow = any; 

class GameDatabase {
  private db: Database | null = null;
  private sqlite3: Sqlite3Static | null = null;

  async init() {
    if (this.db) return;

    this.sqlite3 = await sqlite3InitModule({
      print: console.log,
      printErr: console.error,
    });

    if (!this.sqlite3) throw new Error('Failed to load SQLite WASM');

    try {
      if ('opfs' in this.sqlite3) {
        this.db = new this.sqlite3.oo1.OpfsDb(DB_NAME);
      } else {
        console.warn('OPFS not supported, using in-memory DB.');
        this.db = new this.sqlite3.oo1.DB(DB_NAME, 'ct');
      }
    } catch (e) {
      console.error("Database init error:", e);
      // Fallback if OPFS fails
      this.db = new this.sqlite3.oo1.DB(DB_NAME, 'ct');
    }

    this.runMigrations();
  }

  private runMigrations() {
    if (!this.db) return;

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS games (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at INTEGER,
        rule_type TEXT DEFAULT 'SUM'
      );
      CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        game_id TEXT,
        name TEXT,
        order_index INTEGER,
        FOREIGN KEY(game_id) REFERENCES games(id)
      );
      CREATE TABLE IF NOT EXISTS rounds (
        id TEXT PRIMARY KEY,
        game_id TEXT,
        round_number INTEGER,
        FOREIGN KEY(game_id) REFERENCES games(id)
      );
      CREATE TABLE IF NOT EXISTS scores (
        round_id TEXT,
        player_id TEXT,
        value INTEGER,
        PRIMARY KEY (round_id, player_id)
      );
    `);
  }

  exportDatabase(): Blob | null {
    if (!this.sqlite3 || !this.db) return null;
    
    // Fix: Pass the db instance directly, not .pointer
    // The type definition expects "number | Database"
    try {
      const byteArray = this.sqlite3.capi.sqlite3_js_db_export(this.db);
      return new Blob([byteArray], { type: 'application/x-sqlite3' });
    } catch (e) {
      console.error("Export failed:", e);
      return null;
    }
  }

  // --- CRUD Operations ---

  createGame(name: string): Game {
    const game: Game = {
      id: uuidv4(),
      name,
      created_at: Date.now(),
      rule_type: 'SUM'
    };
    this.db?.exec({
      sql: 'INSERT INTO games VALUES (?, ?, ?, ?)',
      bind: [game.id, game.name, game.created_at, game.rule_type]
    });
    return game;
  }

  getPlayers(gameId: string): Player[] {
    const result: Player[] = [];
    this.db?.exec({
      sql: 'SELECT * FROM players WHERE game_id = ? ORDER BY order_index ASC',
      bind: [gameId],
      rowMode: 'object',
      // Fix: Wrap push in braces to return void, avoiding the type error
      callback: (row: SqlRow) => {
        result.push(row as Player);
      }
    });
    return result;
  }

  addPlayer(gameId: string, name: string): Player {
    const player: Player = {
        id: uuidv4(),
        game_id: gameId,
        name,
        order_index: Date.now()
    };
    this.db?.exec({
        sql: 'INSERT INTO players VALUES (?, ?, ?, ?)',
        bind: [player.id, player.game_id, player.name, player.order_index]
    });
    return player;
  }

  addRound(gameId: string): Round {
    let maxRound = 0;
    this.db?.exec({
        sql: 'SELECT MAX(round_number) as m FROM rounds WHERE game_id = ?',
        bind: [gameId],
        // Fix: Explicitly type vals as any[] to handle the result safely
        callback: (vals: any[]) => { 
          maxRound = Number(vals[0]) || 0; 
        }
    });

    const round: Round = {
        id: uuidv4(),
        game_id: gameId,
        round_number: maxRound + 1
    };

    this.db?.exec({
        sql: 'INSERT INTO rounds VALUES (?, ?, ?)',
        bind: [round.id, round.game_id, round.round_number]
    });
    return round;
  }

  getRoundsWithScores(gameId: string): GridRow[] {
    if (!this.db) return [];
    
    const rounds: Round[] = [];
    this.db.exec({
        sql: 'SELECT * FROM rounds WHERE game_id = ? ORDER BY round_number ASC',
        bind: [gameId],
        rowMode: 'object',
        callback: (row: SqlRow) => {
          rounds.push(row as Round);
        }
    });

    return rounds.map(r => {
        const scores: Record<string, number> = {};
        this.db!.exec({
            sql: 'SELECT player_id, value FROM scores WHERE round_id = ?',
            bind: [r.id],
            rowMode: 'object',
            callback: (row: SqlRow) => {
                // Ensure we cast appropriately
                const s = row as { player_id: string; value: number };
                scores[s.player_id] = s.value;
            }
        });
        return { round: r, scores };
    });
  }

  updateScore(roundId: string, playerId: string, value: number) {
    this.db?.exec({
        sql: `INSERT INTO scores (round_id, player_id, value) VALUES (?, ?, ?)
              ON CONFLICT(round_id, player_id) DO UPDATE SET value=excluded.value`,
        bind: [roundId, playerId, value]
    });
  }
}

export const dbService = new GameDatabase();