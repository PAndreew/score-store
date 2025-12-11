import { useState } from 'react';
import { useLedger } from './hooks/useLedger';
import { NewGameModal } from './components/NewGameModal';
import { ActiveSession } from './ActiveSession';
import { db } from './services/database';
import { Plus, Trophy, ArrowRight } from 'lucide-react';

function App() {
  const { isReady, todaySessions, templates, refresh } = useLedger();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Auto-open last session if available (optional UX choice, kept off for menu)
  
  if (!isReady) return <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-bold animate-pulse">Loading Ledger...</div>;

  if (activeSessionId) {
    return (
        <ActiveSession 
            sessionId={activeSessionId} 
            history={todaySessions}
            onBack={() => { setActiveSessionId(null); refresh(); }} 
            onNewGame={() => setIsModalOpen(true)}
        />
    );
  }

  // DASHBOARD VIEW (When no game is active)
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
       
       <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Title Block */}
            <div className="md:col-span-3 mb-4">
                <h1 className="text-4xl font-black text-slate-800 mb-2">George's Ledger</h1>
                <p className="text-slate-500 font-medium">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
            </div>

            {/* New Game Card (Hero) */}
            <button 
                onClick={() => setIsModalOpen(true)}
                className="md:col-span-2 bg-slate-900 rounded-[2.5rem] p-10 text-left hover:scale-[1.02] transition-transform shadow-2xl flex flex-col justify-between h-80 relative overflow-hidden group"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800 rounded-full -mr-16 -mt-16 opacity-50 transition-all group-hover:scale-110"></div>
                
                <div className="relative z-10">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6">
                        <Plus size={32} className="text-slate-900" />
                    </div>
                    <h2 className="text-4xl font-bold text-white mb-2">New Game</h2>
                    <p className="text-slate-400 text-lg">Start a fresh scoreboard.</p>
                </div>

                <div className="flex items-center gap-2 text-white font-bold relative z-10">
                    Select Template <ArrowRight size={20} />
                </div>
            </button>

            {/* Recent Games List */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl flex flex-col h-80">
                <h3 className="font-bold text-slate-400 uppercase tracking-widest mb-6 text-sm">Today's Games</h3>
                
                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                    {todaySessions.length === 0 ? (
                         <div className="h-full flex flex-col items-center justify-center text-slate-300 text-center">
                            <Trophy size={48} className="mb-2 opacity-50"/>
                            <p>No games yet.</p>
                         </div>
                    ) : (
                        todaySessions.map(session => (
                            <button 
                                key={session.id} 
                                onClick={() => setActiveSessionId(session.id)}
                                className="w-full bg-slate-50 p-4 rounded-2xl hover:bg-blue-50 text-left group transition-colors"
                            >
                                <div className="font-bold text-slate-700 group-hover:text-blue-700">{session.template_name}</div>
                                <div className="text-xs text-slate-400 flex justify-between mt-1">
                                    <span>{new Date(session.played_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

       </div>

      {isModalOpen && (
        <NewGameModal 
            templates={templates} 
            onClose={() => setIsModalOpen(false)}
            onStart={(templateId: string, players: string[]) => {
                const id = db.createSession(templateId, players);
                setIsModalOpen(false);
                setActiveSessionId(id);
            }}
        />
      )}
    </div>
  );
}

export default App;