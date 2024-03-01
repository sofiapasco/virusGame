import { io, Socket } from "socket.io-client";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@shared/types/SocketTypes";
import "./assets/scss/style.scss";

const SOCKET_HOST = import.meta.env.VITE_SOCKET_HOST;

//Nickname-kod-input för att komma till Lobby

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
  const lobbyContainer: HTMLElement = document.getElementById(
    "lobby"
  ) as HTMLElement;

  // Aktivera knappen när ett giltigt nickname anges
  nicknameInput.addEventListener("input", () => {
    connectBtn.disabled = nicknameInput.value.trim() === "";
  });

  // Lyssna på klickhändelse för connectBtn
  connectBtn.addEventListener("click", (e) => {
    e.preventDefault();

    lobbyContainer.classList.remove("hide");

    const nickname: string = nicknameInput.value.trim();

    if (nickname) {
      // Visa det angivna nicknamnet i lobbyn
      const playerList = document.getElementById("players") as HTMLUListElement;

      const li = document.createElement("li");
      li.textContent = nickname;

      playerList.appendChild(li);
      nicknameInput.value = "";
    }
  });

  // Lyssna på formulärhändelse och hantera inlämning
  nicknameForm.addEventListener("submit", (e) => {
    e.preventDefault(); // Förhindra standardbeteendet för formuläret

    const nickname: string = nicknameInput.value.trim(); // Hämta värdet från input-fältet

    if (nickname) {
      // Visa det angivna nicknamnet i lobbyn
      const playerList = document.getElementById("players") as HTMLUListElement;

      const li = document.createElement("li");
      li.textContent = nickname;

      playerList.appendChild(li);

      // Rensa input-fältet
      nicknameInput.value = "";
    }
  });
});

const moveOnwaitRoomButtonEl = document.querySelector(
  "#connectBtn"
) as HTMLButtonElement;
const nickNameInput = document.querySelector(
  "#nickname-input"
) as HTMLInputElement;

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
  const nicknameScreen = document.getElementById("nickname");
  if (nicknameScreen) {
    nicknameScreen.classList.remove("hide");
  } else {
    console.error("Nickname skärmen kunde inte hittas i DOM");
  }
  waitingScreen.classList.add("hide");
  playingRoom.classList.add("hide");
};

// kod till lobby

// show waitingroom
const showWaitingRoom = (nickname: string) => {
  const nicknameScreen = document.getElementById("nickname");
  if (nicknameScreen) {
    nicknameScreen.classList.add("hide");
  }

  // Visa "lobby" genom att ta bort "hide"-klassen
  waitingScreen.classList.remove("hide");

  // Spelrummet ska fortfarande vara dolt
  playingRoom.classList.add("hide");

  // Hämta spelarlistan från DOM
  const playersList = document.getElementById("players");
  if (playersList) {
    // Skapa ett nytt listelement för att visa spelarens nickname
    const playerListItem = document.createElement("li");
    playerListItem.textContent = nickname;

    // Lägg till det nya listelementet i listan med spelare
    playersList.appendChild(playerListItem);
  } else {
    console.error("Elementet för spelarlistan kunde inte hittas.");
  }
};
//show playingroom
const showPlayingRoom = () => {
  //"nickname"-skärmen och "lobby" ska vara dolda
  const nicknameScreen = document.getElementById("nickname");
  if (nicknameScreen) {
    nicknameScreen.classList.add("hide");
  }
  waitingScreen.classList.add("hide");

  //Visa "game wrapper" genom att ta bort "hide"-klassen
  playingRoom.classList.remove("hide");
};
// Sätt upp din anslutningslogik
socket.on("connect", () => {
  console.log("Connected to the server", SOCKET_HOST);
  showStartRoom();
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
});

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function showVirus() {
  const x = getRandomInt(1, 10);
  const y = getRandomInt(1, 10);
  const virusImg = document.createElement("img");
  virusImg.src = "frontend/src/assets/Images/green-virus.png";
  virusImg.alt = "ugly green virus";
  virusImg.style.gridColumn = x.toString();
  virusImg.style.gridRow = y.toString();
  // append image to the grid
  const gameBoard: HTMLElement | null = document.getElementById("gameBoard");
  if (!gameBoard) {
    console.error("unable to find gameBoard element");
  } else {
    gameBoard.appendChild(virusImg);
  }
}

//Carros klocka
/*
// Funktion för att starta en timer
function startTimer(timerElement: HTMLElement): number {
  let seconds: number = 0;
  let minutes: number = 0;
  let hours: number = 0;

  // Uppdatera elementet varje sekund
  return window.setInterval(() => {
    seconds++;
    if (seconds >= 60) {
      seconds = 0;
      minutes++;
      if (minutes >= 60) {
        minutes = 0;
        hours++;
      }
    }

    // Format tidsträngen med ledande nollor
    const hoursFormatted: string = hours < 10 ? "0" + hours : hours.toString();
    const minutesFormatted: string =
      minutes < 10 ? "0" + minutes : minutes.toString();
    const secondsFormatted: string =
      seconds < 10 ? "0" + seconds : seconds.toString();

    // Uppdatera tiden i DOM
    timerElement.textContent = `${hoursFormatted}:${minutesFormatted}:${secondsFormatted}`;
  }, 1000);
}

// Starta klockorna när sidan laddas
window.addEventListener("DOMContentLoaded", () => {
  const yourTimeElement: HTMLElement | null =
    document.getElementById("your-time");
  const opponentTimeElement: HTMLElement | null =
    document.getElementById("opponent-time");

  if (yourTimeElement && opponentTimeElement) {
    // Starta din timer
    startTimer(yourTimeElement);
    // Starta motståndarens timer
    startTimer(opponentTimeElement);
  }
});

*/

socket.on("winnerOfRound", (winner) => {
  //vinnaren skickas hit - kod här för att öka rätt poängsiffra
  console.log("Vinnaren av rundan är: ", winner)
})
