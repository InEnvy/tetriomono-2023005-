function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// generaing the random sequences
function generateSequence() {
  const sequence = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

  while (sequence.length) {
    const rand = getRandomInt(0, sequence.length - 1);
    const name = sequence.splice(rand, 1)[0];
    tetrominoSequence.push(name);
  }
}

// puts or generate the next tetromino
function getNextTetromino() {
  if (tetrominoSequence.length === 0) {
    generateSequence();
  }

  const name = tetrominoSequence.pop();
  const matrix = tetrominos[name];

  const col = playfield[0].length / 2 - Math.ceil(matrix[0].length / 2);

  const row = name === 'I' ? -1 : -2;

  return {
    name: name,
    matrix: matrix,
    row: row,
    col: col
  };
}

// rotation the of block degree to 90deg
function rotate(matrix) {
  const N = matrix.length - 1;
  const result = matrix.map((row, i) =>
    row.map((val, j) => matrix[N - j][i])
  );

  return result;
}

// if the mitric/the row and column is right
function isValidMove(matrix, cellRow, cellCol) {
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      if (matrix[row][col] && (
          // outside the game bounds
          cellCol + col < 0 ||
          cellCol + col >= playfield[0].length ||
          cellRow + row >= playfield.length ||
          // collides with another piece
          playfield[cellRow + row][cellCol + col])
        ) {
        return false;
      }
    }
  }

  return true;
}

// add score states the list
let score = 0;
const SCORE_KEY = 'tetris_high_scores_v1';
const MAX_SCORES = 10;

function updateScoreDisplay() {
  const el = document.getElementById('current-score');
  if (el) el.textContent = 'Score: ' + score;
}

function addScoreForLines(lines) {
  const pointsMap = {1: 100, 2: 300, 3: 500, 4: 800};
  const points = pointsMap[lines] || lines * 100;
  score += points;
  updateScoreDisplay();
}

