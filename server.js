const { Server } = require("socket.io");
const io = new Server(process.env.PORT || 3000, { cors: { origin: "*" } });

let players = {};
const TILE_SIZE = 60;
const PLAYER_SPEED = 2.5; // Замедлил персонажей

// Огромная карта на весь экран (32x18 блоков)
const map = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,0,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,0,1,1,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

io.on("connection", (socket) => {
    socket.on("joinGame", (nickname) => {
        players[socket.id] = { x: 120, y: 120, nickname: nickname || "Player", score: 0, dead: false };
        io.emit("updatePlayers", players);
    });

    socket.on("move", (move) => {
        let p = players[socket.id];
        if (p && !p.dead) {
            let nextX = p.x + (move.x > 0 ? PLAYER_SPEED : move.x < 0 ? -PLAYER_SPEED : 0);
            let nextY = p.y + (move.y > 0 ? PLAYER_SPEED : move.y < 0 ? -PLAYER_SPEED : 0);
            
            const isWall = (nx, ny) => {
                let mx = Math.floor(nx / TILE_SIZE);
                let my = Math.floor(ny / TILE_SIZE);
                return map[my] && map[my][mx] === 1;
            };

            if (!isWall(nextX, p.y)) p.x = nextX;
            if (!isWall(p.x, nextY)) p.y = nextY;
            io.emit("updatePlayers", players);
        }
    });

    socket.on("shoot", (data) => {
        if (players[socket.id] && !players[socket.id].dead) {
            io.emit("bullet", { x: players[socket.id].x, y: players[socket.id].y, angle: data.angle, owner: socket.id });
        }
    });

    // Важно: регистрация смерти теперь более строгая
    socket.on("requestKill", (victimId) => {
        if (players[victimId] && !players[victimId].dead) {
            players[victimId].dead = true;
            io.to(victimId).emit("youDied");
            if (players[socket.id]) players[socket.id].score++;
            io.emit("updatePlayers", players);
        }
    });

    socket.on("respawn", () => {
        if (players[socket.id]) {
            players[socket.id].x = 120; players[socket.id].y = 120;
            players[socket.id].dead = false;
            io.emit("updatePlayers", players);
        }
    });

    socket.on("disconnect", () => { delete players[socket.id]; io.emit("updatePlayers", players); });
});
