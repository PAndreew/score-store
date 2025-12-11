import { useEffect, useState, useRef } from 'react';
import { db } from './services/database';
import type { SessionPlayer, ScoreEntry, GameSession } from './types';
import { Calendar, Plus, ChevronLeft, UserPlus, Trophy, Clock } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const getScore = (scores: ScoreEntry[], roundIdx: number, playerId: string) => 
    scores.find(s => s.round_index === roundIdx && s.player_id === playerId)?.value ?? '';

export const ActiveSession = ({ 
    sessionId, 
    onBack, 
    onNewGame,
    history 
}: { 
    sessionId: string, 
    onBack: () => void,
    onNewGame: () => void,
    history: GameSession[]
}) => {
  const [data, setData] = useState<any>(null);
  const [dynamicRounds, setDynamicRounds] = useState<number[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadData = () => {
    const res = db.getSessionDetails(sessionId);
    if (res) {
        setData(res);
        const maxRound = res.scores.reduce((max, s) => Math.max(max, s.round_index), -1);
        if (res.template.round_structure === 'DYNAMIC') {
            // Ensure we have at least one empty row beyond the last filled one
            const count = Math.max(maxRound + 2, 5); 
            setDynamicRounds(Array.from({length: count}, (_, i) => i));
        }
    }
  };

  useEffect(loadData, [sessionId]);

  // Handle adding a new player mid-game
  const handleAddPlayer = () => {
    const name = prompt("Enter new player name:");
    if (!name || !data) return;
    
    // We access the DB directly here to inject a player
    // Ideally this moves to database.ts as a method
    // @ts-ignore - quick access for refactor
    db.db?.exec({
        sql: 'INSERT INTO session_players VALUES (?, ?, ?, ?)',
        bind: [uuidv4(), sessionId, name, data.players.length]
    });
    loadData();
  };

  if (!data) return <div className="p-10 text-center font-bold text-slate-400">Loading Board...</div>;

  const { template, players, scores, session } = data;
  const isFixed = template.round_structure === 'FIXED';
  const rows = isFixed ? template.default_round_names : dynamicRounds;

  const handleScoreChange = (roundIdx: number, playerId: string, val: string) => {
    const num = val === '' ? 0 : parseInt(val);
    if (isNaN(num)) return;
    
    db.saveScore(sessionId, roundIdx, playerId, num);
    
    // If dynamic and we typed in the last row, add more rows
    if (!isFixed && roundIdx === dynamicRounds.length - 1) {
        setDynamicRounds([...dynamicRounds, dynamicRounds.length]);
    }
    loadData();
  };

  // Calculate Totals & Ranking
  const totals = players.map((p: SessionPlayer) => {
    const total = scores
      .filter((s: ScoreEntry) => s.player_id === p.id)
      .reduce((sum: number, s: ScoreEntry) => sum + s.value, 0);
    return { ...p, total };
  });

  const getRankStyle = (score: number) => {
    const allScores = totals.map((t: any) => t.total);
    const best = template.win_condition === 'HIGHEST_SCORE' ? Math.max(...allScores) : Math.min(...allScores);
    return score === best ? 'text-yellow-600 bg-yellow-50 border-yellow-200' : 'text-slate-600';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* --- HEADER --- */}
      <header className="px-8 py-6 flex items-center justify-between">
        
        {/* Date Picker / Back Area */}
        <div className="flex items-center gap-4 bg-white p-2 pr-6 rounded-full shadow-sm border border-slate-200">
            <button onClick={onBack} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition">
                <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-3 border-l pl-4 border-slate-200">
                <Calendar className="text-slate-400" size={18} />
                <span className="font-bold text-slate-700">
                    {new Date(session.played_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric'})}
                </span>
            </div>
        </div>

        <h1 className="text-xl font-black tracking-tight text-slate-300 uppercase">{template.name}</h1>

        {/* Start New Game Button */}
        <button 
            onClick={onNewGame}
            className="group flex items-center gap-3 bg-white pl-4 pr-2 py-2 rounded-full shadow-sm border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all"
        >
            <span className="font-bold text-sm text-slate-600 group-hover:text-blue-600">START NEW GAME</span>
            <div className="w-8 h-8 bg-slate-900 rounded-full text-white flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                <Plus size={18} strokeWidth={3} />
            </div>
        </button>
      </header>


      {/* --- MAIN GRID AREA --- */}
      <main className="flex-1 px-8 pb-4 flex gap-6 overflow-hidden">
        
        {/* SCORE BOARD CARD */}
        <div className="flex-1 bg-white rounded-[2rem] shadow-xl border border-slate-100 flex flex-col overflow-hidden relative">
            
            {/* Table Header (Players) */}
            <div className="flex border-b border-slate-100 bg-white z-10">
                <div className="w-24 p-4 shrink-0 flex items-end pb-2 font-bold text-slate-300 text-xs uppercase tracking-widest">
                    Round
                </div>
                <div className="flex-1 flex overflow-x-auto no-scrollbar">
                    {totals.map((p: any, i: number) => (
                        <div key={p.id} className="flex-1 min-w-[120px] p-4 text-center border-l border-dashed border-slate-100">
                            <div className="font-black text-slate-800 text-lg truncate mb-1">{p.name}</div>
                            <div className={`text-xs font-bold inline-block px-2 py-0.5 rounded-full border ${getRankStyle(p.total)}`}>
                                {p.total} pts
                            </div>
                        </div>
                    ))}
                </div>
                {/* Space for scrollbar offset if needed */}
                <div className="w-4 shrink-0"></div>
            </div>

            {/* Table Body (Scores) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar" ref={scrollRef}>
                {rows.map((rowName: string | number, rIdx: number) => (
                    <div key={rIdx} className="flex hover:bg-slate-50 transition-colors group">
                        <div className="w-24 p-4 shrink-0 flex items-center font-bold text-slate-400 text-sm border-b border-slate-50 group-hover:border-slate-100">
                             {isFixed ? rowName : (rIdx + 1)}
                        </div>
                        <div className="flex-1 flex">
                            {players.map((p: SessionPlayer) => (
                                <div key={p.id} className="flex-1 min-w-[120px] border-l border-dashed border-slate-100 border-b border-slate-50 relative">
                                    <input 
                                        type="number"
                                        placeholder="-"
                                        className="w-full h-full text-center bg-transparent font-medium text-lg text-slate-600 focus:text-blue-600 outline-none focus:bg-blue-50/50 transition-all placeholder:text-slate-200"
                                        defaultValue={getScore(scores, rIdx, p.id)}
                                        onBlur={(e) => handleScoreChange(rIdx, p.id, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                
                {/* Bottom spacer */}
                <div className="h-20" />
            </div>

             {/* Total Footer (Sticky) */}
             <div className="bg-slate-900 text-white flex shadow-lg mt-auto z-20">
                <div className="w-24 p-4 flex items-center font-bold text-slate-500 text-xs uppercase">Total</div>
                <div className="flex-1 flex">
                    {totals.map((p: any) => (
                        <div key={p.id} className="flex-1 min-w-[120px] p-4 text-center border-l border-slate-800">
                            <span className="font-mono text-xl font-bold">{p.total}</span>
                        </div>
                    ))}
                </div>
             </div>
        </div>

        {/* RIGHT SIDE: Add Player Button */}
        <div className="w-20 pt-20 flex flex-col items-center gap-4">
             <button 
                onClick={handleAddPlayer}
                className="w-16 h-16 rounded-full bg-white shadow-lg border-2 border-slate-100 flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:scale-105 transition-all group"
                title="Add Player"
             >
                <UserPlus size={24} />
             </button>
             <span className="text-xs font-bold text-slate-400 w-20 text-center uppercase">Add Player</span>
        </div>

      </main>

      {/* --- FOOTER: HISTORY --- */}
      <footer className="px-8 pb-6">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock size={14} /> Earlier Games Today
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {history.filter(h => h.id !== sessionId).length === 0 ? (
                    <div className="text-sm text-slate-400 italic pl-1">No other games played today.</div>
                ) : (
                    history.filter(h => h.id !== sessionId).map(h => (
                        <button 
                            key={h.id}
                            // Usually you would navigate here, for now just a visual or callback
                            className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl hover:bg-blue-50 hover:ring-2 ring-blue-100 transition-all text-left min-w-[200px]"
                        >
                            <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-300">
                                <Trophy size={18} />
                            </div>
                            <div>
                                <div className="font-bold text-slate-700 text-sm">{h.template_name}</div>
                                <div className="text-xs text-slate-400">ID: {h.id.slice(0,4)}...</div>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
      </footer>

    </div>
  );
};