export {};

// Events emitted by the server to the client
export interface ServerToClientEvents {
  hello: () => void;
  JoinTheGame: (nickename: string) => void;
  GameTime: (message: GameTimeMessage) => void;
  UpdateLobby: (playerNames: string[]) => void;
  positionVirus: () => void;
  clickResponseTime: (elapsedTime: number) => void;
  newRound: (round: number) => void;
  winnerOfRound: (winner: string) => void;
  OtherPlayerJoined: (response: UserJoinResponse) => void;
  userJoined: (username: string, timestamp: number) => void;
  readyToStart: () => void;
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

export interface GameTimeMessage {
  opponent: string;
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
}
