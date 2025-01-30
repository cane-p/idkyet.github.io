// Select the canvas element and set up the drawing context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game settings
const unitSize = 20;
let running = false;
let xVelocity = unitSize;
let yVelocity = 0;
let foodX;
let foodY;
let score = 0;

// Snake parts array representing the snake's body
let snake = [
    { x: unitSize * 2, y: 0 },
    { x: unitSize, y: 0 },
    { x: 0, y: 0 }
];

// Start the game
window.addEventListener('load', () => {
    createFood();
    drawFood();
    running = true;
    gameLoop();
});

// Game loop function
function gameLoop() {
    if (running) {
        setTimeout(() => {
            clearBoard();
            drawFood();
            moveSnake();
            drawSnake();
            checkGameOver();
            gameLoop();
        }, 100);
    } else {
        displayGameOver();
    }
}

// Clear the canvas
function clearBoard() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Create food at random position
function createFood() {
    foodX = Math.floor(Math.random() * (canvas.width / unitSize)) * unitSize;
    foodY = Math.floor(Math.random() * (canvas.height / unitSize)) * unitSize;
}

// Draw the food
function drawFood() {
    ctx.fillStyle = 'red';
    ctx.fillRect(foodX, foodY, unitSize, unitSize);
}

// Move the snake
function moveSnake() {
    const head = { x: snake[0].x + xVelocity, y: snake[0].y + yVelocity };
    snake.unshift(head);

    // Check if snake has eaten the food
    if (snake[0].x === foodX && snake[0].y === foodY) {
        score += 1;
        document.getElementById('score').innerText = 'Score: ' + score;
        createFood();
    } else {
        snake.pop();
    }
}

// Draw the snake
function drawSnake() {
    ctx.fillStyle = 'lime';
    snake.forEach(part => {
        ctx.fillRect(part.x, part.y, unitSize, unitSize);
    });
}

// Change direction based on key presses
window.addEventListener('keydown', changeDirection);

function changeDirection(event) {
    const keyPressed = event.keyCode;
    const LEFT = 37, UP = 38, RIGHT = 39, DOWN = 40;

    const goingUp = yVelocity === -unitSize;
    const goingDown = yVelocity === unitSize;
    const goingRight = xVelocity === unitSize;
    const goingLeft = xVelocity === -unitSize;

    switch (true) {
        case (keyPressed === LEFT && !goingRight):
            xVelocity = -unitSize;
            yVelocity = 0;
            break;
        case (keyPressed === UP && !goingDown):
            xVelocity = 0;
            yVelocity = -unitSize;
            break;
        case (keyPressed === RIGHT && !goingLeft):
            xVelocity = unitSize;
            yVelocity = 0;
            break;
        case (keyPressed === DOWN && !goingUp):
            xVelocity = 0;
            yVelocity = unitSize;
            break;
    }
}

// Check for collisions
function checkGameOver() {
    const head = snake[0];
    // Collides with walls
    if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
        running = false;
    }
    // Collides with self
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            running = false;
        }
    }
}

// Display Game Over message
function displayGameOver() {
    ctx.font = "50px Courier New";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
    ctx.font = "25px Courier New";
    ctx.fillText("Press 'Enter' to Restart", canvas.width / 2, canvas.height / 2 + 50);
}

// Restart the game
window.addEventListener('keydown', (event) => {
    if (event.keyCode === 13 && !running) {
        resetGame();
    }
});

function resetGame() {
    score = 0;
    document.getElementById('score').innerText = 'Score: ' + score;
    xVelocity = unitSize;
    yVelocity = 0;
    snake = [
        { x: unitSize * 2, y: 0 },
        { x: unitSize, y: 0 },
        { x: 0, y: 0 }
    ];
    running = true;
    gameLoop();
}
