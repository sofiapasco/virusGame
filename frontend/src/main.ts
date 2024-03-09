import { io, Socket } from "socket.io-client";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  GameTimeMessage,
  UserJoinResponse,
  VirusPosition,
  ScoreData,
} from "@shared/types/SocketTypes";
import "./assets/scss/style.scss";

const SOCKET_HOST = import.meta.env.VITE_SOCKET_HOST;

document.addEventListener("DOMContentLoaded", () => {
  const nicknameForm: HTMLFormElement = document.getElementById("nickname-form") as HTMLFormElement;
  const nicknameInput: HTMLInputElement = document.getElementById("nickname-input") as HTMLInputElement;
  const connectBtn: HTMLButtonElement = document.getElementById("connectBtn") as HTMLButtonElement;

  nicknameInput.addEventListener("input", () => {
    connectBtn.disabled = nicknameInput.value.trim() === "";
  });

  nicknameForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const nickname: string = nicknameInput.value.trim();

    if (nickname) {
      socket.emit("JoinTheGame", nickname, (response: UserJoinResponse) => {
        if (response.success) {
          updateLobby(response.nicknames);
          console.log("Join was successful", response.nicknames);

          if (response.player1name && response.player2name) {
            displayPlayerNames(response.player1name, response.player2name);
          } else {
            alert("You cannot play now, try again later.");
          }
        } else {
          alert("You cannot play now, try again later.");
        }
      });
    }
  });
});
function displayPlayerNames(player1name: string, player2name: string) {
  const player1NameElement = document.getElementById('player1-name');
  const player2NameElement = document.getElementById('player2-name');
  
  if (player1NameElement) player1NameElement.textContent = player1name;
  if (player2NameElement) player2NameElement.textContent = player2name;
}
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
let nickName: string;

// Listen for when connection is established
socket.on("connect", () => {
  console.log("💥 Connected to the server", SOCKET_HOST);
  console.log("🔗 Socket ID:", socket.id);

  showStartRoom(); // visa startrummet
});

// Show start room - där inputfältet är
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

  // Visa meddelandet "Waiting for another player..."
  const messageElement = document.getElementById(
    "message"
  ) as HTMLParagraphElement;
  if (messageElement) {
    messageElement.textContent =
      "Waiting for another player to join the game...";
  } else {
    console.error("Elementet för meddelandet kunde inte hittas.");
  }

  //Connect two players
  const handleConnectionForGame = (response: GameTimeMessage) => {
    console.log("GameTime: Join was successful?", response);

    if (response.opponent) {
      console.log("Opponent found:", response.opponent);

      showPlayingRoom();
    } else {
      console.log("Waiting for someone to play");
    }
  };


  // Uppdatera UI för lobbyn med namnen på spelarna
  const updateLobby = (players: string[]) => {
    const lobbyList = document.getElementById("player-list");
    const player1NameElement = document.getElementById('player1-name') as HTMLDivElement;
    const player2NameElement = document.getElementById('player2-name') as HTMLDivElement;


    if (lobbyList) {
      lobbyList.innerHTML = ""; // Rensa lobbyn för att undvika dubbletter

      players.forEach((player,index) => {
        const playerElement = document.createElement("li");
        playerElement.textContent = player;
        lobbyList.appendChild(playerElement);

        if (index === 0) {
          player1NameElement.textContent = player; // Sätter namnet för spelare 1
        } else if (index === 1) {
          player2NameElement.textContent = player; // Sätter namnet för spelare 2
        }
      });

      // Kontrollera om det finns tillräckligt med spelare för att starta spelet
      if (players.length >= 2) {
        // Om det finns två spelare i lobbyn, starta spelet
        showPlayingRoom();
      }
    } else {
      console.error("Elementet för lobbylistan kunde inte hittas.");
    }
  };
    // Lyssna på uppdateringar från servern om lobbyn
    socket.on("UpdateLobby", (nickNames:string[]) => {
      console.log("Lobby updated with players:",nickNames);
      updateLobby(nickNames);
    });

  // Listen to GameTime when to players want to play
  socket.on("GameTime", (message: GameTimeMessage) => {
    handleConnectionForGame(message);
  });

  // Skapa ett nytt listelement för att visa spelarens nickname
  const playerListItem = document.createElement("li");
  playerListItem.textContent = nickname;

  // Lägg till det nya listelementet i listan med spelare
  const playersList = document.getElementById("players");

  if (playersList) {
    console.log(1);
    playersList.appendChild(playerListItem);
  } else {
    console.log(2);
    console.error("Elementet för spelarlistan kunde inte hittas.");
  }
};
socket.on("PlayerJoined", (data) => {
  // Uppdatera UI här, exempelvis:
  const player1NameElement = document.getElementById('player1-name');
  const player2NameElement = document.getElementById('player2-name');
  
  if (player1NameElement) player1NameElement.textContent = data.player1name;
  if (player2NameElement) player2NameElement.textContent = data.player2name;
});


