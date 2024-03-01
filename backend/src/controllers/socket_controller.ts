/**
 * Socket Controller
 */

import Debug from "debug";
import { Server, Socket } from "socket.io";
import {
	ClientToServerEvents,
	ServerToClientEvents,
	WaitingPlayer,
} from "@shared/types/SocketTypes";
import { waitForDebugger } from "inspector";
import prisma from "../prisma";

// Create a new debug instance
const debug = Debug("backend:socket_controller");

// Definiera 'socket' och 'io' utanför funktionen
let io: Server<ClientToServerEvents, ServerToClientEvents>;
let socket: Socket<ClientToServerEvents, ServerToClientEvents>;

// Skapa en array för att spåra väntande spelare
//let waitingPlayers: WaitingPlayer =[];

// Handle a user connecting
export const handleConnection = (
	socket: Socket<ClientToServerEvents, ServerToClientEvents>,
	io: Server<ClientToServerEvents, ServerToClientEvents>
) => {
	debug("🙋 A user connected", socket.id);

	// lyssnar till inkommande spelare
	socket.on("JoinTheGame", async (nickname) => {
		debug(`${nickname} joined the game`);

	// Carolins - När TVÅ spelare är inne i spelrummet, emita positionVirus (just nu gör den det såfort någon joinar)
	socket.emit("positionVirus");
	});
};

// Carolins - Mäta spelarens reaktionstid vid ett klick.

	let startTime: number;
	let clicked: boolean = false
	let player1Time: { reactionTime: number, playerName: string } | null = null;
	let player2Time: { reactionTime: number, playerName: string } | null = null;

    const startTimer = () => {  //startTimer() ska anropas med samma delay som viruset dyker upp
	startTime = Date.now();

		// lyssna efter klick på virus
		socket.on("virusClick", (playerName: string) => {
			if (!clicked) { // = inte false, alltså true
				clicked = true;  //spelaren har klickat
				const reactionTime = Date.now() - startTime;
				const playerTime = { reactionTime: reactionTime, playerName: playerName };

				if(!player1Time) {
					player1Time = playerTime;
				} else if (!player2Time) {
					player2Time = playerTime;
				}
				io.emit("clickResponseTime", reactionTime)
				clicked = false; // återställer click
			}
		});

		// om ingen klick gjorts på 30 sek
		const handleNoclick = () => {
				if (!clicked) {
					clicked = true;
					io.emit("clickResponseTime", 30000);
					clicked = false; // återställer click
				}
		};

		// När tiden skickats, kör compareReactionTime()
		compareReactionTime();
 };

  // Carolin - Jämför tid och utse rundans vinnare
 const compareReactionTime = () => {
    if (player1Time && player2Time) {
        if (player1Time.reactionTime < player2Time.reactionTime) {
            io.emit("winnerOfRound", player1Time.playerName);
        } else if (player2Time.reactionTime < player1Time.reactionTime) {
            io.emit("winnerOfRound", player2Time.playerName);
        } else {
            io.emit("winnerOfRound", "It's a tie!");
        }
    }
};
