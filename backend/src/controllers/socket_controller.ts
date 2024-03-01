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

	const startTimer = () => {
		startTime = Date.now();

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
