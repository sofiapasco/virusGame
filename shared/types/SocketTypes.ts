export {}

// Events emitted by the server to the client
export interface ServerToClientEvents {
    hello: () => void;
    JoinTheGame: (nickename:string) => void;
    GameTime:(message:GameTimeMessage) => void;
    UpdateLobby:(playerNames:string[])=>void;
    positionVirus: () => void;
    clickResponseTime: (elapsedTime:number) => void;
}

// Events emitted by the client to the server
export interface ClientToServerEvents {
    JoinTheGame: (nickname:string, callback:(success:boolean) => void) => void;
    virusClick: (nickname:string) => void;
}

export interface WaitingPlayer {
	socketId: string;
	nickname: string;
}

  export interface GameTimeMessage {
    opponent: string;
}
