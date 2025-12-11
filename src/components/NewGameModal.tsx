import { useState } from 'react';
import { X, Plus, Users } from 'lucide-react';
import type { GameTemplate } from '../types';

export const NewGameModal = ({ templates, onClose, onStart }: any) => {
  const [selectedTemplate, setSelectedTemplate] = useState<GameTemplate>(templates[0]);
  const [players, setPlayers] = useState<string[]>(['', '', '', '']);

  const handleStart = () => {
    const validPlayers = players.filter(p => p.trim() !== "");
    if(validPlayers.length < selectedTemplate.min_players) {
        alert(`This game requires at least ${selectedTemplate.min_players} players.`);
        return;
    }
    onStart(selectedTemplate.id, validPlayers);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-3xl w-[480px] shadow-2xl border border-slate-100 relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-800">
            <X size={24} />
        </button>

        <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <Plus size={20} strokeWidth={3} />
            </div>
            Start New Game
        </h2>
        
        <div className="space-y-6">
            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Game Type</label>
                <div className="grid grid-cols-2 gap-2">
                    {templates.map((t: any) => (
                        <button 
                            key={t.id}
                            onClick={() => setSelectedTemplate(t)}
                            className={`p-3 rounded-xl text-left transition-all border-2 ${
                                selectedTemplate.id === t.id 
                                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                : 'border-slate-100 hover:border-slate-200 text-slate-600'
                            }`}
                        >
                            <div className="font-bold">{t.name}</div>
                            <div className="text-xs opacity-70">{t.win_condition === 'HIGHEST_SCORE' ? 'High Score Wins' : 'Low Score Wins'}</div>
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Players ({selectedTemplate.min_players}-{selectedTemplate.max_players})
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {players.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-2 group">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                <Users size={14} />
                            </div>
                            <input 
                                placeholder={`Player ${idx + 1}`}
                                className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
                                value={p}
                                onChange={e => {
                                    const newP = [...players];
                                    newP[idx] = e.target.value;
                                    setPlayers(newP);
                                }}
                                autoFocus={idx === 0}
                            />
                        </div>
                    ))}
                </div>
                {players.length < selectedTemplate.max_players && (
                    <button 
                        className="mt-2 text-sm text-blue-600 font-bold hover:underline flex items-center gap-1 pl-10"
                        onClick={() => setPlayers([...players, ''])}
                    >
                        + Add Seat
                    </button>
                )}
            </div>

            <div className="pt-2">
                <button 
                    onClick={handleStart} 
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-transform active:scale-95 shadow-lg"
                >
                    Let's Play
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};