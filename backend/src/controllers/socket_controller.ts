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
	socket.on("JoinTheGame", async (nickname, callback) => {
		debug (`${nickname} joined the game`);

		try {
			const user = await prisma.user.create({
				data: {
					nickname: nickname,
					scores: [],
				},
			});

			debug(`User created with ID: ${user.id}`);
			callback(true);
		} catch (error) {
			debug("Error creating user:", error);
			callback(false);
		}

	// Carolins - När TVÅ spelare är inne i spelrummet, emita positionVirus (just nu gör den det såfort någon joinar)
	socket.emit("positionVirus");
	});
};

// Carolins - Mäta spelarens reaktionstid vid ett klick.

	let startTime: number;
	let clicked: boolean = false

  const startTimer = () => {
	startTime = Date.now();

	const handleVirusClick = () => {
		if (!clicked) { // = inte false, alltså true
			clicked = true;  //spelaren har klickat
			const reactionTime = Date.now() - startTime;
			io.emit("clickResponseTime", reactionTime)
		}
	};
		// lyssna efter klick på virus
		socket.on("virusClick", handleVirusClick);

		// om ingen klick gjorts på 30 sek
		setTimeout(() => {
			if (!clicked) {
				clicked = true;
				io.emit("clickResponseTime", 30000);
			}
		}, 30000); //när 30 sek gått skickas koden ovan med 30 sek som tid
 };
