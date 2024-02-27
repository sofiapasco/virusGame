import { io, Socket } from "socket.io-client";
import {
	ClientToServerEvents,
	ServerToClientEvents,
} from "@shared/types/SocketTypes";
import "./assets/scss/style.scss";

const SOCKET_HOST = import.meta.env.VITE_SOCKET_HOST;


const waitRoomButtonEl = document.querySelector("#waitRoom") as HTMLButtonElement
const nickNameInput = document.querySelector('nickname') as HTMLInputElement
const startScreenEl =document.querySelector('#startScreen') as HTMLDListElement
const waitingScreen =document.querySelector('#waitingScreen') as HTMLDivElement

// Connect to Socket.IO Server
console.log("Connecting to Socket.IO Server at:", SOCKET_HOST);
const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_HOST);

// Listen for when connection is established
socket.on("connect", () => {
	console.log("💥 Connected to the server", SOCKET_HOST);
	console.log("🔗 Socket ID:", socket.id);
});

// Listen for when server got tired of us
socket.on("disconnect", () => {
	console.log("💀 Disconnected from the server:", SOCKET_HOST);
});

// Listen for when we're reconnected (either due to our or the servers connection)
socket.io.on("reconnect", () => {
	console.log("🍽️ Reconnected to the server:", SOCKET_HOST);
	console.log("🔗 Socket ID:", socket.id);
});

//Funktion för att ta sig till väntläget
const showWaitningScreen = () => {

	startScreenEl.style.display = "none"; //början av spelet som döljs
	waitingScreen.style.display = "block"; // väntrummet visas
}

/**
 * När spelaren har skrvit in sitt 'nickname'
 * och klickar in sig för möta en motståndare
 */
waitRoomButtonEl.addEventListener('click',() =>{
	//Ansluter till serven 
	socket.emit('JoinTheGame',nickNameInput.value)

	showWaitningScreen();
});
