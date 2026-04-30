const io = require('socket.io')(process.env.PORT || 3000, {
    cors: { origin: "*" } 
});

let players = {};

io.on('connection', (socket) => {
    console.log('Игрок подключился:', socket.id);
    
    // Создаем нового игрока со случайными координатами
    players[socket.id] = { 
        x: Math.random() * 700 + 50, 
        y: Math.random() * 500 + 50, 
        color: Math.random() > 0.5 ? '#00ffff' : '#ff00ff' 
    };

    // Отправляем всем текущее состояние игры
    io.emit('updatePlayers', players);

    // Обработка движения
    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id].x += data.x;
            players[socket.id].y += data.y;
            io.emit('updatePlayers', players);
        }
    });

    // Обработка отключения
    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('updatePlayers', players);
    });
});

console.log('Сервер запущен!');