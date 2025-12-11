import { useState } from 'react';
import { useLedger } from './hooks/useLedger';
import { NewGameModal } from './components/NewGameModal';
import { ActiveSession } from './ActiveSession';
import { db } from './services/database';
import { Plus } from 'lucide-react';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';

function App() {
  const { isReady, todaySessions, templates, refresh } = useLedger();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  if (!isReady) return <div className="flex h-screen items-center justify-center text-purple-600 font-bold">Loading Ledger...</div>;

  if (activeSessionId) {
    return (
        <ActiveSession 
            sessionId={activeSessionId} 
            onBack={() => { setActiveSessionId(null); refresh(); }} 
        />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-8 font-sans">
       <div className="mx-auto max-w-7xl">
            
            {/* Header */}
            <div className="mb-8 flex items-end justify-between">
                <div>
                    <div className="flex gap-4 border-b border-gray-200 pb-1 mb-6">
                        <span className="border-b-2 border-purple-700 pb-3 text-sm font-semibold text-purple-700">Recent Games</span>
                        <span className="pb-3 text-sm font-medium text-gray-500 hover:text-gray-700 cursor-pointer">All Time</span>
                        <span className="pb-3 text-sm font-medium text-gray-500 hover:text-gray-700 cursor-pointer">Templates</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                </div>
                <Button 
                    onClick={() => setIsModalOpen(true)}
                    className="h-12 rounded-lg bg-purple-700 px-6 font-semibold text-white shadow-lg hover:bg-purple-800"
                >
                    <Plus className="mr-2 h-5 w-5" /> New Game
                </Button>
            </div>

            {/* Content Table Style Card */}
            <Card className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="grid grid-cols-12 border-b border-gray-100 bg-gray-50/50 py-4 px-6 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="col-span-4">Game Template</div>
                    <div className="col-span-3">Played At</div>
                    <div className="col-span-3">Status</div>
                    <div className="col-span-2 text-right">Action</div>
                </div>

                {todaySessions.length === 0 ? (
                    <div className="py-12 text-center text-gray-400">
                        No games played today. Start a new one!
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {todaySessions.map(session => (
                            <div key={session.id} className="grid grid-cols-12 items-center py-4 px-6 hover:bg-gray-50 transition-colors">
                                <div className="col-span-4 flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
                                        {session.template_name.substring(0,1)}
                                    </div>
                                    <span className="font-semibold text-gray-900">{session.template_name}</span>
                                </div>
                                <div className="col-span-3 text-sm text-gray-500">
                                    {new Date(session.played_at).toLocaleDateString()}
                                </div>
                                <div className="col-span-3">
                                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                        In Progress
                                    </span>
                                </div>
                                <div className="col-span-2 text-right">
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => setActiveSessionId(session.id)}
                                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                    >
                                        Open Board
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Pagination / Footer Simulator */}
            <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
                <p>Total Table Show: {todaySessions.length}</p>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled>&lt;</Button>
                    <Button variant="default" size="sm" className="h-8 w-8 bg-purple-700 p-0 hover:bg-purple-800">1</Button>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0">&gt;</Button>
                </div>
            </div>
       </div>

      <NewGameModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        templates={templates}
        onStart={(templateId, players) => {
            const id = db.createSession(templateId, players);
            setIsModalOpen(false);
            setActiveSessionId(id);
        }}
      />
    </div>
  );
}

export default App;