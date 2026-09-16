import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { INITIAL_MATCHES, INITIAL_TEAMS, INITIAL_TOURNAMENTS } from './src/data/initialData';
import { FOOTBALL_MATCHES, FOOTBALL_TEAMS, FOOTBALL_TOURNAMENTS } from './src/data/footballData';
import { Match, Team, Tournament } from './src/types';

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'data_store.json');

// Interface for Cloud Database State
interface DatabaseState {
  tournaments: Tournament[];
  teams: Team[];
  matches: Match[];
  activeTournamentId: string;
  lastUpdated: string;
}

// In-Memory & File Store
let dbState: DatabaseState = {
  tournaments: INITIAL_TOURNAMENTS,
  teams: INITIAL_TEAMS,
  matches: INITIAL_MATCHES,
  activeTournamentId: 'tourn-pingpong-juvenil',
  lastUpdated: new Date().toISOString(),
};

// Initialize DB from disk or seed
function initDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.matches) && parsed.matches.length > 0) {
        // Ensure table tennis tournament and crucial matches (like 3rd place and final) are present
        const officialPingPong = INITIAL_TOURNAMENTS.find(t => t.id === 'tourn-pingpong-juvenil');
        const hasPingPong = parsed.tournaments.some((t: Tournament) => t.id === 'tourn-pingpong-juvenil');
        
        let tournaments = parsed.tournaments;
        if (officialPingPong && !hasPingPong) {
          tournaments = [officialPingPong, ...parsed.tournaments];
        }
        // Sync rules with INITIAL_TOURNAMENTS (e.g. Volleyball 30 points direct)
        tournaments = tournaments.map((t: Tournament) => {
          const initT = INITIAL_TOURNAMENTS.find(it => it.id === t.id);
          if (initT) {
            return {
              ...t,
              rules: initT.rules,
              description: initT.description,
              name: initT.name,
              category: initT.category,
            };
          }
          return t;
        });

        // Ensure all football tournaments are present and updated
        FOOTBALL_TOURNAMENTS.forEach(ft => {
          const idx = tournaments.findIndex((t: Tournament) => t.id === ft.id);
          if (idx !== -1) {
            tournaments[idx] = ft;
          } else {
            tournaments.push(ft);
          }
        });

        // Set of football tournament IDs
        const footballTournIds = new Set(FOOTBALL_TOURNAMENTS.map(ft => ft.id));

        // Merge matches: keep played results for pingpong and volleyball
        const matchMap = new Map<string, Match>();
        INITIAL_MATCHES.forEach(m => matchMap.set(m.id, m));
        parsed.matches.forEach((m: Match) => {
          // If it is a pingpong or volleyball match, keep saved match state
          if (!footballTournIds.has(m.tournamentId)) {
            const initMatch = INITIAL_MATCHES.find(im => im.id === m.id);
            matchMap.set(m.id, {
              ...m,
              roundName: initMatch?.roundName || m.roundName,
            });
          }
        });

        // Always make sure all official football matches are accurately registered
        FOOTBALL_MATCHES.forEach(fm => {
          // Check if match was already in matchMap; if it was played or had cards, preserve events
          const existing = matchMap.get(fm.id);
          if (existing && (existing.status === 'finished' || existing.status === 'in_progress')) {
            matchMap.set(fm.id, {
              ...fm,
              homeScore: existing.homeScore,
              awayScore: existing.awayScore,
              status: existing.status,
              half: existing.half,
              timerSeconds: existing.timerSeconds,
              timerRunning: existing.timerRunning,
              arbitrationPaidHome: existing.arbitrationPaidHome,
              arbitrationPaidAway: existing.arbitrationPaidAway,
              events: existing.events,
            });
          } else {
            matchMap.set(fm.id, fm);
          }
        });

        // Ensure 3rd place match exists for table tennis
        const thirdPlaceMatch = INITIAL_MATCHES.find(m => m.id === 'm-tt-3rd-place');
        if (thirdPlaceMatch && !matchMap.has('m-tt-3rd-place')) {
          matchMap.set('m-tt-3rd-place', thirdPlaceMatch);
        }

        const mergedMatches = Array.from(matchMap.values());

        // Merge teams: keep pingpong and volleyball, sync football teams
        const teamMap = new Map<string, Team>();
        INITIAL_TEAMS.forEach(t => teamMap.set(t.id, t));
        (parsed.teams || []).forEach((t: Team) => {
          if (!footballTournIds.has(t.tournamentId)) {
            teamMap.set(t.id, t);
          }
        });
        FOOTBALL_TEAMS.forEach(ft => {
          // Check if team had payment changes in existing
          const existing = teamMap.get(ft.id);
          if (existing) {
            teamMap.set(ft.id, {
              ...ft,
              paymentStatus: existing.paymentStatus ?? ft.paymentStatus,
              players: ft.players.map(p => {
                const ep = existing.players?.find(pl => pl.id === p.id);
                return ep ? { ...p, ...ep, name: p.name, number: p.number } : p;
              }),
            });
          } else {
            teamMap.set(ft.id, ft);
          }
        });
        const mergedTeams = Array.from(teamMap.values());

        dbState = {
          tournaments,
          teams: mergedTeams,
          matches: mergedMatches,
          activeTournamentId: parsed.activeTournamentId || 'tourn-pingpong-juvenil',
          lastUpdated: new Date().toISOString(),
        };
        saveDatabaseToDisk();
        console.log(`[Database] Loaded ${dbState.matches.length} matches and ${dbState.teams.length} teams from ${DB_FILE}`);
        return;
      }
    }
  } catch (err: any) {
    console.warn('[Database] Initializing fallback state:', err?.message || String(err));
  }

  // First time seed
  dbState = {
    tournaments: INITIAL_TOURNAMENTS,
    teams: INITIAL_TEAMS,
    matches: INITIAL_MATCHES,
    activeTournamentId: 'tourn-pingpong-juvenil',
    lastUpdated: new Date().toISOString(),
  };
  saveDatabaseToDisk();
  console.log('[Database] Seeded initial database with 17 finished official matches and 40 group matches');
}

