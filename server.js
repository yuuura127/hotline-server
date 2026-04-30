<!DOCTYPE html>
<html lang="ka">
<head>
    <meta charset="UTF-8">
    <title>Hotline Online 1vs1</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="game-container">
        <div class="stats">
            <div id="p1-score">თქვენ: 0</div>
            <h1 class="game-title">HOTLINE ONLINE</h1>
            <div id="p2-score">მტერი: 0</div>
        </div>
        <canvas id="gameCanvas" width="800" height="480"></canvas>
        <div id="status">დაკავშირება...</div>
    </div>
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
    <script src="script.js"></script>
</body>
</html>