//show playingroom
const showPlayingRoom = () => {
  // "nickname"-skärmen och "lobby" ska vara dolda
  const nicknameScreen = document.getElementById("nickname");
  if (nicknameScreen) {
    nicknameScreen.classList.add("hide");
  }
  waitingScreen.classList.add("hide");

  // Visa "game wrapper" genom att ta bort "hide"-klassen
  playingRoom.classList.remove("hide");

  if (yourTimeElement && opponentTimeElement) {
    // Starta din timer
    startTimer(yourTimeElement);
    // Starta motståndarens timer
    startTimer(opponentTimeElement);
  }

  // Lyssna på 'updateFrontendScore' eventet från servern
  socket.on("updateFrontendScore", (data) => {
    // Data är det objekt som innehåller poängen, till exempel:
    // { playerOneScore: 5, playerTwoScore: 3 }

    // Uppdatera poängen på webbsidan för spelare 1
    const playerOneScoreElement = document.getElementById("player1-score");
    if (playerOneScoreElement) {
      playerOneScoreElement.textContent = data.playerOneScore.toString();
    }

    // Uppdatera poängen på webbsidan för spelare 2
    const playerTwoScoreElement = document.getElementById("player2-score");
    if (playerTwoScoreElement) {
      playerTwoScoreElement.textContent = data.playerTwoScore.toString();
    }
  });
};

const yourTimeElement: HTMLElement | null =
  document.getElementById("player1-time");
const opponentTimeElement: HTMLElement | null =
  document.getElementById("player2-time");
const intervalMap: Map<HTMLElement, boolean> = new Map();

// Funktion för att starta en timer
function startTimer(timerElement: HTMLElement): void {
  timerElement.textContent = "00"; // Nollställ tiden
  let seconds: number = 0;
  intervalMap.set(timerElement, true);

  // Uppdatera elementet varje sekund
  const interval = window.setInterval(() => {
    seconds++;
    if (seconds >= 30) {
      clearInterval(interval);
      stopGame();
    }

    const keepRunning = intervalMap.get(timerElement);

    if (!keepRunning) {
      clearInterval(interval);
    } else {
      const secondsFormatted: string = seconds.toString().padStart(2, "0");
      timerElement.textContent = `${secondsFormatted}`;
    }
  }, 2000);
}

// Sätt upp din anslutningslogik
socket.on("connect", () => {
  console.log("Connected to the server", SOCKET_HOST);
  showStartRoom();
});

function stopGame() {}

function stopTimer(timerElement: HTMLElement): void {
  // Retrieve the interval ID from the global map
  const intervalId = intervalMap.get(timerElement);
  if (intervalId !== undefined && timerElement !== undefined) {
    console.log("We stop timer: " + timerElement);
    intervalMap.set(timerElement, false);
  }
}

socket.on("otherRegisterClick", (time) => {
  console.log("Andra spelarens klick:" + time);
  console.log("My socket id : " + socket.id);
  if (opponentTimeElement) {
    stopTimer(opponentTimeElement);
    opponentTimeElement.innerText = time.toString().padStart(2, "0");
  } else {
    console.error("The opponent's timer element was not found.");
  }
});

// Lyssna på uppdateringar från servern om lobbyn
socket.on("UpdateLobby", (players: string[]) => {
  console.log("Lobby updated with players:", players);
  updateLobby(players);
});

// Uppdatera UI för lobbyn med namnen på spelarna
const updateLobby = (players: string[]) => {
  // Kontrollera om det finns tillräckligt med spelare för att starta spelet
  if (players.length == 2) {
    // Om det finns två spelare i lobbyn, starta spelet
    showPlayingRoom();
  }
};

socket.on("OtherPlayerJoined", (response) => {
  if (!response.success) {
    console.log("Error when other player joined");
  }

  updateLobby(response.nicknames);
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
  socket.emit("JoinTheGame", nickname, (response) => {
    console.log("JoinTheGame: Join was successful", response.success);

    if (!response.success) {
      alert("You can not play now, try again later");
      return;
    }
    // Call showWaitingRoom with the nickname to display it
    showWaitingRoom(nickname!);
    updateLobby(response.nicknames);
  });
});

/**
 *  CAROLINS
 *  Visa ett virus
 */

// lyssna efter att servern emittar "positionVirus", anropa sedan showVirus()
socket.on("positionVirus", (data: VirusPosition) => {
  console.log("Slumpad virusposition:"), data.x, data.y;

  showVirus(data.x, data.y);
});

