const { Server } = require("socket.io");
const io = new Server(process.env.PORT || 3000, { cors: { origin: "*" } });

let players = {};
const TILE_SIZE = 60;

// Огромная карта на весь экран
const map = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
    [1,0,1,1,1,1,0,1,0,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1,0,1,0,1,1,0,1],
    [1,0,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,0,1],
    [1,1,1,1,0,1,1,1,0,1,0,1,1,0,1,1,1,1,1,0,1,1,1,0,1,1,1,0,1,0,1,1],
    [1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,0,1,1,1,1,1,1,1,1,0,1],
    [1,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,1,0,0,0,1,0,0,0,0,0,0,1,0,1],
    [1,0,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,0,1,1,1,1,0,1,0,1],
    [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

io.on("connection", (socket) => {
  socket.on("joinGame", (nickname) => {
      players[socket.id] = { x: 100, y: 100, nickname: nickname || "Player", score: 0, dead: false };
      io.emit("updatePlayers", players);
  });

  socket.on("move", (move) => {
    let p = players[socket.id];
    if (p && !p.dead) {
      let nextX = p.x + move.x;
      let nextY = p.y + move.y;
      const checkWall = (nx, ny) => {
          let mx = Math.floor(nx / TILE_SIZE);
          let my = Math.floor(ny / TILE_SIZE);
          return map[my] && map[my][mx] === 1;
      };
      if (!checkWall(nextX, p.y)) p.x = nextX;
      if (!checkWall(p.x, nextY)) p.y = nextY;
      io.emit("updatePlayers", players);
    }
  });

  socket.on("shoot", (data) => {
    if (players[socket.id] && !players[socket.id].dead) {
        io.emit("bullet", { x: players[socket.id].x, y: players[socket.id].y, angle: data.angle, owner: socket.id });
    }
  });

  // Логика смерти
  socket.on("playerHit", (victimId) => {
      if (players[victimId] && !players[victimId].dead) {
          players[victimId].dead = true;
          io.to(victimId).emit("youDied"); 
          io.emit("updatePlayers", players);
      }
  });

  // Логика начисления очка за убийство
  socket.on("killConfirmed", (killerId) => {
      if (players[killerId]) {
          players[killerId].score += 1;
          io.emit("updatePlayers", players);
      }
  });

  socket.on("respawn", () => {
      if (players[socket.id]) {
          players[socket.id].x = 100;
          players[socket.id].y = 100;
          players[socket.id].dead = false;
          io.emit("updatePlayers", players);
      }
  });

  socket.on("disconnect", () => { delete players[socket.id]; io.emit("updatePlayers", players); });
});
