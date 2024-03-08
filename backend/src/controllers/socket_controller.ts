// Socket Controller

import Debug from "debug";
import { Server, Socket } from "socket.io";
import {
	ClientToServerEvents,
	ServerToClientEvents,
	WaitingPlayer,
	RoomWithUsers,
	PlayerReaction,
	GameEndedData,
} from "@shared/types/SocketTypes";
import prisma from "../prisma";

// Skapa en ny instans av debug
const debug = Debug("backend:socket_controller");

let waitingPlayers: WaitingPlayer[] = [];

let roundCount = 0;
const totalRounds = 10;
let playerReactions: Record<string, PlayerReaction> = {};
let gameStarted = false;
let roundStarted = Date.now();
let scores = {
	player1: 0,
	player2: 0,
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
			roundCount = 1;
			emitVirusPosition();
			io.emit("newRound", roundCount);

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
	/*
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
*/

	/*
	socket.on("virusClick", (nickname) => {
		if (!gameStarted || roundCount > totalRounds) return;

		// Registrera reaktionstid endast om spelaren inte redan har klickat under denna runda
		if (!playerReactions[nickname]) {
			const reactionTime = Date.now() - roundStarted;
			playerReactions[nickname] = {
				clicked: true,
				reactionTime: reactionTime,
			};

			console.log(
				`Spelaren ${nickname} klickade på viruset! Reaktionstid:`,
				reactionTime
			);

			// Meddela alla klienter om spelarens reaktionstid
			io.emit("clickResponseTime", reactionTime, nickname);

			// Kontrollera om alla spelare har reagerat
			if (
				Object.keys(playerReactions).length ==
				Object.keys(scores).length
			) {
				console.log(
					"Alla spelare har klickat. Förbereder att starta nästa runda..."
				);
				setTimeout(() => {
					startNextRound(); // Starta nästa runda efter en kort fördröjning
				}, 2000); // 2 sekunders fördröjning till nästa runda
			}
		}
	});

*/

	function startNextRound() {
		if (roundCount < totalRounds) {
			roundCount++;
			playerReactions = {}; // Nollställ reaktionstider för nästa runda
			roundStarted = Date.now(); // Uppdatera starttiden för den nya rundan
			emitVirusPosition();
			io.emit("newRound", roundCount);
		} else {
			endGame(); // Avsluta spelet om max antal rundor har nåtts
		}
	}

	socket.on("registerClick", async (time: number) => {
		console.log("Register click");
		let socketId = socket.id;

		console.log("SocketId:" + socketId);
		console.log("Time:" + time);

		// Hitta användaren baserat på socketId och uppdatera deras poäng
		try {
			const user = await prisma.user.findFirst({
				where: {
					socketId: socketId,
				},
			});

			if (user) {
				await prisma.user.update({
					where: {
						id: user.id, // Använd det unika id som hittades med findFirst
					},
					data: {
						scores: {
							push: time,
						},
					},
				});

				console.log(
					"Updated user scores for user with socket ID:",
					socketId
				);

				const otherUser = await prisma.user.findFirst({
					where: {
						AND: [
							{
								roomId: user.roomId, // the user is in the same room
							},
							{
								id: {
									not: user.id, // the user has a different id
								},
							},
						],
					},
				});

				if (otherUser != null) {
					io.to(otherUser.socketId).emit("otherRegisterClick", time);
				}

				console.log("Found Other USer");
				console.log(otherUser);
			} else {
				console.log("No user found with socket ID:", socketId);
			}
		} catch (error) {
			console.error("Error updating user scores:", error);
		}
	});

	// Definiera funktionen för att avsluta spelet och meddela spelarna
	const endGame = () => {
		const winner =
			scores.player1 > scores.player2
				? "player1"
				: scores.player1 < scores.player2
				? "player2"
				: "tie";

		const gameEndedData = {
			winner: winner === "tie" ? "Oavgjort" : winner,
			scores: scores, // Antag att detta är formatet du redan använder
			roundsPlayed: roundCount,
		};

		console.log("Game ended", gameEndedData);

		resetGameState();
	};

	function resetGameState() {
		gameStarted = false;
		waitingPlayers = [];
		playerReactions = {};
		roundCount = 0;
		scores = { player1: 0, player2: 0 }; // Återställ poängen
		roundStarted = Date.now(); // Återställ starttiden för nästa spel
	}

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
