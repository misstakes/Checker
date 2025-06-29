// === TIMER ===
let timerInterval = null;
let timeLeft = 30;
const timeDisplay = document.getElementById("timeLeft");

// === SOCKET ===
const socket = io(window.location.origin); // ✅ Works both locally and on Render

// === DOM ===
const boardDiv = document.getElementById('board');
const status = document.getElementById('status');

let board = [];
let myColor = null;
let myTurn = false;
let room = null;
let selected = null;
let gameEnded = false;

const urlParams = new URLSearchParams(window.location.search);
const isPrivateRoom = urlParams.has('room');
room = isPrivateRoom ? urlParams.get('room') : null;

socket.emit("joinGame", { room, isPrivateRoom });

// === BOARD ===
function createBoard() {
  boardDiv.innerHTML = '';
  board = [];

  for (let row = 0; row < 8; row++) {
    board[row] = [];
    for (let col = 0; col < 8; col++) {
      const square = document.createElement('div');
      square.classList.add('square', (row + col) % 2 === 0 ? 'light' : 'dark');
      square.dataset.row = row;
      square.dataset.col = col;
      boardDiv.appendChild(square);
      board[row][col] = null;

      square.addEventListener('click', () => handleClick(row, col));
    }
  }

  setupPieces();
}

function setupPieces() {
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 !== 0) placePiece(row, col, 'black');
    }
  }
  for (let row = 5; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 !== 0) placePiece(row, col, 'white');
    }
  }
}

function placePiece(row, col, color, isKing = false) {
  const square = getSquare(row, col);
  const piece = document.createElement('div');
  piece.classList.add('piece', color);
  if (isKing) piece.classList.add('king');
  square.appendChild(piece);
  board[row][col] = { color, isKing };
}

function getSquare(row, col) {
  return boardDiv.children[row * 8 + col];
}

function handleClick(row, col) {
  if (!myTurn || gameEnded) return;

  if (selected) {
    const [fromRow, fromCol] = selected;
    if (isValidMove(fromRow, fromCol, row, col)) {
      movePiece(fromRow, fromCol, row, col, true);
      selected = null;
    } else {
      selected = null;
      renderBoard();
    }
  } else {
    const piece = board[row][col];
    if (piece && piece.color === myColor) {
      selected = [row, col];
      getSquare(row, col).firstChild.classList.add('selected');
    }
  }
}

function isValidMove(fromRow, fromCol, toRow, toCol) {
  const piece = board[fromRow][fromCol];
  if (!piece || board[toRow][toCol] !== null) return false;

  const dx = toCol - fromCol;
  const dy = toRow - fromRow;
  const direction = piece.color === 'white' ? -1 : 1;

  if (Math.abs(dx) === 1 && (dy === direction || (piece.isKing && Math.abs(dy) === 1))) return true;

  if (Math.abs(dx) === 2 && (dy === 2 * direction || (piece.isKing && Math.abs(dy) === 2))) {
    const midRow = (fromRow + toRow) / 2;
    const midCol = (fromCol + toCol) / 2;
    const middle = board[midRow][midCol];
    if (middle && middle.color !== piece.color) return true;
  }

  return false;
}

function movePiece(fromRow, fromCol, toRow, toCol, emit) {
  const piece = board[fromRow][fromCol];
  board[fromRow][fromCol] = null;

  if (Math.abs(toRow - fromRow) === 2) {
    const midRow = (fromRow + toRow) / 2;
    const midCol = (fromCol + toCol) / 2;
    board[midRow][midCol] = null;
  }

  const lastRow = piece.color === 'white' ? 0 : 7;
  const isNowKing = piece.isKing || toRow === lastRow;
  board[toRow][toCol] = { color: piece.color, isKing: isNowKing };

  renderBoard();
  myTurn = false;
  stopTimer();

  if (emit) {
    socket.emit('move', {
      from: [fromRow, fromCol],
      to: [toRow, toCol],
      isKing: isNowKing,
      room
    });
  }

  checkWin();
}

function renderBoard() {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = getSquare(row, col);
      square.innerHTML = '';
      const piece = board[row][col];
      if (piece) {
        const pieceDiv = document.createElement('div');
        pieceDiv.classList.add('piece', piece.color);
        if (piece.isKing) pieceDiv.classList.add('king');
        square.appendChild(pieceDiv);
      }
    }
  }
}

function checkWin() {
  let whiteExists = false;
  let blackExists = false;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        if (piece.color === 'white') whiteExists = true;
        if (piece.color === 'black') blackExists = true;
      }
    }
  }

  if (!whiteExists || !blackExists) {
    const winner = whiteExists ? 'white' : 'black';
    socket.emit('gameOver', { room, winner });
    handleGameOver(winner);
  }
}

// === TIMER ===
function startTimer() {
  clearInterval(timerInterval);
  timeLeft = 30;
  timeDisplay.textContent = timeLeft;

  timerInterval = setInterval(() => {
    timeLeft--;
    timeDisplay.textContent = timeLeft;
    if (timeLeft <= 0) {
      stopTimer();
      socket.emit('timeout', { room, loser: myColor });
      handleGameOver(myColor === 'white' ? 'black' : 'white');
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function handleGameOver(winnerColor) {
  gameEnded = true;
  stopTimer();
  const didWin = winnerColor === myColor;
  status.innerText = didWin ? "🎉 You win!" : "❌ You lose!";
  setTimeout(() => location.href = '/lobby.html?result=' + (didWin ? "win" : "lose"), 3000);
}

// === SOCKET EVENTS ===
socket.on('waitingForPlayer', () => {
  status.innerText = 'Waiting for another player...';
});

socket.on('startGame', (data) => {
  myColor = data.color;
  room = data.room;
  myTurn = myColor === 'white';
  createBoard();
  status.innerText = `You are ${myColor}. ${myTurn ? "Your turn!" : "Opponent's turn"}`;
  if (myColor === 'black') boardDiv.classList.add("rotated");
  if (myTurn) startTimer();
});

socket.on('move', (data) => {
  stopTimer();
  movePiece(data.from[0], data.from[1], data.to[0], data.to[1], false);
  board[data.to[0]][data.to[1]].isKing = data.isKing;
  renderBoard();
  myTurn = true;
  status.innerText = "Your turn!";
  startTimer();
});

socket.on('gameOver', ({ winner }) => {
  handleGameOver(winner);
});

// === FORFEIT ===
document.getElementById("forfeitBtn").addEventListener("click", () => {
  if (gameEnded) return;
  const confirmForfeit = confirm("Are you sure you want to forfeit?");
  if (confirmForfeit) {
    socket.emit('forfeit', { room, loser: myColor });
    handleGameOver(myColor === 'white' ? 'black' : 'white');
  }
});
