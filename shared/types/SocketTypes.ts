export {}

// Events emitted by the server to the client
export interface ServerToClientEvents {
    hello: () => void;
    JoinTheGame: (nickename:string) => void;
    //GameTime:(message:GameTimeMessage) => void;

}

// Events emitted by the client to the server
export interface ClientToServerEvents {
    JoinTheGame: (nickname:string, callback:(success:boolean) => void) => void;
   // GameTimeRequest:(nickname:string ,opponent:string, callback: ())

}

export interface WaitingPlayer {
	socketId: string;
	nickname: string;
  }


  export interface MatchFoundMessage {
    opponent: string;
}
