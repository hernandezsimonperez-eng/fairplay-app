import { Match, Team, Tournament } from '../types';
import { saveMatches, saveTeams, saveTournaments, saveActiveTournamentId } from './storage';

export interface CloudDatabaseData {
  tournaments: Tournament[];
  teams: Team[];
  matches: Match[];
  activeTournamentId: string;
  lastUpdated?: string;
}

export type RealtimeEventType = 
  | 'MATCH_UPDATED' 
  | 'MATCH_DELETED' 
  | 'TEAMS_UPDATED' 
  | 'FULL_SYNC' 
  | 'CONNECTED' 
  | 'DISCONNECTED';

export interface RealtimeEvent {
  type: RealtimeEventType;
  payload: any;
  timestamp: string;
}

type RealtimeListener = (event: RealtimeEvent) => void;

class RealtimeCloudService {
  private eventSource: EventSource | null = null;
  private listeners: Set<RealtimeListener> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private isConnected: boolean = false;
  private reconnectTimeout: any = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('fairplay_realtime_channel');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.type) {
            this.notifyListeners(event.data);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported in this environment', e);
      }
    }
  }

  public init() {
    if (typeof window === 'undefined') return;
    this.connectSSE();
  }

  private connectSSE() {
    if (this.eventSource) {
      this.eventSource.close();
    }

    try {
      this.eventSource = new EventSource('/api/events');

      this.eventSource.onopen = () => {
        this.isConnected = true;
        this.notifyListeners({
          type: 'CONNECTED',
          payload: { status: 'connected' },
          timestamp: new Date().toISOString(),
        });
      };

      this.eventSource.addEventListener('MATCH_UPDATED', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          this.notifyListeners({
            type: 'MATCH_UPDATED',
            payload: data,
            timestamp: data.timestamp || new Date().toISOString(),
          });
        } catch (err) {
          console.error('Error parsing MATCH_UPDATED event', err);
        }
      });

      this.eventSource.addEventListener('MATCH_DELETED', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          this.notifyListeners({
            type: 'MATCH_DELETED',
            payload: data,
            timestamp: data.timestamp || new Date().toISOString(),
          });
        } catch (err) {
          console.error('Error parsing MATCH_DELETED event', err);
        }
      });

      this.eventSource.addEventListener('FULL_SYNC', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          this.notifyListeners({
            type: 'FULL_SYNC',
            payload: data,
            timestamp: data.timestamp || new Date().toISOString(),
          });
        } catch (err) {
          console.error('Error parsing FULL_SYNC event', err);
        }
      });

      this.eventSource.addEventListener('TEAMS_UPDATED', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          this.notifyListeners({
            type: 'TEAMS_UPDATED',
            payload: data,
            timestamp: data.timestamp || new Date().toISOString(),
          });
        } catch (err) {
          console.error('Error parsing TEAMS_UPDATED event', err);
        }
      });

      this.eventSource.onerror = () => {
        this.isConnected = false;
        this.notifyListeners({
          type: 'DISCONNECTED',
          payload: { status: 'reconnecting' },
          timestamp: new Date().toISOString(),
        });
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
        // Attempt reconnect after 3 seconds
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = setTimeout(() => {
          this.connectSSE();
        }, 3000);
      };
    } catch (e) {
      console.warn('Failed to start EventSource:', e);
    }
  }

  public subscribe(listener: RealtimeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(event: RealtimeEvent) {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in realtime event listener', err);
      }
    });
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  // API Call: Fetch complete database state
  public async fetchCloudData(): Promise<CloudDatabaseData | null> {
    try {
      const response = await fetch('/api/data', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      if (json && json.data) {
        // Cache to localStorage
        if (json.data.tournaments) saveTournaments(json.data.tournaments);
        if (json.data.teams) saveTeams(json.data.teams);
        if (json.data.matches) saveMatches(json.data.matches);
        if (json.data.activeTournamentId) saveActiveTournamentId(json.data.activeTournamentId);
        return json.data;
      }
    } catch (e) {
      console.warn('Could not fetch cloud data, using local fallback:', e);
    }
    return null;
  }

  // API Call: Patch a single match in real time
  public async updateMatch(match: Match): Promise<boolean> {
    // 1. Broadcast locally first (optimistic)
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'MATCH_UPDATED',
          payload: { match, timestamp: new Date().toISOString() },
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        // ignore
      }
    }

    // 2. Send to Cloud Server
    try {
      const response = await fetch(`/api/matches/${encodeURIComponent(match.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(match),
      });
      return response.ok;
    } catch (e) {
      console.warn('Failed to push match update to cloud server:', e);
      return false;
    }
  }

  // API Call: Sync all or part of state
  public async syncAllData(data: Partial<CloudDatabaseData>): Promise<boolean> {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'FULL_SYNC',
          payload: { data, timestamp: new Date().toISOString() },
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        // ignore
      }
    }

    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.ok;
    } catch (e) {
      console.warn('Failed to sync data with cloud server:', e);
      return false;
    }
  }

  // API Call: Delete a match
  public async deleteMatch(matchId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/matches/${encodeURIComponent(matchId)}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (e) {
      console.warn('Failed to delete match from cloud server:', e);
      return false;
    }
  }

  // API Call: Save Teams
  public async saveTeams(teams: Team[]): Promise<boolean> {
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teams }),
      });
      return response.ok;
    } catch (e) {
      console.warn('Failed to save teams to cloud server:', e);
      return false;
    }
  }
}

export const cloudService = new RealtimeCloudService();
