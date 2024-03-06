// Socket Controller

import Debug from "debug";
import { Server, Socket } from "socket.io";
import {
	ClientToServerEvents,
	ServerToClientEvents,
	WaitingPlayer,
	ReactionTimes,
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
			debug("Starting the game...");
			// Start round logic or any other start game logic should go here
			// After starting the game, reset the waitingPlayers array
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



	// Nollställ arrayen av väntande spelare
	waitingPlayers = [];

	// Lyssna efter anslutning till "JoinTheGame"-händelsen
	socket.on("JoinTheGame", (nickname: string, callback) => {
		debug(`${nickname} joined the game`);

	// Lägg till spelaren i arrayen av väntande spelare
	//waitingPlayers.push({ socketId: socket.id, nickname });
	debug("waitingPlayers: %o", waitingPlayers);

	// Emit the event to notify other players in the lobby
	//socket.broadcast.emit("otherPlayerJoined", nickname);

		// När alla användare har anslutit och spelet har startat, skicka "newRound" händelsen till klienten
		console.log(`Client connected: ${socket.id}`);
		socket.emit("newRound", roundCount + 1);
		emitVirusPosition()



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
	let player1Time: { reactionTime: number, playerName: string } | null = null;
	let player2Time: { reactionTime: number, playerName: string } | null = null;

  	const startTimer = () => {  //startTimer() ska anropas med samma delay som viruset dyker upp
		startTime = Date.now();

		// lyssna efter klick på virus
		socket.on("virusClick", (playerName: string) => {
			if (!clicked) {
				// = inte false, alltså true
				clicked = true; //spelaren har klickat
				const reactionTime = Date.now() - startTime;
				console.log(
					"Spelaren klickade på viruset! Reaktionstid:",
					reactionTime
				);

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

	// Funktion för att skapa användarna i databasen och starta spelet
	const startGame = async () => {
		try {
			for (const player of waitingPlayers) {
			}

			// Här kan du starta spelet och utföra annan logik
			debug("Starting the game...");

			// Nollställ arrayen av väntande spelare
			waitingPlayers = [];
		} catch (error) {
			debug("Error creating user:", error);
		}
	};

	const sendUpdateToClients = async () => {
		try {
			// Hämta de senaste matchresultaten från databasen
			const latestMatches = await prisma.matchResult.findMany({
				take: 10,
				orderBy: {
					id: "desc",
				},
			});

			// Beräkna highscore
			const highscore = await calculateHighscore();

			// Skicka uppdaterad statistik till klienten
			io.emit("updateScore", { latestMatches, highscore });
		} catch (error) {
			console.error("Error sending update to clients:", error);
		}
	};

	const saveMatchResult = async (
		winner: string,
		loser: string,
		gameTime: number
	) => {
		try {
			// Skapa en ny post i databasen med matchresultatet och ska skickas till klienten
			await prisma.matchResult.create({
				data: {
					winner: winner,
					loser: loser,
					gameTime: gameTime,
				},
			});

			// Hämta de senaste 10 matcherna från databasen
			const latestMatches = await prisma.matchResult.findMany({
				take: 10,
				orderBy: {
					id: "desc",
				},
			});

			// Om antalet sparade matcher överstiger 10, ta bort de äldsta matcherna
			if (latestMatches.length > 10) {
				const matchesToDelete = latestMatches.slice(10);
				await prisma.matchResult.deleteMany({
					where: {
						id: {
							in: matchesToDelete.map((match) => match.id),
						},
					},
				});
			}
			await sendUpdateToClients();
			console.log("Match result saved successfully.");
		} catch (error) {
			console.error("Error saving match result:", error);
		}
	};

	// Anropa funktionen för att spara matchresultat efter att en match är avslutad
	saveMatchResult("Player 1", "Player 2",300);
};

// Skicka uppdateringar till alla anslutna klienter

const calculateHighscore = async () => {
	try {
		// Hämta de senaste matchresultaten från databasen
		const latestMatches = await prisma.matchResult.findMany({
			take: 10,
			orderBy: {
				id: "desc",
			},
		});

		// Skapa ett objekt för att lagra reaktionstiderna för varje spelare
		const reactionTimes: ReactionTimes = {};

		// Beräkna totala reaktionstid och antal matcher för varje spelare
		latestMatches.forEach((match) => {
			if (!reactionTimes[match.winner]) {
				reactionTimes[match.winner] = { total: 0, count: 0 };
			}
			reactionTimes[match.winner].total += match.gameTime;
			reactionTimes[match.winner].count++;

			if (!reactionTimes[match.loser]) {
				reactionTimes[match.loser] = { total: 0, count: 0 };
			}
			reactionTimes[match.loser].total += match.gameTime;
			reactionTimes[match.loser].count++;
		});

		// Beräkna genomsnittlig reaktionstid för varje spelare och hitta highscore
		let highscore = Infinity;
		let highscorePlayer = "";
		for (const player in reactionTimes) {
			const averageTime =
				reactionTimes[player].total / reactionTimes[player].count;
			if (averageTime < highscore) {
				highscore = averageTime;
				highscorePlayer = player;
			}
		}

		return { player: highscorePlayer, score: highscore };
	} catch (error) {
		console.error("Error calculating highscore:", error);
		return null;
	}
};

//Funktion för att spara resultatet av en match i databasen
