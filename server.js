const { Server } = require("socket.io");
const io = new Server(process.env.PORT || 3000, { cors: { origin: "*" } });

let players = {};
const TILE_SIZE = 60;
const PLAYER_SPEED = 2.7;

// Огромная карта (40x20)
const map = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,0,1,1,1,0,0,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,0,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

function getRandomSpawn() {
    let x, y;
    do {
        x = Math.floor(Math.random() * (map[0].length - 2) + 1) * TILE_SIZE + 30;
        y = Math.floor(Math.random() * (map.length - 2) + 1) * TILE_SIZE + 30;
    } while (map[Math.floor(y / TILE_SIZE)][Math.floor(x / TILE_SIZE)] === 1);
    return { x, y };
}

io.on("connection", (socket) => {
    socket.on("joinGame", (nickname) => {
        const spawn = getRandomSpawn();
        // Распределение по командам (кто-то красный, кто-то голубой)
        const team = Object.keys(players).length % 2 === 0 ? "blue" : "red";
        players[socket.id] = { ...spawn, nickname: nickname || "Player", score: 0, dead: false, team: team };
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
            io.emit("bullet", { x: players[socket.id].x, y: players[socket.id].y, angle: data.angle, owner: socket.id, team: players[socket.id].team });
        }
    });

    socket.on("requestKill", (data) => {
        const victim = players[data.victimId];
        const killer = players[socket.id];
        // Проверка: убить можно только врага
        if (victim && killer && !victim.dead && victim.team !== killer.team) {
            victim.dead = true;
            io.to(data.victimId).emit("youDied");
            killer.score++;
            io.emit("updatePlayers", players);
        }
    });

    socket.on("respawn", () => {
        if (players[socket.id]) {
            const spawn = getRandomSpawn();
            players[socket.id].x = spawn.x; players[socket.id].y = spawn.y;
            players[socket.id].dead = false;
            io.emit("updatePlayers", players);
        }
    });

    socket.on("disconnect", () => { delete players[socket.id]; io.emit("updatePlayers", players); });
});
