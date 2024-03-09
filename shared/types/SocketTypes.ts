export {};

// Events emitted by the server to the client
export interface ServerToClientEvents {
  JoinTheGame: (nickename: string) => void;
  GameTime: (message: GameTimeMessage) => void;
  UpdateLobby: (playerNames: string[]) => void;
  positionVirus: (data: VirusPosition) => void;
  clickResponseTime: (elapsedTime: number, nickename: string) => void;
  winnerOfRound: (winner: string) => void;
  removeVirus: () => void;
  updateScore: (data: ScoreData) => void;
  OtherPlayerJoined: (response: UserJoinResponse) => void;
  userJoined: (username: string, timestamp: number) => void;
  readyToStart: () => void;
  gameEnded: (data: GameEndedData) => void;
  otherRegisterClick: (time: number,socketId:string) => void;
  stopTimer: () => void;
  updateFrontendScore: (data: {
    playerOneScore: number;
    playerTwoScore: number;
  }) => void;
  newRound:(roundCount:number)=> void;
  resetTimers:()=> void;
  PlayerJoined: (data: { player1name: string; player2name: string }) => void;
  
}


// Events emitted by the client to the server
export interface ClientToServerEvents {
  JoinTheGame: (
    nickname: string,
    callback: (response: UserJoinResponse) => void
  ) => void;
  virusClick: (nickname: string) => void;

  getRoomList: (callback: (rooms: Room[]) => void) => void;
  userJoinRequest: (
    nickname: string,
    roomId: string,
    callback: (response: UserJoinResponse) => void
  ) => void;
  playerReady: () => void;
  registerClick: (time: number) => void;
  stopTimer: () => void;
  newRound:(roundCount:number)=> void;
}

export interface WaitingPlayer {
  socketId: string;
  nickname: string;
}

export interface User {
  id: string;
  nickname: string;
  roomId: string;
}
export interface VirusPosition {
  x: number;
  y: number;
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
export interface Room {
  id: string;
  name: string;
}

export interface RoomWithUsers extends Room {
  users: User[];
}

export interface UserJoinResponse {
  success: boolean;
  room: RoomWithUsers | null;
  nicknames: string[];
  player1name?: string; // Make these properties optional
  player2name?: string;
}

export interface PlayerReaction {
    [key: string]: number;
}


export interface GameEndedData {
  winner: string;
  scores: {
    Player1: number;
    Player2: number;
  };
  roundsPlayed: number;
}
export interface ScoreData {
  scores?: {
    player1: number;
    player2: number;
  };
  highscore?: {
    player: string;
    score: number;
  };
}

 export interface UpdateLobbyData {
  room: RoomWithUsers; // Antag att du har definierat RoomWithUsers någonstans
  nicknames: string[];
}
