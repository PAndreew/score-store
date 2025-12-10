import { useEffect, useState, useCallback } from 'react';
import { dbService } from '../services/database';
import type { Game, Player, GridRow } from '../types';

export function useGameEngine() {
  const [isReady, setIsReady] = useState(false);
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gridData, setGridData] = useState<GridRow[]>([]);

  // Initialize DB on mount
  useEffect(() => {
    dbService.init().then(() => setIsReady(true)).catch(console.error);
  }, []);

  const refreshData = useCallback(() => {
    if (!activeGame) return;
    setPlayers(dbService.getPlayers(activeGame.id));
    setGridData(dbService.getRoundsWithScores(activeGame.id));
  }, [activeGame]);

  const createNewGame = (name: string) => {
    const game = dbService.createGame(name);
    setActiveGame(game);
    // Add some default players for demo
    dbService.addPlayer(game.id, "Player 1");
    dbService.addPlayer(game.id, "Player 2");
    refreshData();
  };

  const addRound = () => {
    if(!activeGame) return;
    dbService.addRound(activeGame.id);
    refreshData();
  };

  const setScore = (roundId: string, playerId: string, value: string) => {
    // Parse string input to number, default to 0
    const numVal = parseInt(value, 10) || 0;
    dbService.updateScore(roundId, playerId, numVal);
    refreshData();
  };

  const exportSaveFile = () => {
    const blob = dbService.exportDatabase();
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().split('T')[0]}.sqlite`;
      a.click();
    }
  };

  return {
    isReady,
    activeGame,
    players,
    gridData,
    actions: {
      createNewGame,
      addRound,
      setScore,
      exportSaveFile
    }
  };
}