function loadHighScores() {
  try {
    const raw = localStorage.getItem(SCORE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveHighScores(list) {
  try { localStorage.setItem(SCORE_KEY, JSON.stringify(list)); } catch (e) {}
}

function saveCurrentScore() {
  const list = loadHighScores();
  list.push({ score: score, date: new Date().toISOString() });
  list.sort((a,b) => b.score - a.score);
  if (list.length > MAX_SCORES) list.length = MAX_SCORES;
  saveHighScores(list);
  renderHighScores();
}

function clearHighScores() {
  saveHighScores([]);
  renderHighScores();
}

function renderHighScores() {
  const listEl = document.getElementById('high-scores');
  if (!listEl) return;
  const list = loadHighScores();
  listEl.innerHTML = '';
  list.forEach(item => {
    const d = new Date(item.date);
    const li = document.createElement('li');
    li.textContent = `${item.score} — ${d.toLocaleString()}`;
    listEl.appendChild(li);
  });
}

// all the buttons 
document.addEventListener('DOMContentLoaded', () => {
  updateScoreDisplay();
  renderHighScores();
  const saveBtn = document.getElementById('saveScore');
  if (saveBtn) saveBtn.addEventListener('click', saveCurrentScore);
  const clearBtn = document.getElementById('clearScores');
  if (clearBtn) clearBtn.addEventListener('click', clearHighScores);
  const pauseBtn = document.getElementById('pauseBtn');
  if (pauseBtn) pauseBtn.addEventListener('click', togglePause);
  // issue 2: wire restart button
  const restartBtn = document.getElementById('restartBtn');
  if (restartBtn) restartBtn.addEventListener('click', restartGame);
});

// placing the tetromino on the playboard 
function placeTetromino() {
  for (let row = 0; row < tetromino.matrix.length; row++) {
    for (let col = 0; col < tetromino.matrix[row].length; col++) {
      if (tetromino.matrix[row][col]) {

        if (tetromino.row + row < 0) {
          return showGameOver();
        }

        playfield[tetromino.row + row][tetromino.col + col] = tetromino.name;
      }
    }
  }

  // check for line clears starting from the bottom and working our way up
  // (modified slightly to count cleared lines so we can the award score;
  // logic of clearing and shifting rows or pieces is preserved)
  let linesCleared = 0;
  for (let row = playfield.length - 1; row >= 0; ) {
    if (playfield[row].every(cell => !!cell)) {
      linesCleared++;
      // drop every pieces on the row above this one
      for (let r = row; r > 0; r--) {
        for (let c = 0; c < playfield[r].length; c++) {
          playfield[r][c] = playfield[r-1][c];
        }
      }
      // clearing the top row
      playfield[0].fill(0);
    } else {
      row--;
    }
  }

  // award score if lines are cleared
  if (linesCleared > 0) {
    addScoreForLines(linesCleared);
  }

  tetromino = getNextTetromino();
}

// show the game over screen
function showGameOver() {
  cancelAnimationFrame(rAF);
  gameOver = true;

  context.fillStyle = 'black';
  context.globalAlpha = 0.75;
  context.fillRect(0, canvas.height / 2 - 30, canvas.width, 60);

  context.globalAlpha = 1;
  context.fillStyle = 'white';
  context.font = '36px monospace';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('GAME OVER!', canvas.width / 2, canvas.height / 2);
}

const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
const grid = 32;
const tetrominoSequence = [];

const playfield = [];

for (let row = -2; row < 20; row++) {
  playfield[row] = [];

  for (let col = 0; col < 10; col++) {
    playfield[row][col] = 0;
  }
}

// every tetromino pieces 
const tetrominos = {
  'I': [
    [0,0,0,0],
    [1,1,1,1],
    [0,0,0,0],
    [0,0,0,0]
  ],
  'J': [
    [1,0,0],
    [1,1,1],
    [0,0,0],
  ],
  'L': [
    [0,0,1],
    [1,1,1],
    [0,0,0],
  ],
  'O': [
    [1,1],
    [1,1],
  ],
  'S': [
    [0,1,1],
    [1,1,0],
    [0,0,0],
  ],
  'Z': [
    [1,1,0],
    [0,1,1],
    [0,0,0],
  ],
  'T': [
    [0,1,0],
    [1,1,1],
    [0,0,0],
  ]
};

// color of each tetromino
const colors = {
  'I': 'cyan',
  'O': 'yellow',
  'T': 'purple',
  // issue 3: changed S piece from green to sky-blue so it doesn't blend with green colored playboard
  'S': '#00bfff',
  'Z': 'red',
  'J': 'blue',
  'L': 'orange'
};

let count = 0;
let tetromino = getNextTetromino();
let rAF = null;  // keep track of the animation
let gameOver = false;

// add paused function
let paused = false;

function drawPauseOverlay() {
  context.save();
  context.fillStyle = 'rgba(0,0,0,0.45)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'white';
  context.font = '36px monospace';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
  context.restore();
}

function togglePause() {
  const btn = document.getElementById('pauseBtn');
  if (!btn) return;
  paused = !paused;
  if (paused) {
    cancelAnimationFrame(rAF);
    btn.textContent = 'Resume';
    drawPauseOverlay();
  } else {
    btn.textContent = 'Pause';
    rAF = requestAnimationFrame(loop);
  }
}

// issue 2: add restart function
function restartGame() {
  // stop current loop
  cancelAnimationFrame(rAF);

  // clear playfield rows
  for (let row = -2; row < 20; row++) {
    playfield[row] = playfield[row] || [];
    for (let col = 0; col < 10; col++) {
      playfield[row][col] = 0;
    }
  }

  // reset sequence and state
  tetrominoSequence.length = 0;
  score = 0;
  updateScoreDisplay();

  // reset counters and flags
  count = 0;
  gameOver = false;
  paused = false;

  // reset pause button label if present
  const pauseBtn = document.getElementById('pauseBtn');
  if (pauseBtn) pauseBtn.textContent = 'Pause';

  // get next piece and restart loop
  tetromino = getNextTetromino();
  rAF = requestAnimationFrame(loop);
}

// the game loop
function loop() {
  rAF = requestAnimationFrame(loop);
  context.clearRect(0,0,canvas.width,canvas.height);

  for (let row = 0; row < 20; row++) {
    for (let col = 0; col < 10; col++) {
      if (playfield[row][col]) {
        const name = playfield[row][col];
        context.fillStyle = colors[name];

        context.fillRect(col * grid, row * grid, grid-1, grid-1);
      }
    }
  }

  // drawing the active tetromino
  if (tetromino) {

    // tetromino falls every 35 frames or seconds
    if (++count > 35) {
      tetromino.row++;
      count = 0;

      // place pieces if it runs into anything
      if (!isValidMove(tetromino.matrix, tetromino.row, tetromino.col)) {
        tetromino.row--;
        placeTetromino();
      }
    }

    context.fillStyle = colors[tetromino.name];

    for (let row = 0; row < tetromino.matrix.length; row++) {
      for (let col = 0; col < tetromino.matrix[row].length; col++) {
        if (tetromino.matrix[row][col]) {

          context.fillRect((tetromino.col + col) * grid, (tetromino.row + row) * grid, grid-1, grid-1);
        }
      }
    }
  }
}

// listen to keyboard events to move the active tetromino
document.addEventListener('keydown', function(e) {
  if (gameOver) return;
  if (paused) return; // ignore input while paused (added)

  // issue 1: space to hard drop
  if (e.which === 32) {
    // hard drop piece until it collides, then place
    while (isValidMove(tetromino.matrix, tetromino.row + 1, tetromino.col)) {
      tetromino.row++;
    }
    // issue 1: places the piece immediately
    placeTetromino();
    return;
  }

  // issue 2: is 'R' or 'r' to restart
  if (e.key === 'r' || e.key === 'R') {
    restartGame();
    return;
  }

  // left and right arrow keys (move)
  if (e.which === 37 || e.which === 39) {
    const col = e.which === 37
      ? tetromino.col - 1
      : tetromino.col + 1;

    if (isValidMove(tetromino.matrix, tetromino.row, col)) {
      tetromino.col = col;
    }
  }

  // up arrow key (rotate)
  if (e.which === 38) {
    const matrix = rotate(tetromino.matrix);
    if (isValidMove(matrix, tetromino.row, tetromino.col)) {
      tetromino.matrix = matrix;
    }
  }

  // down arrow key (drop)
  if(e.which === 40) {
    const row = tetromino.row + 1;

    if (!isValidMove(tetromino.matrix, row, tetromino.col)) {
      tetromino.row = row - 1;

      placeTetromino();
      return;
    }

    tetromino.row = row;
  }
});

// starts the game
rAF = requestAnimationFrame(loop);

updateScoreDisplay();
renderHighScores();
