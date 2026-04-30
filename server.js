const { Server } = require("socket.io");
const io = new Server(process.env.PORT || 3000, { cors: { origin: "*" } });

let players = {};
const TILE_SIZE = 60; // Стены стали тоньше визуально

// Увеличенная карта с более сложным лабиринтом
const map = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1],
    [1,0,1,0,1,0,1,1,1,1,1,1,0,1,0,1,1,1,0,1],
    [1,0,1,0,0,0,1,0,0,0,0,1,0,0,0,1,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,1,0,1,1,1,0,1,0,1,1,1],
    [1,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,0,1,0,1],
    [1,1,1,0,1,1,1,0,1,1,1,1,0,1,1,1,0,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,1],
    [1,0,1,1,1,0,1,1,1,0,1,1,1,1,0,1,1,1,0,1],
    [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

io.on("connection", (socket) => {
  socket.on("joinGame", (nickname) => {
      players[socket.id] = { x: 90, y: 90, nickname: nickname || "Player" };
      io.emit("updatePlayers", players);
  });

  socket.on("move", (move) => {
    if (players[socket.id]) {
      let p = players[socket.id];
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
    io.emit("bullet", { x: players[socket.id].x, y: players[socket.id].y, angle: data.angle });
  });

  socket.on("disconnect", () => { delete players[socket.id]; io.emit("updatePlayers", players); });
});
