import { useState } from 'react';
import type { GameTemplate } from '../types';

export const NewGameModal = ({ templates, onClose, onStart }: any) => {
  const [selectedTemplate, setSelectedTemplate] = useState<GameTemplate>(templates[0]);
  const [players, setPlayers] = useState<string[]>(['', '', '', '']); // Start with 4 slots

  const handleStart = () => {
    const validPlayers = players.filter(p => p.trim() !== "");
    if(validPlayers.length < selectedTemplate.min_players) {
        alert(`This game requires at least ${selectedTemplate.min_players} players.`);
        return;
    }
    onStart(selectedTemplate.id, validPlayers);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl w-96 shadow-xl">
        <h2 className="text-xl font-bold mb-4">Start New Game</h2>
        
        <label className="block text-sm font-bold mb-2">Select Game Type</label>
        <select 
            className="w-full border p-2 rounded mb-4"
            onChange={e => {
                const t = templates.find((t:any) => t.id === e.target.value);
                setSelectedTemplate(t);
            }}
        >
            {templates.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>

        <label className="block text-sm font-bold mb-2">Players</label>
        <div className="space-y-2 mb-4">
            {/* Simple dynamic input list */}
            {players.map((p, idx) => (
                <input 
                    key={idx}
                    placeholder={`Player ${idx + 1}`}
                    className="w-full border p-2 rounded"
                    value={p}
                    onChange={e => {
                        const newP = [...players];
                        newP[idx] = e.target.value;
                        setPlayers(newP);
                    }}
                />
            ))}
             <button 
                className="text-xs text-blue-500 underline"
                onClick={() => setPlayers([...players, ''])}
             >
                + Add Seat
            </button>
        </div>

        <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-gray-500">Cancel</button>
            <button onClick={handleStart} className="px-4 py-2 bg-blue-600 text-white rounded">Start</button>
        </div>
      </div>
    </div>
  );
};