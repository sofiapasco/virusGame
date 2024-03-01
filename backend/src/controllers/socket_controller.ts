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
//let waitingPlayers: WaitingPlayer =[];

// Handle a user connecting
export const handleConnection = (
	socket: Socket<ClientToServerEvents, ServerToClientEvents>,
	io: Server<ClientToServerEvents, ServerToClientEvents>
) => {
	debug("🙋 A user connected", socket.id);

	// lyssnar till inkommande spelare
	socket.on("JoinTheGame", async (nickname) => {
		debug(`${nickname} joined the game`);

		// (Carolins) När TVÅ spelare är inne i spelrummet, emita positionVirus (just nu gör den det såfort någon joinar)
		socket.emit("positionVirus");
	});
};

//Carros klocka
