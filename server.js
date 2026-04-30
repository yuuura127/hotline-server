const { Server } = require("socket.io");

// Создаем сервер на порту, который выдаст Render
const io = new Server(process.env.PORT || 3000, {
  cors: {
    origin: "*", // Разрешаем подключения со всех сайтов (включая твой Netlify)
  }
});

let players = {};
const TILE_SIZE = 80;

// Карта лабиринта
const map = [
    [1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,0,1],
    [1,0,1,0,0,0,0,1,0,1],
    [1,0,0,0,1,1,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1]
];

io.on("connection", (socket) => {
  console.log("Игрок подключился:", socket.id);
  
  // Начальная позиция игрока
  players[socket.id] = { x: 120, y: 120 };
  io.emit("updatePlayers", players);

  // Обработка движения
  socket.on("move", (move) => {
    if (players[socket.id]) {
      let nextX = players[socket.id].x + move.x;
      let nextY = players[socket.id].y + move.y;

      let mapX = Math.floor(nextX / TILE_SIZE);
      let mapY = Math.floor(nextY / TILE_SIZE);
      
      // Проверка стен и границ
      if (nextX > 20 && nextX < 780 && nextY > 20 && nextY < 380) {
          if (map[mapY] && map[mapY][mapX] === 0) {
              players[socket.id].x = nextX;
              players[socket.id].y = nextY;
          }
      }
      io.emit("updatePlayers", players);
    }
  });

  // Обработка стрельбы
  socket.on("shoot", (data) => {
    io.emit("bullet", { 
        x: players[socket.id].x, 
        y: players[socket.id].y, 
        angle: data.angle,
        owner: socket.id 
    });
  });

  socket.on("disconnect", () => {
    console.log("Игрок отключился:", socket.id);
    delete players[socket.id];
    io.emit("updatePlayers", players);
  });
});

console.log("Сервер запущен на порту 3000 (или порту Render)");
