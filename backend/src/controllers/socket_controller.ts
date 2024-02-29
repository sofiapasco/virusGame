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

// Skapa en array för att spåra väntande spelare
let waitingPlayers: WaitingPlayer []=[];

// Handle a user connecting
export const handleConnection = (
	socket: Socket<ClientToServerEvents, ServerToClientEvents>,
	io: Server<ClientToServerEvents, ServerToClientEvents>,
) => {
	debug("🙋 A user connected", socket.id);

	// lyssnar till inkommande spelare
	socket.on("JoinTheGame", async (nickname, callback) => {
		debug(`${nickname} is trying to join the game`);

		try {
			const user = await prisma.user.create({
				data: {
					nickname: nickname,
					scores: [],
				},
			});

			debug(`User created with ID: ${user.id}`);

			//Add the player in the waitingarray
			waitingPlayers.push({socketId:socket.id, nickname})

			//Check if there is one or two players
			if(waitingPlayers.length >= 2){
				const [player1, player2] = waitingPlayers.splice(0,2);

				//Send the players to the playroom
				//io.to(player1.socketId).emit("GameTime", { opponent: player2.nickname });
				//io.to(player2.socketId).emit("GameTime", { opponent: player1.nickname });
			}

			callback(true);

		} catch (error) {
			debug("Error creating user:", error);
			callback(true);
		}
	});
};
