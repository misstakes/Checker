const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const PORT = 3000;

const games = {};
let waitingRandomPlayer = null;

app.use(express.static(path.join(__dirname, '../client')));

io.on('connection', (socket) => {
  socket.on('joinGame', ({ room, isPrivateRoom }) => {
    if (isPrivateRoom && room) {
      socket.join(room);
      if (!games[room]) {
        games[room] = { players: {}, turn: 'white' };
        games[room].players[socket.id] = 'white';
        socket.emit('waitingForPlayer');
      } else {
        games[room].players[socket.id] = 'black';
        startGame(room);
      }
    } else {
      if (waitingRandomPlayer) {
        const newRoom = `room-${waitingRandomPlayer.id}-${socket.id}`;
        socket.join(newRoom);
        waitingRandomPlayer.join(newRoom);
        games[newRoom] = {
          players: {
            [waitingRandomPlayer.id]: 'white',
            [socket.id]: 'black'
          },
          turn: 'white'
        };
        startGame(newRoom);
        waitingRandomPlayer = null;
      } else {
        waitingRandomPlayer = socket;
        socket.emit('waitingForPlayer');
      }
    }
  });

  function startGame(room) {
    const players = games[room].players;
    for (const [id, color] of Object.entries(players)) {
      io.to(id).emit('startGame', { room, color });
    }
  }

  socket.on('move', (data) => {
    socket.to(data.room).emit('move', data);
  });

  socket.on('gameOver', ({ room, winner }) => {
    if (games[room]) {
      for (const id of Object.keys(games[room].players)) {
        io.to(id).emit('gameOver', { winner });
      }
      delete games[room];
    }
  });

  socket.on('timeout', ({ room, loser }) => {
    const winner = loser === 'white' ? 'black' : 'white';
    io.to(room).emit('gameOver', { winner });
    delete games[room];
  });

  socket.on('forfeit', ({ room, loser }) => {
    const winner = loser === 'white' ? 'black' : 'white';
    io.to(room).emit('gameOver', { winner });
    delete games[room];
  });

  socket.on('disconnect', () => {
    if (waitingRandomPlayer?.id === socket.id) {
      waitingRandomPlayer = null;
      return;
    }
    for (const [room, game] of Object.entries(games)) {
      if (socket.id in game.players) {
        const loserColor = game.players[socket.id];
        const winnerColor = loserColor === 'white' ? 'black' : 'white';
        io.to(room).emit('gameOver', { winner: winnerColor });
        delete games[room];
        break;
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
