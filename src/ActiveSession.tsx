import { useEffect, useState } from 'react';
import { db } from './services/database';
import type { SessionPlayer, ScoreEntry } from './types';

// Helper to group scores by row
const getScore = (scores: ScoreEntry[], roundIdx: number, playerId: string) => 
    scores.find(s => s.round_index === roundIdx && s.player_id === playerId)?.value || 0;

export const ActiveSession = ({ sessionId, onBack }: { sessionId: string, onBack: () => void }) => {
  const [data, setData] = useState<any>(null);
  
  // For dynamic games (Scrabble), we need to track how many rounds exist locally
  const [dynamicRounds, setDynamicRounds] = useState<number[]>([]);

  const loadData = () => {
    const res = db.getSessionDetails(sessionId);
    if (res) {
        setData(res);
        // Calculate max round index from existing scores to build the grid
        const maxRound = res.scores.reduce((max, s) => Math.max(max, s.round_index), -1);
        // If fixed (Lórum), use template names. If dynamic, create array [0, 1, 2... max]
        if (res.template.round_structure === 'DYNAMIC') {
            const count = Math.max(maxRound + 1, 1); // At least 1 round
            setDynamicRounds(Array.from({length: count}, (_, i) => i));
        }
    }
  };

  useEffect(loadData, [sessionId]);

  if (!data) return <div>Loading...</div>;

  const { template, players, scores } = data;
  const isFixed = template.round_structure === 'FIXED';
  
  // If Lórum, rows are the round names. If Scrabble, rows are numbers.
  const rows = isFixed ? template.default_round_names : dynamicRounds;

  const handleScoreChange = (roundIdx: number, playerId: string, val: string) => {
    const num = parseInt(val) || 0;
    db.saveScore(sessionId, roundIdx, playerId, num);
    loadData(); // Refresh totals
  };

  const addRound = () => {
    setDynamicRounds([...dynamicRounds, dynamicRounds.length]);
  };

  // Calculate Totals
  const totals = players.map((p: SessionPlayer) => {
    return scores
      .filter((s: ScoreEntry) => s.player_id === p.id)
      .reduce((sum: number, s: ScoreEntry) => sum + s.value, 0);
  });

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <button onClick={onBack} className="mb-4 text-gray-500 hover:text-black">← Back to Dashboard</button>
      
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
            <div>
                <h1 className="text-2xl font-bold">{template.name}</h1>
                <p className="text-sm text-gray-500">{new Date().toDateString()}</p>
            </div>
            <div className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                Win: {template.win_condition === 'LOWEST_SCORE' ? 'Lowest Points' : 'Highest Points'}
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-right">
                <thead>
                    <tr className="bg-gray-100 text-gray-600 text-sm uppercase">
                        <th className="p-4 text-left w-32">Round</th>
                        {players.map((p: SessionPlayer) => (
                            <th key={p.id} className="p-4 min-w-[100px]">{p.name}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {rows.map((rowName: string | number, rIdx: number) => (
                        <tr key={rIdx} className="hover:bg-gray-50">
                            <td className="p-4 text-left font-medium text-gray-500">
                                {isFixed ? rowName : `Round ${rIdx + 1}`}
                            </td>
                            {players.map((p: SessionPlayer) => (
                                <td key={p.id} className="p-2">
                                    <input 
                                        type="number"
                                        className="w-full p-2 border rounded text-right focus:ring-2 ring-blue-500 outline-none"
                                        defaultValue={getScore(scores, rIdx, p.id)}
                                        onBlur={(e) => handleScoreChange(rIdx, p.id, e.target.value)}
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}

                    {/* Totals Row */}
                    <tr className="bg-gray-800 text-white font-bold text-lg">
                        <td className="p-4 text-left">TOTAL</td>
                        {totals.map((t: number, i: number) => (
                            <td key={i} className="p-4">{t}</td>
                        ))}
                    </tr>
                </tbody>
            </table>
        </div>
        
        {!isFixed && (
            <div className="p-4 bg-gray-50 text-center">
                <button 
                    onClick={addRound}
                    className="px-6 py-2 bg-white border border-gray-300 rounded shadow hover:bg-gray-100"
                >
                    + Add Round
                </button>
            </div>
        )}
      </div>
    </div>
  );
};