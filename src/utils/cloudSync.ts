import { Match, Team, Tournament } from '../types';

export type SyncEventType = 'MATCH_UPDATED' | 'FULL_SYNC' | 'TEAMS_UPDATED' | 'CONNECTION_CHANGE';

export interface SyncEventPayload {
  type: SyncEventType;
  match?: Match;
  teams?: Team[];
  tournaments?: Tournament[];
  matches?: Match[];
  timestamp?: string;
  connected?: boolean;
}

type SyncListener = (event: SyncEventPayload) => void;

class CloudSyncService {
  private eventSource: EventSource | null = null;
  private listeners: Set<SyncListener> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private isConnected: boolean = false;
  private reconnectTimeout: any = null;
  private pollInterval: any = null;
  private lastSyncTimestamp: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel('fairplay_sync_channel');
        this.broadcastChannel.onmessage = (e) => {
          if (e.data) {
            this.notifyListeners(e.data);
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel not supported in this browser', err);
      }
      this.connectSSE();
      this.startPollingFallback();
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    // Notify immediate connection state
    listener({ type: 'CONNECTION_CHANGE', connected: this.isConnected });
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  private notifyListeners(payload: SyncEventPayload) {
    this.listeners.forEach((fn) => {
      try {
        fn(payload);
      } catch (err) {
        console.error('Error in sync listener', err);
      }
    });
  }

  private setConnectionState(connected: boolean) {
    if (this.isConnected !== connected) {
      this.isConnected = connected;
      this.notifyListeners({ type: 'CONNECTION_CHANGE', connected });
    }
  }

  private connectSSE() {
    if (typeof window === 'undefined') return;

    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch {
        // ignore
      }
      this.eventSource = null;
    }

    try {
      this.eventSource = new EventSource('/api/events');

      this.eventSource.onopen = () => {
        this.setConnectionState(true);
      };

      this.eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          this.setConnectionState(true);
          this.lastSyncTimestamp = Date.now();

          if (parsed.type === 'MATCH_UPDATED' && parsed.match) {
            const payload: SyncEventPayload = {
              type: 'MATCH_UPDATED',
              match: parsed.match,
              timestamp: parsed.timestamp,
            };
            this.notifyListeners(payload);
            this.broadcastChannel?.postMessage(payload);
          } else if (parsed.type === 'FULL_SYNC' && parsed.data) {
            const payload: SyncEventPayload = {
              type: 'FULL_SYNC',
              tournaments: parsed.data.tournaments,
              teams: parsed.data.teams,
              matches: parsed.data.matches,
              timestamp: parsed.timestamp,
            };
            this.notifyListeners(payload);
            this.broadcastChannel?.postMessage(payload);
          } else if (parsed.type === 'TEAMS_UPDATED' && parsed.teams) {
            const payload: SyncEventPayload = {
              type: 'TEAMS_UPDATED',
              teams: parsed.teams,
              timestamp: parsed.timestamp,
            };
            this.notifyListeners(payload);
            this.broadcastChannel?.postMessage(payload);
          }
        } catch {
          // ignore heartbeats / ping comments
        }
      };

      this.eventSource.onerror = () => {
        this.setConnectionState(false);
        if (this.eventSource) {
          try {
            this.eventSource.close();
          } catch {
            // ignore
          }
          this.eventSource = null;
        }
        // Auto-reconnect in 2.5 seconds
        if (!this.reconnectTimeout) {
          this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            this.connectSSE();
          }, 2500);
        }
      };
    } catch (e) {
      console.warn('Failed to start SSE', e);
      this.setConnectionState(false);
    }
  }

  // Periodic polling fallback in case SSE is paused on mobile background
  private startPollingFallback() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = setInterval(async () => {
      // If no event received in past 8 seconds or disconnected, poll server data
      const now = Date.now();
      if (!this.isConnected || now - this.lastSyncTimestamp > 8000) {
        try {
          const res = await fetch('/api/data', { cache: 'no-store' });
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.data) {
              this.setConnectionState(true);
              this.lastSyncTimestamp = now;
              this.notifyListeners({
                type: 'FULL_SYNC',
                tournaments: json.data.tournaments,
                teams: json.data.teams,
                matches: json.data.matches,
                timestamp: json.data.lastUpdated,
              });
            }
          }
        } catch {
          // silent fallback failure
        }
      }
    }, 4000);
  }

  public async fetchCloudData(): Promise<{
    tournaments: Tournament[];
    teams: Team[];
    matches: Match[];
    activeTournamentId?: string;
  } | null> {
    try {
      const res = await fetch('/api/data', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          this.setConnectionState(true);
          this.lastSyncTimestamp = Date.now();
          return json.data;
        }
      }
    } catch (err) {
      console.warn('Error fetching cloud data', err);
    }
    return null;
  }

  public async syncMatchToCloud(match: Match): Promise<boolean> {
    // Notify local listeners and broadcast channel immediately for instant feedback
    const payload: SyncEventPayload = {
      type: 'MATCH_UPDATED',
      match,
      timestamp: new Date().toISOString(),
    };
    this.notifyListeners(payload);
    this.broadcastChannel?.postMessage(payload);

    try {
      const res = await fetch(`/api/matches/${match.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(match),
      });
      if (res.ok) {
        this.setConnectionState(true);
        this.lastSyncTimestamp = Date.now();
        return true;
      }
    } catch (err) {
      console.error('Error syncing match to cloud', err);
    }
    return false;
  }

  public async syncTeamsToCloud(teams: Team[]): Promise<boolean> {
    const payload: SyncEventPayload = {
      type: 'TEAMS_UPDATED',
      teams,
      timestamp: new Date().toISOString(),
    };
    this.notifyListeners(payload);
    this.broadcastChannel?.postMessage(payload);

    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teams }),
      });
      if (res.ok) {
        this.setConnectionState(true);
        return true;
      }
    } catch (err) {
      console.error('Error syncing teams to cloud', err);
    }
    return false;
  }

  public async syncAllToCloud(data: {
    tournaments?: Tournament[];
    teams?: Team[];
    matches?: Match[];
    activeTournamentId?: string;
  }): Promise<boolean> {
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        this.setConnectionState(true);
        return true;
      }
    } catch (err) {
      console.error('Error syncing all to cloud', err);
    }
    return false;
  }
}

export const cloudSync = new CloudSyncService();
