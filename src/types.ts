export type SportType = 'futbol' | 'futsal' | 'tenis_mesa' | 'tenis' | 'voleibol';

export interface PlayerStats {
  goalsOrPoints: number;
  yellowCards?: number;
  blueCards?: number;
  redCards?: number;
  matchesPlayed?: number;
  finePaid?: boolean;
}

export interface Player {
  id: string;
  teamId: string;
  name: string;
  number?: number;
  positionOrRole?: string;
  isCaptain?: boolean;
  gradeOrSection?: string;
  group?: 'A' | 'B' | 'C' | 'D' | 'U' | string;
  paymentStatus?: 'pending' | 'paid';
  paymentAmount?: number;
  paymentDate?: string;
  stats: PlayerStats;
}

export interface Team {
  id: string;
  tournamentId: string;
  name: string;
  grade: string; // e.g. "10° A", "11° B", "9A", "Profe"
  captainName: string;
  color: string; // hex or badge color class
  avatarBadge?: string;
  group?: 'A' | 'B' | 'C' | 'D' | 'U' | string;
  paymentStatus?: 'pending' | 'paid';
  paymentAmount?: number;
  paymentDate?: string;
  players: Player[];
}

export interface MatchEvent {
  id: string;
  type: 'goal' | 'point' | 'card_yellow' | 'card_blue' | 'card_red' | 'set_won' | 'sub' | 'foul';
  teamId: string;
  playerId?: string;
  playerName?: string;
  playerNumber?: number;
  minuteOrTime: string;
  extraNote?: string;
  description?: string;
  setIndex?: number;
  pointsHome?: number;
  pointsAway?: number;
  fineAmount?: number;
  finePaid?: boolean;
  half?: 1 | 2;
  timestamp: number;
}

export interface MatchSet {
  setNumber: number;
  homeScore: number;
  awayScore: number;
  winnerTeamId?: string;
}

export interface Match {
  id: string;
  tournamentId: string;
  roundName: string; // e.g., "1ª Ronda", "2ª Ronda", "Llave 1 (Cruzado)", "Semifinal", "Gran Final"
  group?: 'A' | 'B' | 'C' | 'D' | 'U' | string;
  bracketKey?: 'Llave 1' | 'Llave 2' | 'Llave 3' | 'Llave 4' | 'Semi 1' | 'Semi 2' | 'Final' | '3er Puesto';
  homeTeamId: string;
  awayTeamId: string;
  date: string;
  time: string;
  venue: string;
  status: 'scheduled' | 'in_progress' | 'finished' | 'paused';
  homeScore: number; // In table tennis, number of sets won or overall
  awayScore: number;
  currentSet?: number;
  sets?: MatchSet[];
  // Football specific
  half?: 1 | 2;
  arbitrationPaidHome?: boolean;
  arbitrationPaidAway?: boolean;
  arbitrationFee?: number;
  // Table tennis & Volleyball live serve engine
  currentSetHomePoints?: number;
  currentSetAwayPoints?: number;
  initialServerTeamId?: string; // which team started serving in current set
  serverTeamId?: string; // current active server
  timerSeconds: number;
  timerRunning: boolean;
  lastTimerUpdate?: number;
  events: MatchEvent[];
  courtSwappedAt15?: boolean;
  winnerTeamId?: string;
  isDraw?: boolean;
  judgeNotes?: string;
}

export interface TournamentRules {
  pointsForWin: number;
  pointsForDraw: number;
  pointsForLoss: number;
  matchDurationMinutes: number;
  maxSets?: number;
  pointsPerSet?: number;
  twoPointAdvantage?: boolean;
  serveRotationPoints?: number;
  deuceServeRotationPoints?: number;
  registrationFee?: number;
}

export interface Tournament {
  id: string;
  name: string;
  sport: SportType;
  category: string; // e.g. "Juvenil 8°-11° y Profes"
  description?: string;
  status: 'draft' | 'active' | 'completed';
  venue?: string;
  createdAt: string;
  championTeamId?: string;
  rules: TournamentRules;
  hasGroups?: boolean;
  groups?: ('A' | 'B' | 'C' | 'D' | 'U' | string)[];
}

export interface TeamStanding {
  teamId: string;
  teamName: string;
  grade: string;
  group?: 'A' | 'B' | 'C' | 'D' | 'U' | string;
  color: string;
  paymentStatus?: 'pending' | 'paid';
  pj: number; // Partidos Jugados
  pg: number; // Partidos Ganados
  pe: number; // Partidos Empatados
  pp: number; // Partidos Perdidos
  gf: number; // Goles/Puntos a Favor
  gc: number; // Goles/Puntos en Contra
  dg: number; // Diferencia de Goles/Puntos (gf - gc)
  setsWon?: number;
  setsLost?: number;
  setDiff?: number;
  pts: number; // Puntos Totales
  position: number;
  qualificationStatus?: 'guaranteed' | 'in_contention' | 'eliminated';
  formGuide: ('W' | 'D' | 'L')[];
}

export interface ScorerLeader {
  playerId: string;
  playerName: string;
  playerNumber?: number;
  teamId: string;
  teamName: string;
  teamColor: string;
  grade: string;
  group?: 'A' | 'B' | 'C' | 'D' | 'U' | string;
  scoreCount: number; // Goles o Puntos
  yellowCards: number;
  blueCards?: number;
  redCards: number;
  matchesPlayed: number;
  sport: SportType;
}

export interface VallaItem {
  teamId: string;
  teamName: string;
  grade: string;
  color: string;
  avatarBadge?: string;
  goalkeeperName: string;
  matchesPlayed: number;
  goalsAgainst: number;
  averageAgainst: number;
  cleanSheets: number;
}

export interface SanctionItem {
  playerId: string;
  playerName: string;
  playerNumber?: number;
  teamId: string;
  teamName: string;
  teamColor: string;
  grade: string;
  yellowCards: number;
  blueCards: number;
  redCards: number;
  totalFines: number;
  finesPaid: boolean;
  pendingFines?: number;
  paidFines?: number;
  status: 'habilitado' | 'suspendido' | 'multa_pendiente';
}

export type ViewMode = 'spectator' | 'judge';
