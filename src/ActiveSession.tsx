import { useEffect, useState, useMemo } from 'react';
import { 
    useReactTable, 
    getCoreRowModel, 
    flexRender,
} from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import { db } from './services/database';
import type { SessionDetails } from './types';
import { ArrowLeft, UserPlus, Trophy, Save, CalendarIcon, MoreHorizontal } from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Calendar } from './components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './components/ui/popover';
import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter 
} from './components/ui/table';
import { cn } from './lib/utils';
import { format } from "date-fns";
import { v4 as uuidv4 } from 'uuid';

// --- Types for the Table Row ---
// We pivot the data: One row = One Round, with dynamic properties for each player
type RoundRow = {
    roundIndex: number;
    roundName: string;
    [playerId: string]: number | string; // Dynamic scores
};

// Visual Helpers
const getInitials = (name: string) => name.substring(0,2).toUpperCase();
const avatarColors = [
    'bg-pink-100 text-pink-700', 'bg-purple-100 text-purple-700', 
    'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700'
];

export const ActiveSession = ({ 
    sessionId, 
    onBack 
}: { 
    sessionId: string, 
    onBack: () => void 
}) => {
  const [sessionData, setSessionData] = useState<SessionDetails | null>(null);
  const [dynamicRounds, setDynamicRounds] = useState<number[]>([]);
  const [date, setDate] = useState<Date | undefined>(new Date());

  // 1. Load Data
  const loadData = () => {
    const res = db.getSessionDetails(sessionId);
    if (res) {
        // @ts-ignore 
        setSessionData(res);
        setDate(new Date(res.session.played_at));
        
        // Handle dynamic round structure
        const maxRound = res.scores.reduce((max, s) => Math.max(max, s.round_index), -1);
        if (res.template.round_structure === 'DYNAMIC') {
            const count = Math.max(maxRound + 2, 5); 
            setDynamicRounds(Array.from({length: count}, (_, i) => i));
        }
    }
  };

  useEffect(loadData, [sessionId]);

  const handleScoreChange = (roundIdx: number, playerId: string, val: string) => {
    const num = val === '' ? 0 : parseInt(val);
    if (isNaN(num)) return;
    
    db.saveScore(sessionId, roundIdx, playerId, num);
    
    // Auto-add row if dynamic
    if (sessionData?.template.round_structure === 'DYNAMIC' && roundIdx === dynamicRounds.length - 1) {
        setDynamicRounds(prev => [...prev, prev.length]);
    }
    loadData();
  };

  // 2. Prepare Data for TanStack Table (Pivot Logic)
  const tableData = useMemo(() => {
    if (!sessionData) return [];
    
    const rows: number[] | string[] = sessionData.template.round_structure === 'FIXED' 
        ? sessionData.template.default_round_names 
        : dynamicRounds;

    return rows.map((rName, rIdx) => {
        const row: RoundRow = {
            roundIndex: rIdx,
            roundName: typeof rName === 'string' ? rName : `Round ${rIdx + 1}`,
        };
        // Fill player scores
        sessionData.players.forEach(p => {
            const score = sessionData.scores.find(s => s.round_index === rIdx && s.player_id === p.id);
            row[p.id] = score ? score.value : '';
        });
        return row;
    });
  }, [sessionData, dynamicRounds]);


  // 3. Define Columns & Formulas
  const columns = useMemo<ColumnDef<RoundRow>[]>(() => {
    if (!sessionData) return [];

    // Helper to calculate best score for highlighting
    const playerTotals = sessionData.players.map(p => ({
        id: p.id,
        total: sessionData.scores.filter(s => s.player_id === p.id).reduce((sum, s) => sum + s.value, 0)
    }));
    const bestTotal = sessionData.template.win_condition === 'HIGHEST_SCORE' 
        ? Math.max(...playerTotals.map(p => p.total))
        : Math.min(...playerTotals.map(p => p.total));

    return [
        // Column 1: Round Name
        {
            accessorKey: 'roundName',
            header: () => <span className="pl-4">ROUND NAME</span>,
            cell: (info) => <span className="pl-4 font-medium text-slate-600">{info.getValue() as string}</span>,
            footer: () => <span className="pl-4 font-bold text-slate-400">TOTALS</span>
        },
        // Dynamic Columns: Players
        ...sessionData.players.map((player, idx) => ({
            accessorKey: player.id,
            header: () => {
                const isWinning = playerTotals.find(pt => pt.id === player.id)?.total === bestTotal;
                return (
                    <div className="flex items-center gap-3">
                         <div className={cn(
                            "h-9 w-9 rounded-full flex items-center justify-center text-[11px] font-bold shadow-sm ring-2 ring-white",
                            avatarColors[idx % avatarColors.length]
                        )}>
                            {getInitials(player.name)}
                        </div>
                        <div className="flex flex-col leading-tight">
                            <span className="text-sm font-bold text-slate-800">{player.name}</span>
                            <span className="text-[10px] font-medium text-slate-400">Player {idx + 1}</span>
                        </div>
                        {isWinning && <Trophy size={14} className="ml-auto text-amber-400" fill="currentColor" />}
                    </div>
                );
            },
            cell: ({ row, getValue }) => (
                <Input 
                    type="number"
                    className="h-10 w-full bg-transparent border-transparent text-center font-semibold text-slate-700 placeholder:text-slate-200 focus:bg-white focus:border-purple-200 focus:ring-2 focus:ring-purple-100 transition-all rounded-lg"
                    placeholder="-"
                    value={getValue() as string}
                    onChange={(e) => handleScoreChange(row.original.roundIndex, player.id, e.target.value)}
                />
            ),
            // THE FORMULA: Calculate Sum in Footer
            footer: () => {
                const total = playerTotals.find(pt => pt.id === player.id)?.total || 0;
                const isBest = total === bestTotal;
                return (
                    <div className={cn(
                        "flex flex-col items-center px-2 py-1 rounded-lg border min-w-[60px]",
                        isBest ? 'border-purple-200 bg-purple-50/50 text-purple-700' : 'border-slate-100 bg-white text-slate-600'
                    )}>
                        <span className="text-lg font-bold leading-none">{total}</span>
                    </div>
                );
            }
        })),
        // Column Last: Actions
        {
            id: 'actions',
            header: () => <div className="text-right pr-4">ACTION</div>,
            cell: () => (
                <div className="flex justify-end gap-3 text-slate-300 pr-4">
                    <button className="hover:text-purple-600 transition-colors"><Save size={16}/></button>
                    <button className="hover:text-red-400 transition-colors"><MoreHorizontal size={16}/></button>
                </div>
            ),
        }
    ];
  }, [sessionData, tableData]); // Re-calc columns when data changes to update footers

  // 4. Initialize Table
  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleAddPlayer = () => {
    const name = prompt("Enter new player name:");
    if (!name || !sessionData) return;
    // @ts-ignore
    db.db?.exec({
        sql: 'INSERT INTO session_players VALUES (?, ?, ?, ?)',
        bind: [uuidv4(), sessionId, name, sessionData.players.length]
    });
    loadData();
  };

  if (!sessionData) return <div className="p-10 text-purple-600">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      
      {/* --- HEADER (Same as before) --- */}
      <div className="mx-auto max-w-[1400px] mb-8 space-y-6">
        <div className="flex items-center gap-6 text-sm font-medium text-slate-500">
            <button className="text-purple-700 border-b-2 border-purple-700 pb-1 px-1">Requested</button>
            <button className="hover:text-slate-800 pb-1 px-1">Approved</button>
        </div>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">{sessionData.template.name}</h1>
                <p className="text-slate-500 mt-1">TanStack Table Edition</p>
            </div>
            <div className="flex items-center gap-3">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal border-slate-200 h-11 bg-white", !date && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4 text-purple-600" />
                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                    </PopoverContent>
                </Popover>
                <Button onClick={handleAddPlayer} className="h-11 bg-purple-700 hover:bg-purple-800 text-white px-6 font-semibold shadow-sm">
                    <UserPlus className="mr-2 h-4 w-4" /> Add Player
                </Button>
            </div>
        </div>
      </div>

      {/* --- TANSTACK TABLE CARD --- */}
      <div className="mx-auto max-w-[1400px] bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <Table className="w-full">
            <TableHeader className="bg-transparent">
                {table.getHeaderGroups().map(headerGroup => (
                    <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-slate-100">
                        {headerGroup.headers.map(header => (
                            <TableHead key={header.id} className="h-16 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                            </TableHead>
                        ))}
                    </TableRow>
                ))}
            </TableHeader>
            
            <TableBody>
                {table.getRowModel().rows.map(row => (
                    <TableRow key={row.id} className="hover:bg-slate-50 border-b border-slate-100 last:border-0 group">
                        {row.getVisibleCells().map(cell => (
                            <TableCell key={cell.id} className="p-3">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>

            {/* --- FOOTER FOR FORMULAS --- */}
            <TableFooter className="bg-white border-t border-slate-100">
                 {table.getFooterGroups().map(footerGroup => (
                    <TableRow key={footerGroup.id} className="hover:bg-transparent border-none">
                        {footerGroup.headers.map(header => (
                            <TableCell key={header.id} className="h-20 align-middle">
                                {header.isPlaceholder ? null : flexRender(header.column.columnDef.footer, header.getContext())}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableFooter>
        </Table>

        {/* Bottom Metadata */}
        <div className="flex items-center gap-2 p-6 pt-0 text-xs font-bold text-slate-300">
             <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-slate-200 text-slate-400" onClick={onBack}>
                <ArrowLeft size={14} />
             </Button>
            <span>Total Rounds: {table.getRowModel().rows.length}</span>
        </div>
      </div>
    </div>
  );
};