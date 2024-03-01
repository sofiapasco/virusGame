// Socket Controller

import Debug from "debug";
import { Server, Socket } from "socket.io";
import {
	ClientToServerEvents,
	ServerToClientEvents,
	WaitingPlayer,
} from "@shared/types/SocketTypes";
import prisma from "../prisma";

// Skapa en ny instans av debug
const debug = Debug("backend:socket_controller");

// Definiera 'socket' och 'io' utanför funktionen
let io: Server<ClientToServerEvents, ServerToClientEvents>;
let socket: Socket<ClientToServerEvents, ServerToClientEvents>;

// Skapa en array för att spåra väntande spelare
let waitingPlayers: WaitingPlayer[] = [];

// Antal rundor
let roundCount = 0;
const totalRounds = 10;

// Hantera anslutningen av en användare
export const handleConnection = (
	socket: Socket<ClientToServerEvents, ServerToClientEvents>,
	io: Server<ClientToServerEvents, ServerToClientEvents>
) => {
	debug("🙋 A user connected", socket.id);

	// När alla användare har anslutit och spelet har startat, skicka "newRound" händelsen till klienten
	socket.emit("newRound", roundCount + 1);

	// Nollställ arrayen av väntande spelare
	waitingPlayers = [];

	// Lyssna efter anslutning till "JoinTheGame"-händelsen
	socket.on("JoinTheGame", (nickname, callback) => {
		debug(`${nickname} joined the game`);

		// Lägg till spelaren i arrayen av väntande spelare
		waitingPlayers.push({ socketId: socket.id, nickname });
		debug("waitingPlayers: %o", waitingPlayers);

		// Emit the event to notify other players in the lobby
		socket.broadcast.emit("otherPlayerJoined", nickname);

		callback(true);
	});

	// Carolins - Mäta spelarens reaktionstid vid ett klick.

	let startTime: number;
	let clicked: boolean = false;
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
		const handleVirusClick = () => {
			if (!clicked) {
				clicked = true; // Spelaren har klickat
				const reactionTime = Date.now() - startTime;
				io.emit("clickResponseTime", reactionTime);
			}
		};
		// Lyssna efter klick på virus
		socket.on("virusClick", handleVirusClick);

		// Om ingen klick gjorts på 30 sekunder
		setTimeout(() => {
			if (!clicked) {
				clicked = true;
				io.emit("clickResponseTime", 30000);
			}
		}, 30000); // När 30 sekunder gått skickas koden ovan med 30 sekunder som tid
	};
};

// Funktion för att skapa användarna i databasen och starta spelet
const startGame = async () => {
	try {
		for (const player of waitingPlayers) {
			await prisma.user.create({
				data: {
					nickname: player.nickname,
					scores: [],
				},
			});
		}

		// Här kan du starta spelet och utföra annan logik
		debug("Starting the game...");

		// Nollställ arrayen av väntande spelare
		waitingPlayers = [];
	} catch (error) {
		debug("Error creating user:", error);
	}
};
