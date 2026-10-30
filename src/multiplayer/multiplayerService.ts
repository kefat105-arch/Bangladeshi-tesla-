/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VehicleStage, BiomeType, RemotePlayerState, VersusMatchFormat } from '../types/game';

export interface MultiplayerCallbacks {
  onConnectionChange: (status: 'disconnected' | 'connecting' | 'connected', ping?: number) => void;
  onPlayersUpdate: (players: RemotePlayerState[]) => void;
  onVersusCountdown?: (count: number) => void;
  onVersusStart?: () => void;
  onVersusFinished?: (results: { playerId: string; name: string; time: number; position: number }[]) => void;
  onChatMessage?: (sender: string, text: string) => void;
}

export class MultiplayerService {
  private ws: WebSocket | null = null;
  private url: string;
  private localId: string;
  private playerName: string = 'Rider_' + Math.floor(Math.random() * 900 + 100);
  private currentRoom: string = 'dhaka_central';
  private mode: 'freeroam' | 'versus' = 'freeroam';
  private versusFormat: VersusMatchFormat = '1v1';
  private currentMap: BiomeType = 'dhaka_city';

  private status: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  private ping: number = 42;
  private callbacks: MultiplayerCallbacks | null = null;
  private reconnectTimer: number | null = null;
  private heartbeatTimer: number | null = null;
  private simulatedPeers: RemotePlayerState[] = [];
  private simulationTimer: number | null = null;

  constructor() {
    this.localId = 'p_' + Math.random().toString(36).substring(2, 9);
    // Configurable server URL with Render default and environment override
    const defaultServer = (typeof window !== 'undefined' && (window as any).RENDER_SERVER_URL)
      || 'wss://bangladeshi-tesla-server.onrender.com';
    this.url = defaultServer;
  }

  public init(callbacks: MultiplayerCallbacks) {
    this.callbacks = callbacks;
    this.connect();
    this.startLocalSimulation();
  }

  public setPlayerInfo(name: string, map: BiomeType, mode: 'freeroam' | 'versus', format?: VersusMatchFormat) {
    this.playerName = name || this.playerName;
    this.currentMap = map;
    this.mode = mode;
    if (format) this.versusFormat = format;
    this.send({
      type: 'join_room',
      playerId: this.localId,
      name: this.playerName,
      room: `${mode}_${map}_${format || 'open'}`,
      map: this.currentMap,
      mode: this.mode,
    });
  }

  private connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.status = 'connecting';
    this.callbacks?.onConnectionChange('connecting');

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.status = 'connected';
        this.callbacks?.onConnectionChange('connected', this.ping);
        this.send({
          type: 'init',
          playerId: this.localId,
          name: this.playerName,
          map: this.currentMap,
          mode: this.mode,
        });
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleServerMessage(data);
        } catch {}
      };

      this.ws.onclose = () => {
        this.status = 'disconnected';
        this.callbacks?.onConnectionChange('disconnected');
        this.stopHeartbeat();
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.status = 'disconnected';
        this.callbacks?.onConnectionChange('disconnected');
      };
    } catch {
      this.status = 'disconnected';
      this.callbacks?.onConnectionChange('disconnected');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 6000);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const start = performance.now();
        this.send({ type: 'ping', t: start });
      }
    }, 5000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private send(msg: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(msg));
      } catch {}
    }
  }

  private handleServerMessage(data: any) {
    if (data.type === 'pong') {
      this.ping = Math.round(performance.now() - (data.t || 0));
      this.callbacks?.onConnectionChange('connected', this.ping);
    } else if (data.type === 'players_update') {
      const players: RemotePlayerState[] = data.players || [];
      this.callbacks?.onPlayersUpdate(players.filter((p) => p.id !== this.localId));
    } else if (data.type === 'versus_countdown') {
      this.callbacks?.onVersusCountdown?.(data.count);
    } else if (data.type === 'versus_start') {
      this.callbacks?.onVersusStart?.();
    } else if (data.type === 'versus_finished') {
      this.callbacks?.onVersusFinished?.(data.results);
    }
  }

  /**
   * Broadcast current local player state
   */
  public broadcastState(state: {
    posX: number;
    posY: number;
    posZ: number;
    speed: number;
    rotationY: number;
    rotationZ: number;
    vehicle: VehicleStage;
    isDriving: boolean;
    score: number;
    distance: number;
    lastCheckpoint: number;
  }) {
    this.send({
      type: 'player_state',
      playerId: this.localId,
      name: this.playerName,
      ...state,
    });

    // Update simulated peers relative to player for rich multiplayer feel in free roam & versus
    this.updateLocalSimulation(state.posZ, state.speed);
  }

  // --- Resilient local peer simulation when Render backend is cold-booting ---
  private startLocalSimulation() {
    const peerNames = ['Sakib_Rider', 'Anika_Speed', 'Karim_Dhaka', 'Tanvir_Velo', 'Riya_Flyer', 'Fahim_Chaser'];
    const vehicles: VehicleStage[] = ['sports_motorcycle', 'cng', 'sports_car', 'suv', 'bicycle', 'jeep'];

    this.simulatedPeers = peerNames.map((name, i) => ({
      id: `sim_${i}`,
      name,
      vehicle: vehicles[i % vehicles.length],
      posX: (i % 2 === 0 ? 1 : -1) * (1.8 + (i % 3) * 1.4),
      posY: 0,
      posZ: 15 + i * 22,
      speed: 22 + (i % 4) * 4,
      rotationY: 0,
      rotationZ: 0,
      isDriving: true,
      score: 1200 + i * 450,
      distance: 15 + i * 22,
      lastCheckpoint: 0,
    }));
  }

  private updateLocalSimulation(playerZ: number, playerSpeed: number) {
    if (this.status === 'connected') return; // When live socket is active, use live server data

    const dt = 0.016;
    for (const peer of this.simulatedPeers) {
      peer.posZ += peer.speed * dt;
      peer.distance = Math.floor(peer.posZ);
      peer.score += Math.floor(peer.speed * dt * 2);

      // Keep peers around player envelope (-40m behind to +140m ahead)
      if (peer.posZ < playerZ - 45) {
        peer.posZ = playerZ + 80 + Math.random() * 50;
      } else if (peer.posZ > playerZ + 180) {
        peer.posZ = playerZ - 30;
      }
    }

    this.callbacks?.onPlayersUpdate(this.simulatedPeers);
  }

  public getStatus() {
    return {
      status: this.status,
      ping: this.ping,
      playerId: this.localId,
      room: this.currentRoom,
    };
  }

  public dispose() {
    this.stopHeartbeat();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.simulationTimer) clearInterval(this.simulationTimer);
    if (this.ws) {
      try { this.ws.close(); } catch {}
      this.ws = null;
    }
  }
}

export const multiplayerService = new MultiplayerService();
