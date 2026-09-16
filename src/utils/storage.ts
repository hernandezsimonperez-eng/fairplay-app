import { Match, Team, Tournament } from '../types';
import { INITIAL_MATCHES, INITIAL_TEAMS, INITIAL_TOURNAMENTS } from '../data/initialData';

const STORAGE_KEYS = {
  TOURNAMENTS: 'fairplay_tournaments_v7_football_2026',
  TEAMS: 'fairplay_teams_v7_football_2026',
  MATCHES: 'fairplay_matches_v7_football_2026',
  ACTIVE_TOURNAMENT_ID: 'fairplay_active_tournament_id_v7_football_2026',
  JUDGE_AUTH: 'fairplay_judge_auth',
  JUDGE_PIN: 'fairplay_judge_pin',
};

export function loadTournaments(): Tournament[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TOURNAMENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure that new tournaments exist and removed ones are not present
        const hasOldFutsal = parsed.some((t: Tournament) => t.id === 'tourn-futsal-10');
        const hasVolleyPrejuv = parsed.some((t: Tournament) => t.id === 'tourn-volley-prejuvenil');
        if (hasOldFutsal || !hasVolleyPrejuv) {
          saveTournaments(INITIAL_TOURNAMENTS);
          return INITIAL_TOURNAMENTS;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading tournaments from localStorage', e);
  }
  saveTournaments(INITIAL_TOURNAMENTS);
  return INITIAL_TOURNAMENTS;
}

export function saveTournaments(tournaments: Tournament[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(tournaments));
  } catch (e) {
    console.error('Error saving tournaments', e);
  }
}

export function loadTeams(): Team[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEAMS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const hasVolleyTeams = parsed.some((t: Team) => t.tournamentId === 'tourn-volley-prejuvenil');
        if (!hasVolleyTeams) {
          saveTeams(INITIAL_TEAMS);
          return INITIAL_TEAMS;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading teams from localStorage', e);
  }
  saveTeams(INITIAL_TEAMS);
  return INITIAL_TEAMS;
}

export function saveTeams(teams: Team[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
  } catch (e) {
    console.error('Error saving teams', e);
  }
}

export function loadMatches(): Match[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MATCHES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const hasVolleyMatches = parsed.some((m: Match) => m.tournamentId === 'tourn-volley-prejuvenil');
        if (!hasVolleyMatches) {
          saveMatches(INITIAL_MATCHES);
          return INITIAL_MATCHES;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading matches from localStorage', e);
  }
  saveMatches(INITIAL_MATCHES);
  return INITIAL_MATCHES;
}

export function saveMatches(matches: Match[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
  } catch (e) {
    console.error('Error saving matches', e);
  }
}

export function loadActiveTournamentId(tournaments: Tournament[]): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_TOURNAMENT_ID);
    if (saved && tournaments.some(t => t.id === saved)) {
      return saved;
    }
  } catch (e) {
    console.error('Error loading active tournament id', e);
  }
  // Default to Ping Pong tournament if available
  const pingpong = tournaments.find(t => t.id === 'tourn-pingpong-juvenil');
  if (pingpong) return pingpong.id;
  return tournaments[0]?.id || '';
}

export function saveActiveTournamentId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TOURNAMENT_ID, id);
  } catch (e) {
    console.error('Error saving active tournament id', e);
  }
}

export function getJudgePin(): string {
  return localStorage.getItem(STORAGE_KEYS.JUDGE_PIN) || '2422';
}

export function setJudgePin(pin: string): void {
  localStorage.setItem(STORAGE_KEYS.JUDGE_PIN, pin);
}

export function isJudgeAuthenticated(): boolean {
  return localStorage.getItem(STORAGE_KEYS.JUDGE_AUTH) === 'true';
}

export function setJudgeAuthenticated(auth: boolean): void {
  localStorage.setItem(STORAGE_KEYS.JUDGE_AUTH, auth ? 'true' : 'false');
}

/**
 * Resets exclusively Table Tennis tournament matches and stats to clean 0-0 state
 * while preserving the official player list and structure.
 */
export function resetTableTennisData(
  currentTournaments: Tournament[],
  currentTeams: Team[],
  currentMatches: Match[]
): { tournaments: Tournament[]; teams: Team[]; matches: Match[] } {
  const ttTournamentId = 'tourn-pingpong-juvenil';

  // 1. Reset player stats for Table Tennis players (keep players, names, numbers, grades)
  const updatedTeams = currentTeams.map(team => {
    if (team.tournamentId === ttTournamentId) {
      return {
        ...team,
        players: team.players.map(p => ({
          ...p,
          stats: {
            goalsOrPoints: 0,
            yellowCards: 0,
            redCards: 0,
          },
        })),
      };
    }
    return team;
  });

  // 2. Revert Table Tennis matches to the pristine initial fixture (40 group matches + 7 playoff matches in scheduled state)
  const officialTtMatches = INITIAL_MATCHES.filter(m => m.tournamentId === ttTournamentId);
  const otherMatches = currentMatches.filter(m => m.tournamentId !== ttTournamentId);
  const updatedMatches = [...officialTtMatches, ...otherMatches];

  saveTeams(updatedTeams);
  saveMatches(updatedMatches);

  return {
    tournaments: currentTournaments,
    teams: updatedTeams,
    matches: updatedMatches,
  };
}

export function resetAllData(): { tournaments: Tournament[]; teams: Team[]; matches: Match[] } {
  localStorage.removeItem(STORAGE_KEYS.TOURNAMENTS);
  localStorage.removeItem(STORAGE_KEYS.TEAMS);
  localStorage.removeItem(STORAGE_KEYS.MATCHES);
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_TOURNAMENT_ID);
  
  saveTournaments(INITIAL_TOURNAMENTS);
  saveTeams(INITIAL_TEAMS);
  saveMatches(INITIAL_MATCHES);
  
  return {
    tournaments: INITIAL_TOURNAMENTS,
    teams: INITIAL_TEAMS,
    matches: INITIAL_MATCHES,
  };
}

export function exportDataAsJson(): string {
  const data = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    tournaments: loadTournaments(),
    teams: loadTeams(),
    matches: loadMatches(),
  };
  return JSON.stringify(data, null, 2);
}

export function importDataFromJson(jsonStr: string): { success: boolean; error?: string } {
  try {
    const data = JSON.parse(jsonStr);
    if (!data.tournaments || !data.teams || !data.matches) {
      return { success: false, error: 'Estructura de archivo JSON inválida.' };
    }
    saveTournaments(data.tournaments);
    saveTeams(data.teams);
    saveMatches(data.matches);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al procesar JSON';
    return { success: false, error: message };
  }
}
