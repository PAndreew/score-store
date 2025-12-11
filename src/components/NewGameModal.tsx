import { useState } from 'react';
import { Users, Plus, Trophy } from 'lucide-react';
import type { GameTemplate } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { cn } from '../lib/utils';

interface NewGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: GameTemplate[];
  onStart: (id: string, players: string[]) => void;
}

export const NewGameModal = ({ isOpen, onClose, templates, onStart }: NewGameModalProps) => {
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-slate-50 gap-0 border-0">
        
        {/* Custom Header Area */}
        <div className="bg-white p-6 border-b border-slate-100">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl font-black text-slate-800">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <Plus size={20} strokeWidth={3} />
                    </div>
                    Start New Game
                </DialogTitle>
            </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
            
            {/* Template Selection */}
            <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Choose Game</label>
                <div className="grid grid-cols-2 gap-3">
                    {templates.map((t) => (
                        <div 
                            key={t.id}
                            onClick={() => setSelectedTemplate(t)}
                            className={cn(
                                "cursor-pointer p-4 rounded-2xl border-2 transition-all hover:scale-[1.02]",
                                selectedTemplate.id === t.id 
                                ? "bg-white border-blue-500 shadow-md ring-4 ring-blue-50" 
                                : "bg-white border-slate-100 hover:border-blue-200 text-slate-500"
                            )}
                        >
                            <div className="font-bold text-slate-800">{t.name}</div>
                            <div className="text-xs mt-1 flex items-center gap-1 opacity-70">
                                <Trophy size={10} />
                                {t.win_condition === 'HIGHEST_SCORE' ? 'High Wins' : 'Low Wins'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Player Input */}
            <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">
                    Players ({selectedTemplate.min_players}-{selectedTemplate.max_players})
                </label>
                <Card className="p-2 space-y-2 rounded-2xl border-slate-200 shadow-none">
                    <div className="max-h-[160px] overflow-y-auto custom-scrollbar px-1 space-y-2">
                        {players.map((p, idx) => (
                            <div key={idx} className="relative group">
                                <Users size={16} className="absolute left-3 top-3.5 text-slate-400" />
                                <Input 
                                    placeholder={`Player ${idx + 1} Name`}
                                    value={p}
                                    onChange={e => {
                                        const newP = [...players];
                                        newP[idx] = e.target.value;
                                        setPlayers(newP);
                                    }}
                                    className="pl-10 bg-slate-50 border-transparent focus:bg-white transition-colors"
                                />
                            </div>
                        ))}
                    </div>
                    {players.length < selectedTemplate.max_players && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => setPlayers([...players, ''])}
                        >
                            + Add Another Seat
                        </Button>
                    )}
                </Card>
            </div>

            <Button size="lg" className="w-full font-bold text-lg rounded-2xl" onClick={handleStart}>
                Let's Play
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};