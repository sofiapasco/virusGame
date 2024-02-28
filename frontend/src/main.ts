import { io, Socket } from "socket.io-client";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@shared/types/SocketTypes";
import "./assets/scss/style.scss";

const SOCKET_HOST = import.meta.env.VITE_SOCKET_HOST;

document.addEventListener("DOMContentLoaded", () => {
  const nicknameForm: HTMLFormElement = document.getElementById(
    "nickname-form"
  ) as HTMLFormElement;
  const nicknameInput: HTMLInputElement = document.getElementById(
    "nickname-input"
  ) as HTMLInputElement;
  const connectBtn: HTMLButtonElement = document.getElementById(
    "connectBtn"
  ) as HTMLButtonElement;

  // Funktion för att aktivera knappen när inputfältet inte är tomt
  nicknameInput.addEventListener("input", () => {
    connectBtn.disabled = nicknameInput.value.trim() === "";
  });

  nicknameForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const nickname: string = nicknameInput.value.trim();

    if (nickname) {
      // Använd Socket.IO för att skicka användarnamnet till servern
      socket.emit("JoinTheGame", nickname, (success: boolean) => {
        if (success) {
          console.log("Join was successful", success);
          // Hantera logik för att gå vidare från formuläret här...
          // Till exempel, visa ett annat UI-element eller rum
        } else {
          alert("You cannot play now, try again later.");
        }
      });
    }
  });
});

const moveOnwaitRoomButtonEl = document.querySelector(
  "#connectBtn"
) as HTMLButtonElement;
const nickNameInput = document.querySelector(
  "#nickname-input"
) as HTMLInputElement;
const startScreenEl = document.querySelector("#app") as HTMLDListElement;
const waitingScreen = document.querySelector("#lobby") as HTMLDivElement;
const playingRoom = document.querySelector("#game-wrapper") as HTMLDivElement;

// Connect to Socket.IO Server
console.log("Connecting to Socket.IO Server at:", SOCKET_HOST);
const socket: Socket<ServerToClientEvents, ClientToServerEvents> =
  io(SOCKET_HOST);

let nickname: string | null = null;

// Listen for when connection is established
socket.on("connect", () => {
  console.log("💥 Connected to the server", SOCKET_HOST);
  console.log("🔗 Socket ID:", socket.id);

  showStartRoom(); // visa startrummet
});

// Show start room
const showStartRoom = () => {
  startScreenEl.classList.remove("hide"); // man kommer att se startsidan
  waitingScreen.classList.add("hide"); // väntrummet kommer attt döljas
  playingRoom.classList.add("hide");
};

// show waitingroom
const showWaitingRoom = (nickname: string) => {
  startScreenEl.classList.add("hide");
  waitingScreen.classList.remove("hide"); // Väntrummet kommer att synas
  playingRoom.classList.add("hide");

  // Skapa ett nytt listelement för att visa spelarens nickname
  const playerListItem = document.createElement("li");
  playerListItem.textContent = nickname;

  // Lägg till det nya listelementet i listan med spelare
  const playersList = document.getElementById("players");
  if (playersList) {
    playersList.appendChild(playerListItem);
  } else {
    console.error("Elementet för spelarlistan kunde inte hittas.");
  }
};

//show playingroom
const showPlayingRoom = () => {
  startScreenEl.classList.add("hide"); // startrummet döljs
  waitingScreen.classList.add("hide"); // väntrummet kommer attt döljas
  playingRoom.classList.remove("hide");
};

// Listen for when server got tired of us
socket.on("disconnect", () => {
  console.log("💀 Disconnected from the server:", SOCKET_HOST);
});

// Listen for when we're reconnected (either due to our or the servers connection)
socket.io.on("reconnect", () => {
  console.log("🍽️ Reconnected to the server:", SOCKET_HOST);
  console.log("🔗 Socket ID:", socket.id);
});
/**
 * När spelaren har skrvit in sitt 'nickname'
 * och klickar in sig för möta en motståndare
 */
moveOnwaitRoomButtonEl.addEventListener("click", (e) => {
  e.preventDefault();

  const trimmedNickname = nickNameInput.value.trim();

  // If no nickname, no play
  if (!trimmedNickname) {
    return;
  }

  nickname = trimmedNickname;

  //Ansluter till serven
  socket.emit("JoinTheGame", nickname, (success) => {
    console.log("Join was successful", success);

    if (!success) {
      alert("You can not play now, try again later");
      return;
    }
    // Call showWaitingRoom with the nickname to display it
    showWaitingRoom(nickname!);
  });
});


/**
 *  CAROLINS
 *  Visa ett virus
 */

// lyssna efter att servern emittar "positionVirus", anropa sedan showVirus()
socket.on("positionVirus", () => {
	showVirus();
})

function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function showVirus() {
	const x = getRandomInt(1, 10);
	const y = getRandomInt(1, 10);
	const virusImg = document.createElement("img");
	virusImg.src = "frontend/src/assets/Images/green-virus.png";
	virusImg.alt = "ugly green virus"
	virusImg.style.gridColumn = x.toString();
	virusImg.style.gridColumn = y.toString();
	// append image to the grid
	const gameBoard: HTMLElement | null = document.getElementById("gameBoard");
	if (!gameBoard) {
		console.error("unable to find gameBoard element")
	} else {
		gameBoard.appendChild(virusImg);
	}
} 




