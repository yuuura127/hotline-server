const { Server } = require("socket.io");

// Создаем сервер на порту, который выдаст Render
const io = new Server(process.env.PORT || 3000, {
  cors: { origin: "*" }
});

let players = {};
const TILE_SIZE = 100; // Размер одного блока стены

// КАРТА ЛАБИРИНТА (Серверная версия)
// 1 - стена, 0 - проход
const map = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,0,1,0,1,0,1,1,1,0,1,1,1,0,1],
    [1,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,1],
    [1,0,1,1,1,1,0,1,0,1,1,1,1,0,1,1,0,1,1,1],
    [1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,1],
    [1,0,1,1,1,1,0,1,1,1,1,1,1,0,1,1,0,1,1,1],
    [1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];
const MAP_WIDTH = map[0].length * TILE_SIZE;
const MAP_HEIGHT = map.length * TILE_SIZE;

io.on("connection", (socket) => {
  console.log("Новое подключение:", socket.id);

  // Ждем, пока клиент пришлет никнейм
  socket.on("joinGame", (nickname) => {
      // Спавним игрока в безопасном месте (150, 150)
      players[socket.id] = { 
          x: 150, 
          y: 150, 
          nickname: nickname || "Player", // Если ник не введен, будет Player
          score: 0 
      };
      io.emit("updatePlayers", players);
      console.log(`${nickname} зашел в игру.`);
  });

  // Обработка движения (с проверкой стен!)
  socket.on("move", (move) => {
    if (players[socket.id]) {
      let p = players[socket.id];
      let nextX = p.x + move.x;
      let nextY = p.y + move.y;
      
      const PLAYER_RADIUS = 15; // Половина размера квадрата

      // Функция проверки столкновения
      function isColliding(x, y) {
          // Проверка границ карты
          if (x - PLAYER_RADIUS < 0 || x + PLAYER_RADIUS > MAP_WIDTH || 
              y - PLAYER_RADIUS < 0 || y + PLAYER_RADIUS > MAP_HEIGHT) {
              return true; 
          }

          // Проверка 4 точек вокруг игрока (чтобы углы не проходили)
          const points = [
              {x: x - PLAYER_RADIUS, y: y - PLAYER_RADIUS},
              {x: x + PLAYER_RADIUS, y: y - PLAYER_RADIUS},
              {x: x - PLAYER_RADIUS, y: y + PLAYER_RADIUS},
              {x: x + PLAYER_RADIUS, y: y + PLAYER_RADIUS}
          ];

          for (let pt of points) {
              let mapX = Math.floor(pt.x / TILE_SIZE);
              let mapY = Math.floor(pt.y / TILE_SIZE);
              if (map[mapY] && map[mapY][mapX] === 1) {
                  return true; // Столкновение со стеной
              }
          }
          return false;
      }

      // Пробуем сдвинуться по X
      if (!isColliding(nextX, p.y)) {
          p.x = nextX;
      }
      // Пробуем сдвинуться по Y
      if (!isColliding(p.x, nextY)) {
          p.y = nextY;
      }
      
      io.emit("updatePlayers", players);
    }
  });

  // Обработка выстрела
  socket.on("shoot", (data) => {
    if (players[socket.id]) {
        io.emit("bullet", { 
            x: players[socket.id].x, 
            y: players[socket.id].y, 
            angle: data.angle,
            owner: socket.id 
        });
    }
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("updatePlayers", players);
  });
});

console.log("Сервер запущен.");
