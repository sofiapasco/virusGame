// Socket Controller

import Debug from "debug";
import { Server, Socket } from "socket.io";
import {
	ClientToServerEvents,
	ServerToClientEvents,
	WaitingPlayer,
	UserJoinResponse,
	RoomWithUsers,
	User,
} from "@shared/types/SocketTypes";
import prisma from "../prisma";

// Skapa en ny instans av debug
const debug = Debug("backend:socket_controller");

let waitingPlayers: WaitingPlayer[] = [];

// Antal rundor
let roundCount = 0;
const totalRounds = 10;
let gameStarted = false;

// Funktion som initierar ett nytt spel om två spelare är redo
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
