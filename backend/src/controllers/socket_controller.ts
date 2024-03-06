// Socket Controller

import Debug from "debug";
import { Server, Socket } from "socket.io";
import {
	ClientToServerEvents,
	ServerToClientEvents,
	WaitingPlayer,
	UserJoinResponse,
	RoomWithUsers,
	PlayerReaction
} from "@shared/types/SocketTypes";
import prisma from "../prisma";

// Extend the existing WaitingPlayer type to include readiness
interface WaitingPlayerExtended extends WaitingPlayer {
	isReady: boolean;
}

// Skapa en ny instans av debug
const debug = Debug("backend:socket_controller");

// Skapa en array för att spåra väntande spelare
let waitingPlayers: WaitingPlayerExtended[] = [];

// Antal rundor
let roundCount = 0;
const totalRounds = 10;
let playerReactions: Record<string, PlayerReaction> = {};
let gameStarted = false;

// Your startGame function now checks if all players are ready before starting
const startGame = async () => {
	// Check if all players are ready before starting the game
	if (waitingPlayers.every((player) => player.isReady)) {
		try {
			// Your existing logic to create users in the database goes here
			//			for (const player of waitingPlayers) {
			//				await prisma.user.create({
			//					data: {
			//
			//			nickname: player.nickname,
			//			scores: [],
			//		},
			//	});
			//}
			//console.log(player.data);
			// Start round logic or any other start game logic should go here
			// After starting the game, reset the waitingPlayers array
			gameStarted = true;
			waitingPlayers = [];
		} catch (error) {
			debug("Error creating user:", error);
		}
	} else {
		// Handle the case where not all players are ready (if necessary)
	}
};

export const handleConnection = (
	socket: Socket<ClientToServerEvents, ServerToClientEvents>,
	io: Server<ClientToServerEvents, ServerToClientEvents>
) => {
	debug("🙋 A user connected", socket.id);

	socket.on("disconnect", () => {
		// Ta bort användaren från waitingPlayers baserat på socket.id
		waitingPlayers = waitingPlayers.filter(
			(player) => player.socketId !== socket.id
		);
		debug(`User disconnected, removed from waitingPlayers: ${socket.id}`);
	});

	// Lyssna efter anslutning till "JoinTheGame"-händelsen
	socket.on("JoinTheGame", (nickname: string, callback) => {
		debug(
			`Attempt to join game by ${nickname}, game started: ${gameStarted}`
		);

		if (gameStarted) {
			debug("Game already started, new players cannot join right now.");
			callback({
				success: false,
				room: null,
				nicknames: [],
			});
			return;
		}

		// Lägg till spelaren i arrayen av väntande spelare
		waitingPlayers.push({ socketId: socket.id, nickname, isReady: false });
		debug("waitingPlayers: %o", waitingPlayers);

		// Uppdatera lobbyn för att visa de nya spelarna
		const nicknames: string[] = waitingPlayers.map(
			(player) => player.nickname
		);

		if (waitingPlayers.length === 2) {
			io.emit("UpdateLobby", nicknames);

		}

	function emitVirusPosition() {
		// Slumpa fram en position
		const x = Math.floor(Math.random() * 10) + 1; // Exempel: x mellan 1 och 10
		const y = Math.floor(Math.random() * 10) + 1; // Exempel: y mellan 1 och 10

		console.log(`Emitting virus position: x=${x}, y=${y}`);
		// Sänd virusposition till alla anslutna klienter
		socket.emit("positionVirus", { x, y });

	}

	io.on("connection", (socket) => {
		console.log(`Client connected: ${socket.id}`);


	});


		const room: RoomWithUsers = {
			id: "The id",
			name: "The name",
			users: [],
		};

		const response: UserJoinResponse = {
			success: true,
			room: room,
			nicknames: nicknames,
		};
		io.emit("OtherPlayerJoined", response);
		callback(response);
	});

	// Handle the playerReady event when a player indicates they are ready
	socket.on("playerReady", () => {
		// Find the player and set their isReady flag to true
		const player = waitingPlayers.find((p) => p.socketId === socket.id);
		if (player) {
			player.isReady = true;
			// Check if all players are ready and start the game
			if (waitingPlayers.every((p) => p.isReady)) {
				startGame();



			}
		}
	});

	function emitVirusPosition() {
		// Slumpa fram en position
		const x = Math.floor(Math.random() * 10) + 1; // Exempel: x mellan 1 och 10
		const y = Math.floor(Math.random() * 10) + 1; // Exempel: y mellan 1 och 10

		console.log(`Emitting virus position: x=${x}, y=${y}`);
		// Sänd virusposition till alla anslutna klienter
		io.emit("positionVirus", { x, y });
	}

	io.on("connection", (socket) => {
		console.log(`Client connected: ${socket.id}`);
	});


// Carolins - Mäta spelarens reaktionstid vid ett klick.

	let startTime: number;
	let clicked: boolean = false;
	let player1Time: { reactionTime: number; playerName: string } | null = null;
	let player2Time: { reactionTime: number; playerName: string } | null = null;

	const startTimer = () => {
		//startTimer() ska anropas med samma delay som viruset dyker upp
		startTime = Date.now();

		// lyssna efter klick på virus
		socket.on("virusClick", (playerName: string) => {
			if (!clicked) {
				// = inte false, alltså true
				clicked = true; //spelaren har klickat
				const reactionTime = Date.now() - startTime;
				const playerTime = {
					reactionTime: reactionTime,
					playerName: playerName,
				};

				if (!player1Time) {
					player1Time = playerTime;
				} else if (!player2Time) {
					player2Time = playerTime;
				}
				io.emit("clickResponseTime", reactionTime);
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

// Lyssna efter händelsen "virusClick" från klienten
socket.on("virusClick", (nickname) => {
	const reactionTime = Date.now() - startTime;
	console.log(`Spelaren ${nickname} klickade på viruset! Reaktionstid:`, reactionTime);

	// Uppdatera spelarens reaktionstid och klickstatus
    playerReactions[nickname] = { clicked: true, reactionTime: reactionTime };

	// Skicka tillbaka reaktionstiden till klienten om det behövs
	 io.emit("clickResponseTime", reactionTime);
	 socket.emit("removeVirus");

	 if (Object.keys(playerReactions).length == 2 && Object.values(playerReactions).every(player => player.clicked)) {
        console.log("Alla spelare har klickat. Förbereder att starta nästa runda...");
        setTimeout(() => {
            startNextRound(); // Ge lite fördröjning innan nästa runda startar
        }, 2000); // 2 sekunders fördröjning till nästa runda
    }



  });

  function startNextRound() {
    playerReactions = {}; // Återställ reaktionerna för nästa runda
    emitVirusPosition(); // Antag att detta sänder ut en ny virusposition
}

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
};
