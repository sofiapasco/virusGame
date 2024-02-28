export {}

// Events emitted by the server to the client
export interface ServerToClientEvents {
    hello: () => void;
    JoinTheGame: (nickename:string) => void;
    positionVirus: () => void;
}

// Events emitted by the client to the server
export interface ClientToServerEvents {
    JoinTheGame: (nickname:string, callback:(success:boolean) => void) => void;

}


export interface WaitingPlayer {
	socketId: string;
	nickname: string;
  }