function saveDatabaseToDisk() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), 'utf-8');
  } catch (err: any) {
    console.warn('[Database] Disk write status:', err?.message || String(err));
  }
}

// Active Server-Sent Events (SSE) Client Connections
const sseClients = new Set<express.Response>();

function broadcastEvent(type: string, data: any) {
  const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

async function startServer() {
  initDatabase();

  const app = express();

  // Basic CORS & Parser
  app.use(express.json({ limit: '10mb' }));
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Health APIs
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      connectedClients: sseClients.size,
      lastUpdated: dbState.lastUpdated,
      matchesCount: dbState.matches.length,
      tournamentsCount: dbState.tournaments.length,
    });
  });

  // Real-Time Server-Sent Events Endpoint
  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    sseClients.add(res);

    // Initial greeting / handshake
    res.write(`event: connected\ndata: ${JSON.stringify({ message: 'Connected to FairPlay Cloud Realtime DB', clients: sseClients.size })}\n\n`);

    // Keep-alive heartbeat every 15 seconds
    const intervalId = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 15000);

    req.on('close', () => {
      clearInterval(intervalId);
      sseClients.delete(res);
    });
  });

  // GET Full Database State
  app.get('/api/data', (req, res) => {
    res.json({
      success: true,
      data: dbState,
    });
  });

  // POST Full Sync or Multi-Item Update
  app.post('/api/sync', (req, res) => {
    const { tournaments, teams, matches, activeTournamentId } = req.body;

    let changed = false;

    if (Array.isArray(tournaments)) {
      dbState.tournaments = tournaments;
      changed = true;
    }
    if (Array.isArray(teams)) {
      dbState.teams = teams;
      changed = true;
    }
    if (Array.isArray(matches)) {
      dbState.matches = matches;
      changed = true;
    }
    if (activeTournamentId) {
      dbState.activeTournamentId = activeTournamentId;
      changed = true;
    }

    if (changed) {
      dbState.lastUpdated = new Date().toISOString();
      saveDatabaseToDisk();
      broadcastEvent('FULL_SYNC', {
        data: dbState,
        source: 'api_sync',
        timestamp: dbState.lastUpdated,
      });
    }

    res.json({
      success: true,
      lastUpdated: dbState.lastUpdated,
      data: dbState,
    });
  });

  // PATCH /api/matches/:id - Instant point / score / status update
  app.patch('/api/matches/:id', (req, res) => {
    const matchId = req.params.id;
    const patch = req.body;

    const index = dbState.matches.findIndex(m => m.id === matchId);
    if (index === -1) {
      // If match doesn't exist, create it if full match payload provided
      if (patch.id && patch.roundName) {
        dbState.matches.push(patch);
        dbState.lastUpdated = new Date().toISOString();
        saveDatabaseToDisk();
        broadcastEvent('MATCH_UPDATED', { match: patch, timestamp: dbState.lastUpdated });
        return res.json({ success: true, match: patch });
      }
      return res.status(404).json({ success: false, error: 'Match not found' });
    }

    const updatedMatch: Match = {
      ...dbState.matches[index],
      ...patch,
    };

    dbState.matches[index] = updatedMatch;
    dbState.lastUpdated = new Date().toISOString();
    saveDatabaseToDisk();

    // Broadcast instant update to all connected spectators and judges
    broadcastEvent('MATCH_UPDATED', {
      match: updatedMatch,
      timestamp: dbState.lastUpdated,
    });

    res.json({
      success: true,
      match: updatedMatch,
      lastUpdated: dbState.lastUpdated,
    });
  });

  // POST /api/matches - Create or upsert a match
  app.post('/api/matches', (req, res) => {
    const match = req.body as Match;
    if (!match || !match.id) {
      return res.status(400).json({ success: false, error: 'Invalid match data' });
    }

    const index = dbState.matches.findIndex(m => m.id === match.id);
    if (index >= 0) {
      dbState.matches[index] = match;
    } else {
      dbState.matches.push(match);
    }

    dbState.lastUpdated = new Date().toISOString();
    saveDatabaseToDisk();

    broadcastEvent('MATCH_UPDATED', {
      match,
      timestamp: dbState.lastUpdated,
    });

    res.json({ success: true, match });
  });

  // DELETE /api/matches/:id
  app.delete('/api/matches/:id', (req, res) => {
    const matchId = req.params.id;
    const initialLength = dbState.matches.length;
    dbState.matches = dbState.matches.filter(m => m.id !== matchId);

    if (dbState.matches.length !== initialLength) {
      dbState.lastUpdated = new Date().toISOString();
      saveDatabaseToDisk();
      broadcastEvent('MATCH_DELETED', { matchId, timestamp: dbState.lastUpdated });
      return res.json({ success: true, matchId });
    }

    res.status(404).json({ success: false, error: 'Match not found' });
  });

  // POST /api/teams - Update or add teams
  app.post('/api/teams', (req, res) => {
    const { team, teams } = req.body;
    if (Array.isArray(teams)) {
      dbState.teams = teams;
    } else if (team && team.id) {
      const idx = dbState.teams.findIndex(t => t.id === team.id);
      if (idx >= 0) {
        dbState.teams[idx] = team;
      } else {
        dbState.teams.push(team);
      }
    }

    dbState.lastUpdated = new Date().toISOString();
    saveDatabaseToDisk();

    broadcastEvent('TEAMS_UPDATED', { teams: dbState.teams, timestamp: dbState.lastUpdated });
    res.json({ success: true, teams: dbState.teams });
  });

  // Vite Integration
  const isProduction = process.env.NODE_ENV === 'production';
  const distPath = path.join(process.cwd(), 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));

  if (process.env.NODE_ENV === 'production' && hasDist) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  // Resilient listener with safe retry for port reuse during dev restarts
  const listenWithRetry = async (targetPort: number, maxRetries = 10, delayMs = 400) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const srv = await new Promise<any>((resolve, reject) => {
          const s = app.listen(targetPort, '0.0.0.0', () => {
            resolve(s);
          });
          s.once('error', (err: any) => {
            try {
              s.close();
            } catch {
              // Ignore if server was not running
            }
            reject(err);
          });
        });
        return srv;
      } catch (err: any) {
        if (err?.code === 'EADDRINUSE' && attempt < maxRetries) {
          console.log(`Port ${targetPort} in use, retrying (${attempt}/${maxRetries})...`);
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }
        throw err;
      }
    }
  };

  const server = await listenWithRetry(PORT);
  console.log(`Server running on http://localhost:${PORT}`);

  const shutdown = () => {
    if (server) {
      server.close(() => {
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((err) => {
  console.error('[Server Startup Fatal Error]', err);
  process.exit(1);
});
