import React, { useState } from 'react';
import { useLedger } from './hooks/useLedger';
import { NewGameModal } from './components/NewGameModal';
import { ActiveSession } from './ActiveSession';
import { db } from './services/database';

function App() {
  const { isReady, todaySessions, templates, refresh } = useLedger();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  if (!isReady) return <div className="flex h-screen items-center justify-center">Loading Ledger...</div>;

  // View: Active Game
  if (activeSessionId) {
    return <ActiveSession sessionId={activeSessionId} onBack={() => { setActiveSessionId(null); refresh(); }} />;
  }

  // View: Dashboard
  return (
    <div className="min-h-screen bg-slate-100 p-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-end">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">George's Ledger</h1>
                <p className="text-slate-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg shadow-lg font-bold transition flex items-center gap-2"
            >
                <span>+</span> New Game
            </button>
        </div>

        {/* Today's List */}
        <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Today's Games</h2>
            
            {todaySessions.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-400">No games played today yet.</p>
                </div>
            ) : (
                todaySessions.map(session => (
                    <div 
                        key={session.id} 
                        onClick={() => setActiveSessionId(session.id)}
                        className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition cursor-pointer border border-slate-100 flex justify-between items-center"
                    >
                        <div>
                            <h3 className="font-bold text-lg text-slate-800">{session.template_name}</h3>
                            <p className="text-xs text-slate-500">ID: {session.id.slice(0, 8)}...</p>
                        </div>
                        <div className="text-blue-600 font-medium">Continue →</div>
                    </div>
                ))
            )}
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