// Socket Controller

import Debug from "debug";
import { Server, Socket } from "socket.io";
import {
	ClientToServerEvents,
	ServerToClientEvents,
	WaitingPlayer,
	UserJoinResponse,
	RoomWithUsers,
	PlayerReaction,
	GameEndedData
} from "@shared/types/SocketTypes";
import prisma from "../prisma";

// Skapa en ny instans av debug
const debug = Debug("backend:socket_controller");

let waitingPlayers: WaitingPlayer[] = [];

// Antal rundor
let roundCount = 0;
const totalRounds = 10;
let playerReactions: Record<string, PlayerReaction> = {};
let gameStarted = false;



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
	socket.on("JoinTheGame", async (nickname: string, callback) => {
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
/*
		// Your startGame function now checks if all players are ready before starting
	const startGame = async () => {
	// Check if all players are ready before starting the game
	if (waitingPlayers.every((player) => player.isReady)) {
		try {

			gameStarted = true;
			waitingPlayers = [];
			roundCount = 1; // Börja från runda 1
			io.emit("newRound", roundCount);
		} catch (error) {
			debug("Error creating user:", error);
		}
	} else {
		// Handle the case where not all players are ready (if necessary)
	}
};
*/
		// Lägg till spelaren i arrayen av väntande spelare
		waitingPlayers.push({ socketId: socket.id, nickname });
		debug("waitingPlayers: %o", waitingPlayers);

		// Uppdatera lobbyn för att visa de nya spelarna
		const nicknames = waitingPlayers.map((player) => player.nickname);

		//2 Spelar är anslutna och vi skapar ett rum till dem.
		if (waitingPlayers.length === 2) {
			var roomWithUsers = await initiateGameIfReady(waitingPlayers);
			io.emit("UpdateLobby", nicknames);
			waitingPlayers = [];

			callback({
				success: true,
				room: roomWithUsers,
				nicknames,
			});
		}

		callback({
			success: true,
			room: null, // Ingen faktiskt rum ännu, så rummet är null
			nicknames,
		});
	});

	async function initiateGameIfReady(
		players: WaitingPlayer[]
	): Promise<RoomWithUsers> {
		let roomWithUsers: RoomWithUsers = {
			id: "",
			name: "",
			users: [],
		};

		debug("Before creating a room");
		let dbRoom = await prisma.room.create({
			data: {
				name: `Game between ${players[0].nickname} and ${players[1].nickname}`,
			},
		});
		debug("After creating a room");

		roomWithUsers.name = dbRoom.name;
		roomWithUsers.id = dbRoom.id;
		console.log(dbRoom);

		debug("Before creating users");

		for (let player of players) {
			let dbUser = await prisma.user.create({
				data: {
					nickname: player.nickname,
					roomId: dbRoom.id,
					socketId: player.socketId,
				},
			});

			roomWithUsers.users.push(dbUser);
			console.log(dbUser);
		}
		debug("After creating users");

		return roomWithUsers;
	}

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

  const startNextRound = () => {
    roundCount++; // Öka rundräknaren
    if (roundCount > totalRounds) {
        endGame(); // Hantera spelets slut om max rundor nåtts
        return;
    }
    playerReactions = {}; // Återställ reaktionerna för nästa runda
    emitVirusPosition(); // Sänder ut en ny virusposition
    io.emit("newRound", roundCount); // Meddela alla spelare att en ny runda börjar
};

// Definiera funktionen för att avsluta spelet och meddela spelarna
const endGame = () => {
	const gameEndedData: GameEndedData = {
	  winner: "Player1", // Exempeldata, du skulle bestämma detta baserat på ditt spel
	  scores: {
		"Player1": 10,
		"Player2": 8,
	  },
	  roundsPlayed: roundCount,
	  gameDuration: 600000,
	};

	io.emit("gameEnded", gameEndedData);
  };

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
