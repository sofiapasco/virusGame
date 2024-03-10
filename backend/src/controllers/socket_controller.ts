// Socket Controller

import Debug from "debug";
import { Server, Socket } from "socket.io";
import {
	ClientToServerEvents,
	ServerToClientEvents,
	WaitingPlayer,
	RoomWithUsers,
	GameEndedData,
	PlayerReaction,
	UserJoinResponse,
} from "@shared/types/SocketTypes";
import prisma from "../prisma";
import { User } from "@prisma/client";

// Skapa en ny instans av debug
const debug = Debug("backend:socket_controller");

let waitingPlayers: WaitingPlayer[] = [];
const MAX_ROUNDS = 10;

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
		debug(`Attempt to join game by ${nickname}, game started`);

		// Lägg till spelaren i arrayen av väntande spelare
		waitingPlayers.push({ socketId: socket.id, nickname });
		debug("waitingPlayers: %o", waitingPlayers);

		// Uppdatera lobbyn för att visa de nya spelarna
		const nicknames = waitingPlayers.map((player) => player.nickname);

		//2 Spelar är anslutna och vi skapar ett rum till dem.
		if (waitingPlayers.length === 2) {
			let roomWithUsers = await initiateGameIfReady(waitingPlayers);

			//Add the clients to their own room
			console.log("Current socket id: " + socket.id);
			addSocketToRoom(waitingPlayers[0].socketId, roomWithUsers.id);
			addSocketToRoom(waitingPlayers[1].socketId, roomWithUsers.id);

			waitingPlayers = [];
			io.to(roomWithUsers.id).emit("UpdateLobby", nicknames);

			startNextRound(roomWithUsers.id, 0);

			callback({
				success: true,
				room: roomWithUsers,
				nicknames,
				player1name: roomWithUsers.users[0].nickname, // Antag att första användaren i rummet är player1
				player2name: roomWithUsers.users[1].nickname,
			});
		}

		callback({
			success: true,
			room: null, //Waiting for 2nd player to create room.
			nicknames,
		});
	});

	function addSocketToRoom(socketId: string, roomId: string) {
		const targetSocket = io.sockets.sockets.get(socketId);
		console.log("Adding socket " + socketId + "to Room: " + roomId);
		if (targetSocket) {
			targetSocket.join(roomId);
			console.log(`Socket ${socketId} added to room ${roomId}`);
		} else {
			console.log(`Socket ${socketId} does not exist.`);
		}
	}

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
				name: `Game between ${players[0].nickname} and ${
					players[1].nickname
				} - ${Date.now()}`,
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

	function startNextRound(roomId: string, playedRounds: number) {
		console.log("Starting new round");
		if (playedRounds < MAX_ROUNDS) {
			console.log("We start a new Round!:" + playedRounds++);

			setTimeout(
				() => emitVirusAndStartNewRound(roomId, playedRounds),
				randomDelay()
			);
		} else {
			endGame(roomId);
		}
	}

	function emitVirusAndStartNewRound(roomId: string, playedRounds: number) {
		emitVirusPosition(roomId);
		io.to(roomId).emit("newRound", playedRounds++);
	}

	function calculateScore(userOne: User, userTwo: User) {
		let { totalPlayerOne, totalPlayerTwo } = calculateUserScores(
			userOne,
			userTwo
		);

		console.log("Player One score:" + totalPlayerOne);
		console.log("Player Two total score: " + totalPlayerTwo);

		io.to(userTwo.socketId).emit("updateFrontendScore", {
			playerOneScore: totalPlayerOne,
			playerTwoScore: totalPlayerTwo,
		});
		io.to(userOne.socketId).emit("updateFrontendScore", {
			playerOneScore: totalPlayerTwo,
			playerTwoScore: totalPlayerOne,
		});
	}

	socket.on("registerClick", async (time: number) => {
		console.log(
			"Register click: " + "Socket: " + socket.id + ". Time: " + time
		);
		let socketId = socket.id;

		// Hitta användaren baserat på socketId och uppdatera deras poäng
		try {
			const user = await prisma.user.findFirst({
				where: {
					socketId: socketId,
				},
			});

			user?.scores.push(time);
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
					io.to(otherUser.socketId).emit(
						"otherRegisterClick",
						time,
						socketId
					);
				}

				if (user && otherUser) {
					if (user.scores.length == otherUser.scores.length) {
						calculateScore(user, otherUser);
						startNextRound(
							user.roomId,
							GetPlayedRounds(user.scores)
						);
					}
				}
			} else {
				console.log("No user found with socket ID:", socketId);
			}
		} catch (error) {
			console.error("Error updating user scores:", error);
		}
	});

	const GetPlayedRounds: (games: number[]) => number = (games: number[]) => {
		return games.length;
	};

	// Definiera funktionen för att avsluta spelet och meddela spelarna
	const endGame = async (roomId: string) => {
		const users = await prisma.user.findMany({
			where: {
				roomId: roomId, // the user is in the same room
			},
		});

		let userOne = users[0];
		let userTwo = users[1];

		let totalPlayerOneScore = GetScore(userOne);
		let totalPlayerTwoScore = GetScore(userTwo);

		const winner =
			totalPlayerOneScore < totalPlayerTwoScore
				? userOne.nickname
				: totalPlayerOneScore > totalPlayerTwoScore
				? userTwo.nickname
				: "Oavgjort";

		const gameEndedData = {
			winner: winner,
			scores: {
				Player1: totalPlayerOneScore,
				Player2: totalPlayerTwoScore,
			},
			nicknames: {
				Player1: userOne.nickname,
				Player2: userTwo.nickname,
			},
			responsetime: {
				Player1: totalPlayerOneScore,
				Player2: totalPlayerTwoScore,
			},
			roundsPlayed: userOne.scores.length,
		};

		// Spara högsta poäng etc.

		io.to(roomId).emit("gameEnded", gameEndedData);
	};
	function GetScore(user: User): number {
		return user.scores.reduce((accumulator, currentValue) => {
			return accumulator + currentValue;
		}, 0);
	}

	function emitVirusPosition(roomId: string) {
		const x = Math.floor(Math.random() * 10) + 1;
		const y = Math.floor(Math.random() * 10) + 1;

		console.log(
			`Emitting virus position to room ${roomId}: x=${x}, y=${y}`
		);
		io.to(roomId).emit("positionVirus", { x, y }, roomId);
	}

	function randomDelay(): number {
		return Math.random() * (1500 - 500) + 500;
	}
};
function calculateUserScores(userOne: User, userTwo: User) {
	let totalPlayerOne = 0;
	let totalPlayerTwo = 0;

	console.log("Calculate score player One: " + userOne.scores);
	console.log("Calculate score player Two: " + userTwo.scores);

	for (let i = 0; i < userOne.scores.length; i++) {
		let scoreOne = userOne.scores[i];
		let scoreTwo = userTwo.scores[i];

		if (scoreOne > scoreTwo) {
			totalPlayerOne++;
		} else if (scoreTwo > scoreOne) {
			totalPlayerTwo++;
		} else {
			totalPlayerOne++;
			totalPlayerTwo++;
		}
	}
	return { totalPlayerOne, totalPlayerTwo };
}
