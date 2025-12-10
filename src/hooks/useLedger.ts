import { useState, useEffect, useCallback } from 'react';
import { db } from '../services/database';
import type { GameSession, GameTemplate } from '../types';

export function useLedger() {
  const [isReady, setIsReady] = useState(false);
  const [todaySessions, setTodaySessions] = useState<GameSession[]>([]);
  const [templates, setTemplates] = useState<GameTemplate[]>([]);

  useEffect(() => {
    db.init().then(() => {
        setIsReady(true);
        loadDashboard();
    });
  }, []);

  const loadDashboard = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    setTodaySessions(db.getSessionsByDate(today));
    setTemplates(db.getTemplates());
  }, []);

  return { isReady, todaySessions, templates, refresh: loadDashboard };
}