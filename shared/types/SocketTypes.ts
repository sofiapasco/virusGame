export {};

// Events emitted by the server to the client
export interface ServerToClientEvents {
  JoinTheGame: (nickename: string) => void;
  GameTime: (message: GameTimeMessage) => void;
  UpdateLobby: (playerNames: string[]) => void;
  positionVirus: () => void;
  clickResponseTime: (elapsedTime: number) => void;
  newRound: (round: number) => void;
  winnerOfRound: (winner: string) => void; 
  otherPlayerJoined: (nickname: string) => void; 
  removeVirus: () => void; 
  updateScore: (data: { latestMatches: MatchResult[], highscore: { player: string; score: number; } | null}) => void;
}

// Events emitted by the client to the server
export interface ClientToServerEvents {
  JoinTheGame: (nickname: string, callback: (success: boolean) => void) => void;
  virusClick: (nickname: string) => void;

}

export interface WaitingPlayer {
  socketId: string;
  nickname: string;
}

export interface GameTimeMessage {
  opponent: string;
}

export interface ReactionTimes {
  [player: string]: {
    total: number;
    count: number;
  };
}

export interface MatchResult {
  id: string;
  winner: string;
  loser: string;
  gameTime: number;
}