function showVirus(x: number, y: number) {
  const virusImg = document.createElement("img");
  virusImg.src = "/src/assets/Images/virus.png";
  virusImg.alt = "ugly green virus";
  virusImg.setAttribute("id", "virusImage");
  console.log("bild", virusImg);

  virusImg.style.gridColumnStart = x.toString();
  virusImg.style.gridRowStart = y.toString();

  // Appendera bilden till spelbrädet
  const gameBoard = document.getElementById("gameBoard");
  if (!gameBoard) {
    console.error("unable to find gameBoard element");
  } else {
    gameBoard.appendChild(virusImg);
  }

  const clickSound = document.getElementById('clickSound') as HTMLAudioElement | null ;

  // Gör bilden klickbar genom att lägga till en 'click'-händelselyssnare
  if (virusImg && clickSound) {
  virusImg.addEventListener("click", function () {
    console.log("Virus klickad!");
    socket.emit("virusClick", nickName);
    removeVirus();
    clickSound.play();
  });
}



// Funktion för att ta bort viruset
function removeVirus() {
  const virusImg = document.getElementById("virusImage");
  if (virusImg) {
    virusImg.remove();
  }

  //Stoppa timer
  console.log("Time now is :" + yourTimeElement?.innerText);

  if (yourTimeElement !== null) {
    stopTimer(yourTimeElement);
    const timerValue = parseInt(yourTimeElement.innerText, 10);
    socket.emit("registerClick", timerValue,);
  } else {
    console.error("The element #player1-time was not found.");
  }
}

socket.on("gameEnded", (data) => {
  console.log("Spelet slutade. Vinnare:", data.winner, "Poäng:", data.scores);

  // Uppdatera UI med vinnaren
  const winnerElement = document.getElementById("game-winner");
  if (winnerElement) {
    winnerElement.textContent = data.winner; // Visar vinnarens namn
  }

  // Antag att 'data.scores' är ett objekt med poäng för 'player1' och 'player2', till exempel: { player1: 3, player2: 2 }
  const player1ScoreElement = document.getElementById("player1-score");
  const player2ScoreElement = document.getElementById("player2-score");

  if (player1ScoreElement && player2ScoreElement) {
    player1ScoreElement.textContent = data.scores.Player1.toString(); // Uppdaterar spelare 1:s poäng
    player2ScoreElement.textContent = data.scores.Player2.toString(); // Uppdaterar spelare 2:s poäng
  }
});

//Listen to a new round
socket.on("newRound", (round) => {
  const roundCounter = document.getElementById("round");
  if (roundCounter) roundCounter.textContent = `Round: ${round}`;
  resetTimer()
});

function resetTimer() {
  // Antag att "your-timer" och "opponent-timer" är id för dina timer-element
  const yourTimerElement = document.getElementById("player1-time");
  const opponentTimerElement = document.getElementById("player2-time");

  if (yourTimerElement && opponentTimerElement) {
    startTimer(yourTimerElement);
    startTimer(opponentTimerElement);
  }

  }


socket.on("winnerOfRound", (winner) => {
  // Uppdatera UI med vinnaren av rundan
  console.log("Vinnaren av rundan är:", winner);
});

// Lyssna efter uppdateringar från servern
socket.on("updateScore", (data: ScoreData) => {
  if (data.scores) {
    const player1ScoreEl = document.getElementById("player1-score");
    const player2ScoreEl = document.getElementById("player2-score");

    if (player1ScoreEl && player2ScoreEl) {
      player1ScoreEl.textContent = data.scores.player1.toString();
      player2ScoreEl.textContent = data.scores.player2.toString();
    }

    // Uppdatera highscore-listan
    if (data.highscore) {
      const { player, score } = data.highscore;
      const highscoreListElement = document.getElementById("highscore-list");
      if (highscoreListElement) {
        highscoreListElement.innerHTML = `<h2>Highscore</h2><p>${player} - ${score}</p>`;
      }
    }
  }
});

/*

// Carolins
socket.on("winnerOfRound", (winner) => {
  //vinnaren ska skickas hit när de spelat
  // kod här för att öka rätt poängsiffra
  const player1 = ""; //ersätt "" med en user från databasen
  const player2 = ""; //ersätt "" med en user från databasen
  const player1ScoreEl = document.getElementById("player1-score");
  const player2ScoreEl = document.getElementById("player2-score");

  if (player1ScoreEl && player2ScoreEl) {
    let player1Score = parseInt(player1ScoreEl.innerText);
    let player2Score = parseInt(player2ScoreEl.innerText);

    if (winner === player1) {
      player1Score++;
      player1ScoreEl.innerText = player1Score.toString();
    } else if (winner === player2) {
      player2Score++;
      player2ScoreEl.innerText = player2Score.toString();
    } else {
      console.log("winner not found");
    }
    console.log("winner of round is: ", winner);
  }
});

*/
}