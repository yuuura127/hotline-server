const socket = io('https://hotline-server.onrender.com');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const statusDiv = document.getElementById('status');

let myId = null;
let players = {};
let bullets = [];
const keys = {};
let mousePos = { x: 0, y: 0 };

const TILE_SIZE = 80;
const map = [
    [1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,0,1],
    [1,0,1,0,0,0,0,1,0,1],
    [1,0,0,0,1,1,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1]
];

socket.on('connect', () => { 
    myId = socket.id; 
    statusDiv.innerText = "დაკავშირებულია! გამოიყენეთ მაუსი სასროლად.";
});

socket.on('updatePlayers', (serverPlayers) => { players = serverPlayers; });

socket.on('bullet', (data) => {
    bullets.push({
        x: data.x, y: data.y,
        vx: Math.cos(data.angle) * 12,
        vy: Math.sin(data.angle) * 12
    });
});

window.onkeydown = (e) => keys[e.code] = true;
window.onkeyup = (e) => keys[e.code] = false;

canvas.onmousemove = (e) => {
    const rect = canvas.getBoundingClientRect();
    mousePos.x = e.clientX - rect.left;
    mousePos.y = e.clientY - rect.top;
};

canvas.onmousedown = () => {
    if (!players[myId]) return;
    const angle = Math.atan2(mousePos.y - players[myId].y, mousePos.x - players[myId].x);
    socket.emit('shoot', { angle });
};

function loop() {
    let move = { x: 0, y: 0 };
    const speed = 4;
    if (keys['KeyW']) move.y = -speed;
    if (keys['KeyS']) move.y = speed;
    if (keys['KeyA']) move.x = -speed;
    if (keys['KeyD']) move.x = speed;

    if (move.x !== 0 || move.y !== 0) socket.emit('move', move);

    bullets.forEach((b, i) => {
        b.x += b.vx; b.y += b.vy;
        if (b.x < 0 || b.x > 800 || b.y < 0 || b.y > 400) bullets.splice(i, 1);
    });

    draw();
    requestAnimationFrame(loop);
}

function draw() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Рисуем стены лабиринта
    ctx.fillStyle = '#1a1a1a';
    ctx.strokeStyle = '#ff00ff';
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            if (map[y][x] === 1) {
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    // Игроки
    for (let id in players) {
        const p = players[id];
        ctx.fillStyle = (id === myId) ? '#00ffff' : '#ff00ff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.fillStyle;
        ctx.fillRect(p.x - 15, p.y - 15, 30, 30);
        ctx.shadowBlur = 0;

        if (id === myId) {
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mousePos.x, mousePos.y); ctx.stroke();
        }
    }

    // Пули
    ctx.fillStyle = '#fff000';
    bullets.forEach(b => ctx.fillRect(b.x - 3, b.y - 3, 6, 6));
}
loop();
