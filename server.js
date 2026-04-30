const { Server } = require("socket.io");
const io = new Server(process.env.PORT || 3000, { cors: { origin: "*" } });

let players = {};
const TILE_SIZE = 60;

// Карта точно как на скриншоте image_d5d65a.png, заполняющая все пространство
const map = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,1,1,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,1,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

io.on("connection", (socket) => {
    socket.on("joinGame", (nickname) => {
        players[socket.id] = { x: 120, y: 120, nickname: nickname || "Player", score: 0, dead: false };
        io.emit("updatePlayers", players);
    });

    socket.on("move", (move) => {
        let p = players[socket.id];
        if (p && !p.dead) {
            let nextX = p.x + move.x;
            let nextY = p.y + move.y;
            
            // Проверка коллизий (хитбокс 15px)
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

    socket.on("playerHit", (id) => { if(players[id]) { players[id].dead = true; io.to(id).emit("youDied"); io.emit("updatePlayers", players); }});
    socket.on("killConfirmed", (id) => { if(players[id]) { players[id].score++; io.emit("updatePlayers", players); }});
    socket.on("respawn", () => { if(players[socket.id]) { players[socket.id].x = 120; players[socket.id].y = 120; players[socket.id].dead = false; io.emit("updatePlayers", players); }});
    socket.on("disconnect", () => { delete players[socket.id]; io.emit("updatePlayers", players); });
});
