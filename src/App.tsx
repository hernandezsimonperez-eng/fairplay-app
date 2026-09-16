import { useState, useEffect } from 'react';
import { Match, Player, Team, Tournament, ViewMode } from './types';
import { 
  loadActiveTournamentId, 
  loadMatches, 
  loadTeams, 
  loadTournaments, 
  saveActiveTournamentId, 
  saveMatches, 
  saveTeams, 
  saveTournaments,
  isJudgeAuthenticated,
  setJudgeAuthenticated
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { SpectatorView } from './components/SpectatorView';
import { JudgeView } from './components/JudgeView';
import { PinModal } from './components/PinModal';
import { SportsMenu } from './components/SportsMenu';
import { syncPlayoffParticipants } from './utils/calculator';
import { cloudSync } from './utils/cloudSync';

export default function App() {
  const [tournaments, setTournaments] = useState<Tournament[]>(() => loadTournaments());
  const [teams, setTeams] = useState<Team[]>(() => loadTeams());
  const [matches, setMatches] = useState<Match[]>(() => loadMatches());
  const [activeTournamentId, setActiveTournamentId] = useState<string>(() => loadActiveTournamentId(tournaments));
  const [viewMode, setViewMode] = useState<ViewMode>('spectator');
  
  // Judge auth state
  const [isJudgeAuth, setIsJudgeAuth] = useState<boolean>(() => isJudgeAuthenticated());
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  // Sync back to local storage whenever states update
  useEffect(() => {
    saveTournaments(tournaments);
  }, [tournaments]);

  useEffect(() => {
    saveTeams(teams);
  }, [teams]);

  useEffect(() => {
    saveMatches(matches);
  }, [matches]);

  useEffect(() => {
    saveActiveTournamentId(activeTournamentId);
  }, [activeTournamentId]);

  // Real-time Cloud Sync listener for instantaneous cross-tab and remote updates
  useEffect(() => {
    const unsubscribe = cloudSync.subscribe((event) => {
      if (event.type === 'MATCH_UPDATED' && event.match) {
        const incoming = event.match;
        setMatches(prev => {
          const matchExists = prev.some(m => m.id === incoming.id);
          if (matchExists) {
            return prev.map(m => m.id === incoming.id ? incoming : m);
          }
          return [incoming, ...prev];
        });
      } else if (event.type === 'TEAMS_UPDATED' && event.teams) {
        setTeams(event.teams);
      }
    });
    return unsubscribe;
  }, []);

  // Ensure active tournament is valid
  const activeTournament = tournaments.find(t => t.id === activeTournamentId) || tournaments[0];

  const handleSelectTournament = (id: string) => {
    setActiveTournamentId(id);
  };

  // Reload all from storage (e.g., after Import or Demo Reset)
  const handleDataReload = () => {
    const loadedTournaments = loadTournaments();
    const loadedTeams = loadTeams();
    const loadedMatches = loadMatches();
    setTournaments(loadedTournaments);
    setTeams(loadedTeams);
    setMatches(loadedMatches);
    setActiveTournamentId(loadedTournaments[0]?.id || '');
  };

  // Judge Mode Access Workflow
  const handleRequestJudgeAccess = () => {
    if (isJudgeAuth) {
      setViewMode('judge');
    } else {
      setIsPinModalOpen(true);
    }
  };

  const handlePinSuccess = () => {
    setIsJudgeAuth(true);
    setJudgeAuthenticated(true);
    setIsPinModalOpen(false);
    setViewMode('judge');
  };

  const handleExitJudgeMode = () => {
    setViewMode('spectator');
  };

  const handleLockJudgeSession = () => {
    setIsJudgeAuth(false);
    setJudgeAuthenticated(false);
    setViewMode('spectator');
  };

  // Tournament CRUD
  const handleSaveTournament = (tournamentToSave: Tournament) => {
    setTournaments(prev => {
      const exists = prev.some(t => t.id === tournamentToSave.id);
      if (exists) {
        return prev.map(t => t.id === tournamentToSave.id ? tournamentToSave : t);
      }
      return [tournamentToSave, ...prev];
    });
    setActiveTournamentId(tournamentToSave.id);
  };

  const handleDeleteTournament = (id: string) => {
    setTournaments(prev => prev.filter(t => t.id !== id));
    setTeams(prev => prev.filter(t => t.tournamentId !== id));
    setMatches(prev => prev.filter(m => m.tournamentId !== id));
    const remaining = tournaments.filter(t => t.id !== id);
    if (remaining.length > 0) {
      setActiveTournamentId(remaining[0].id);
    }
  };

  // Team CRUD
  const handleSaveTeam = (teamToSave: Team) => {
    setTeams(prev => {
      const exists = prev.some(t => t.id === teamToSave.id);
      if (exists) {
        return prev.map(t => t.id === teamToSave.id ? teamToSave : t);
      }
      return [...prev, teamToSave];
    });
  };

  const handleDeleteTeam = (teamId: string) => {
    setTeams(prev => prev.filter(t => t.id !== teamId));
    setMatches(prev => prev.filter(m => m.homeTeamId !== teamId && m.awayTeamId !== teamId));
  };

  // Player CRUD
  const handleSavePlayer = (playerToSave: Player) => {
    setTeams(prev => prev.map(team => {
      if (team.id === playerToSave.teamId) {
        const playerExists = team.players.some(p => p.id === playerToSave.id);
        const updatedPlayers = playerExists
          ? team.players.map(p => p.id === playerToSave.id ? playerToSave : p)
          : [...team.players, playerToSave];
        return {
          ...team,
          captainName: playerToSave.isCaptain ? playerToSave.name : team.captainName,
          players: updatedPlayers,
        };
      }
      return team;
    }));
  };

  const handleDeletePlayer = (teamId: string, playerId: string) => {
    setTeams(prev => prev.map(team => {
      if (team.id === teamId) {
        return {
          ...team,
          players: team.players.filter(p => p.id !== playerId),
        };
      }
      return team;
    }));
  };

  // Match CRUD
  const handleUpdateMatch = (updatedMatch: Match) => {
    setMatches(prev => {
      const updated = prev.map(m => m.id === updatedMatch.id ? updatedMatch : m);
      if (activeTournament) {
        return syncPlayoffParticipants(activeTournament, teams, updated);
      }
      return updated;
    });
    // Optimistic background sync to cloud / other peers
    cloudSync.syncMatchToCloud(updatedMatch);
  };

  const handleAddMatch = (newMatch: Match) => {
    setMatches(prev => [newMatch, ...prev]);
  };

  const handleAddMultipleMatches = (newMatches: Match[]) => {
    setMatches(prev => [...newMatches, ...prev]);
  };

  const handleDeleteMatch = (matchId: string) => {
    setMatches(prev => prev.filter(m => m.id !== matchId));
  };

  const handleFinishMatch = (matchId: string) => {
    setMatches(prev => {
      const updated = prev.map(m => {
        if (m.id === matchId) {
          return {
            ...m,
            status: 'finished' as const,
            timerRunning: false,
          };
        }
        return m;
      });
      if (activeTournament) {
        return syncPlayoffParticipants(activeTournament, teams, updated);
      }
      return updated;
    });
  };

  // Payment Toggle (Tachar pago)
  const handleTogglePayment = (teamId: string) => {
    setTeams(prev => prev.map(team => {
      if (team.id === teamId) {
        const nextStatus = team.paymentStatus === 'paid' ? 'pending' : 'paid';
        return {
          ...team,
          paymentStatus: nextStatus,
          paymentDate: nextStatus === 'paid' ? new Date().toLocaleDateString() : undefined,
          players: team.players.map(p => ({
            ...p,
            paymentStatus: nextStatus,
            paymentDate: nextStatus === 'paid' ? new Date().toLocaleDateString() : undefined,
          })),
        };
      }
      return team;
    }));
  };

  const hasLiveMatch = matches.some(m => m.status === 'in_progress');

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-black">
      
      {/* Navigation Header */}
      <Navbar
        tournaments={tournaments}
        activeTournamentId={activeTournamentId}
        onSelectTournament={handleSelectTournament}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        isJudgeAuth={isJudgeAuth}
        onRequestJudgeAccess={handleRequestJudgeAccess}
        onExitJudgeMode={handleExitJudgeMode}
        onLockJudgeSession={handleLockJudgeSession}
        onDataChange={handleDataReload}
        hasLiveMatch={hasLiveMatch}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6">
        {tournaments.length > 0 && (
          <SportsMenu
            tournaments={tournaments}
            activeTournamentId={activeTournamentId}
            onSelectTournament={handleSelectTournament}
          />
        )}

        {activeTournament ? (
          viewMode === 'spectator' ? (
            <SpectatorView
              tournament={activeTournament}
              teams={teams}
              matches={matches}
              onTogglePayment={handleTogglePayment}
              onOpenLiveScoreboardForJudge={(matchId) => {
                handleRequestJudgeAccess();
              }}
            />
          ) : (
            <JudgeView
              tournament={activeTournament}
              tournaments={tournaments}
              teams={teams}
              matches={matches}
              onSelectTournament={handleSelectTournament}
              onSaveTournament={handleSaveTournament}
              onDeleteTournament={handleDeleteTournament}
              onSaveTeam={handleSaveTeam}
              onDeleteTeam={handleDeleteTeam}
              onSavePlayer={handleSavePlayer}
              onDeletePlayer={handleDeletePlayer}
              onUpdateMatch={handleUpdateMatch}
              onAddMatch={handleAddMatch}
              onAddMultipleMatches={handleAddMultipleMatches}
              onDeleteMatch={handleDeleteMatch}
              onFinishMatch={handleFinishMatch}
              onTogglePayment={handleTogglePayment}
            />
          )
        ) : (
          <div className="text-center py-20">
            <p className="text-slate-400">No hay torneos registrados actualmente.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-scoreboard text-base font-bold tracking-wider text-emerald-400">FAIRPLAY</span>
            <span>• PWA de Gestión Deportiva Escolar</span>
          </div>
          <p>
            Persistencia LocalStorage activa • Compatible con Móvil, Tablet y Escritorio
          </p>
        </div>
      </footer>

      {/* PIN Security Modal */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinSuccess}
      />

    </div>
  );
}
