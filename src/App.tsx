import { useState } from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import './theme.css'; // Import the CSS variables

function App() {
  const { isReady, activeGame, players, gridData, actions } = useGameEngine();
  const [theme, setTheme] = useState<'default' | 'retro'>('default');

  // Theme Toggler
  const toggleTheme = () => {
    const newTheme = theme === 'default' ? 'retro' : 'default';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Helper: Calculate Totals
  const calculateTotal = (playerId: string) => {
    return gridData.reduce((sum, row) => {
      return sum + (row.scores[playerId] || 0);
    }, 0);
  };

  if (!isReady) return <div className="p-10">Loading Database...</div>;

  return (
    <div className="min-h-screen theme-bg-app theme-text p-8 font-[family-name:var(--font-family)]">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header / Controls */}
        <div className="flex justify-between items-center theme-bg-panel p-6 rounded-xl shadow-lg">
          <h1 className="text-2xl font-bold">
            {activeGame ? activeGame.name : "Family Score Ledger"}
          </h1>
          
          <div className="flex gap-2">
            <button onClick={toggleTheme} className="theme-btn opacity-80">
              Toggle Theme
            </button>
            {activeGame && (
              <button onClick={actions.exportSaveFile} className="theme-btn bg-green-600">
                Backup to File
              </button>
            )}
          </div>
        </div>

        {/* Game Setup or Grid */}
        {!activeGame ? (
          <div className="theme-bg-panel p-10 rounded-xl shadow-lg text-center">
            <button 
              onClick={() => actions.createNewGame("New Family Night")}
              className="theme-btn text-lg"
            >
              Start New Game
            </button>
          </div>
        ) : (
          <div className="theme-bg-panel p-6 rounded-xl shadow-lg overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="p-3 border-b-2 border-gray-200">Round</th>
                  {players.map(player => (
                    <th key={player.id} className="p-3 border-b-2 border-gray-200">
                      {player.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gridData.map((row) => (
                  <tr key={row.round.id} className="hover:bg-black/5">
                    <td className="p-3 font-mono opacity-50">#{row.round.round_number}</td>
                    {players.map(player => (
                      <td key={player.id} className="p-1">
                        <input
                          type="number"
                          className="w-full theme-input p-2"
                          value={row.scores[player.id] ?? ''}
                          onChange={(e) => actions.setScore(row.round.id, player.id, e.target.value)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
                
                {/* Footer / Results */}
                <tr className="font-bold bg-black/5 border-t-2 border-black">
                  <td className="p-3">TOTAL</td>
                  {players.map(player => (
                    <td key={player.id} className="p-3 text-lg text-[var(--color-accent)]">
                      {calculateTotal(player.id)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>

            <div className="mt-6 flex justify-center">
              <button onClick={actions.addRound} className="theme-btn">
                + Add Round
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;