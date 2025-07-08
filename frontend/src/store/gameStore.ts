import { create } from 'zustand'

export interface GamePlayer {
  id: string
  username: string
  nickname?: string
  rank: number
}

export interface GameTeam {
  id: string
  teamNumber: number
  avgRank: number
  players: GamePlayer[]
}

export interface GameRoom {
  id: string
  status: 'WAITING' | 'MATCHING' | 'READY' | 'PLAYING' | 'FINISHED'
  playerCount: number
  maxPlayers: number
  teams: GameTeam[]
  createdAt: string
  startedAt?: string
  endedAt?: string
}

export interface MatchQueue {
  inQueue: boolean
  queueCount: number
  needPlayers: number
  joinedAt?: string
}

interface GameState {
  // 匹配状态
  matchQueue: MatchQueue
  isMatching: boolean
  
  // 游戏房间
  currentRoom: GameRoom | null
  myTeam: GameTeam | null
  
  // Socket连接状态
  isConnected: boolean
  
  // 操作方法
  setMatchQueue: (queue: MatchQueue) => void
  setMatching: (matching: boolean) => void
  setCurrentRoom: (room: GameRoom | null) => void
  setMyTeam: (team: GameTeam | null) => void
  setConnected: (connected: boolean) => void
  
  // 重置状态
  reset: () => void
}

const initialState = {
  matchQueue: {
    inQueue: false,
    queueCount: 0,
    needPlayers: 16
  },
  isMatching: false,
  currentRoom: null,
  myTeam: null,
  isConnected: false
}

export const useGameStore = create<GameState>((set) => ({
  ...initialState,
  
  setMatchQueue: (matchQueue) => set({ matchQueue }),
  setMatching: (isMatching) => set({ isMatching }),
  setCurrentRoom: (currentRoom) => set({ currentRoom }),
  setMyTeam: (myTeam) => set({ myTeam }),
  setConnected: (isConnected) => set({ isConnected }),
  
  reset: () => set(initialState)
})) 