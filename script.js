// Game canavs
const canvas = document.getElementById('game');
const context = canvas.getContext('2d');

const grid = 32;

let score = 0;
let record = 0;
let level = 1;

var tetroQueue = [];
// size of field is 10 x 20 adn some rows 
var playfield = [];

// size of localstorage
var Storage_size = localStorage.length;
// is not emty?
if (Storage_size > 0) {
	// get top score and name of champion
	record = localStorage.record;
	recordName = localStorage.recordName;
}

// show top score before start the game
let topScore = document.getElementById('top-score');
topScore.textContent = `Top score : ${record}`;


// push emty elemets at all play field 
for (let row = -2; row < 20; row++) {
	playfield[row] = [];

	for (let col = 0; col < 10; col++) {
		playfield[row][col] = 0;
	}
}

// forms for each tetris element
const tetroForms = {
	'I': [
		[0, 0, 0, 0],
		[1, 1, 1, 1],
		[0, 0, 0, 0],
		[0, 0, 0, 0]
	],

	'J': [
		[1, 0, 0],
		[1, 1, 1],
		[0, 0, 0],
	],

	'L': [
		[0, 0, 1],
		[1, 1, 1],
		[0, 0, 0],
	],

	'O': [
		[1, 1],
		[1, 1],
	],

	'S': [
		[0, 1, 1],
		[1, 1, 0],
		[0, 0, 0],
	],

	'Z': [
		[1, 1, 0],
		[0, 1, 1],
		[0, 0, 0],
	],

	'T': [
		[0, 1, 0],
		[1, 1, 1],
		[0, 0, 0],
	]
};

// color of each element
const colors = {
	'I': 'cyan',
	'O': 'yellow',
	'T': 'purple',
	'S': 'green',
	'Z': 'red',
	'J': 'blue',
	'L': 'orange'
};

// counter
let count = 0;
// actualy element
let tetroForm = getNextTetroForm();
// check animation frames. For stop the game
let rAF = null;
// end game flag
let gameOver = false;

// GENERATE RANDOM ELEMS

// func return random number
function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);

	return Math.floor(Math.random() * (max - min + 1)) + min;
}

// generate queue
function generateQueue() {
	const queue = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

	while (queue.length) {
		const rand = getRandomInt(0, queue.length - 1);
		const name = queue.splice(rand, 1)[0];
		// push this elem at queue array
		tetroQueue.push(name);
	}
}

// get next elem
function getNextTetroForm() {
	// generate next elem if it is not
	if (tetroQueue.length === 0) {
		generateQueue();
	}
	// get first elem from array
	const name = tetroQueue.pop();
	// create the matrix
	const matrix = tetroForms[name];

	// I and O start at center, other - some left
	const col = playfield[0].length / 2 - Math.ceil(matrix[0].length / 2);

	// I start at 21 row, other - 22 row
	const row = name === 'I' ? -1 : -2;

	return {
		name: name, // name of elem (L, O etc.)
		matrix: matrix, // matrix whith the elem
		row: row, // currnt row
		col: col // current column
	};
}

// turn matrix at 90
function rotate(matrix) {
	const N = matrix.length - 1;
	const result = matrix.map((row, i) => row.map((val, j) => matrix[N - j][i]));
	return result;
}

// check after create or turn over
function isValidMove(matrix, cellRow, cellCol) {
	// check all rows and cols
	for (let row = 0; row < matrix.length; row++) {
		for (let col = 0; col < matrix[row].length; col++) {
			if (matrix[row][col] && (
				cellCol + col < 0 ||
				cellCol + col >= playfield[0].length ||
				cellRow + row >= playfield.length ||
				playfield[cellRow + row][cellCol + col])
			) {
				return false;
			}
		}
	}
	return true;
}

// when elem finaly drop on place
function placeTetroElement() {
	for (let row = 0; row < tetroForm.matrix.length; row++) {
		for (let col = 0; col < tetroForm.matrix[row].length; col++) {
			if (tetroForm.matrix[row][col]) {
				if (tetroForm.row + row < 0) {
					return showGameOver();
				}
				playfield[tetroForm.row + row][tetroForm.col + col] = tetroForm.name;
			}
		}
	}

	// full rows is cleaned
	for (let row = playfield.length - 1; row >= 0;) {
		// if row if full
		if (playfield[row].every(cell => !!cell)) {
			// score counter
			score += 10;
			// level counter
			level = Math.floor(score / 100) + 1;
			// check record
			if (score > record) {
				// change record score
				record = score;
				// push score to lockalstorage
				localStorage.record = record;
				// push name to lockalstorage
				localStorage.recordName = recordName;
			}
			// clean it and drop all field on 1 row
			for (let r = row; r >= 0; r--) {
				for (let c = 0; c < playfield[r].length; c++) {
					playfield[r][c] = playfield[r - 1][c];
				}
			}
		}
		else {
			row--;
		}
	}
	// get next elem
	tetroForm = getNextTetroForm();
}

// Game Over
function showGameOver() {
	// stop animation
	cancelAnimationFrame(rAF);
	// flag stop
	gameOver = true;
	// create rectangle in center field
	context.fillStyle = 'black';
	context.globalAlpha = 0.75;
	context.fillRect(0, canvas.height / 2 - 30, canvas.width, 60);
	// add text
	context.globalAlpha = 1;
	context.fillStyle = 'white';
	context.font = '36px monospace';
	context.textAlign = 'center';
	context.textBaseline = 'middle';
	context.fillText('GAME OVER!', canvas.width / 2, canvas.height / 2);
}

// keys check
document.addEventListener('keydown', function (e) {
	// exit if game is over
	if (gameOver) return;

	// left and right arrows
	if (e.which === 37 || e.which === 39) {
		const col = e.which === 37
			// if left arrow is push then make smaller index
			// if right arrow is push then make bigger index
			? tetroForm.col - 1
			: tetroForm.col + 1;

		if (isValidMove(tetroForm.matrix, tetroForm.row, col)) {
			tetroForm.col = col;
		}
	}

	// arrow up - is turn over
	if (e.which === 38) {
		// turn over at 90 deg
		const matrix = rotate(tetroForm.matrix);

		if (isValidMove(matrix, tetroForm.row, tetroForm.col)) {
			tetroForm.matrix = matrix;
		}
	}

	// arrow down - spped up
	if (e.which === 40) {
		const row = tetroForm.row + 1;
		if (!isValidMove(tetroForm.matrix, row, tetroForm.col)) {
			tetroForm.row = row - 1;
			placeTetroElement();
			return;
		}
		tetroForm.row = row;
	}
});

// show statistic func
function showScore() {
	let gameLevel = document.getElementById('level');
	let yourScore = document.getElementById('your-score');
	let topScore = document.getElementById('top-score');

	gameLevel.textContent = `Level : ${level}`;
	yourScore.textContent = `Your score : ${score}`;
	topScore.textContent = `Top score : ${record}`;
}

// main cycle
function loop() {
	showScore();
	// start animation
	rAF = requestAnimationFrame(loop);
	// clean canvas
	context.clearRect(0, 0, canvas.width, canvas.height);

	// make play field whith elems
	for (let row = 0; row < 20; row++) {
		for (let col = 0; col < 10; col++) {
			if (playfield[row][col]) {
				const name = playfield[row][col];
				context.fillStyle = colors[name];

				// all elems -1px
				context.fillRect(col * grid, row * grid, grid - 1, grid - 1);
			}
		}
	}

	// make current elem
	if (tetroForm) {

		// change speed of game
		if (++count > (36 - (level * 2))) {
			tetroForm.row++;
			count = 0;

			// if moving is stop
			if (!isValidMove(tetroForm.matrix, tetroForm.row, tetroForm.col)) {
				tetroForm.row--;
				placeTetroElement();
			}
		}

		// color current elem
		context.fillStyle = colors[tetroForm.name];

		// make elem
		for (let row = 0; row < tetroForm.matrix.length; row++) {
			for (let col = 0; col < tetroForm.matrix[row].length; col++) {
				if (tetroForm.matrix[row][col]) {

					// -1px
					context.fillRect((tetroForm.col + col) * grid, (tetroForm.row + row) * grid, grid - 1, grid - 1);
				}
			}
		}
	}
}

function startFunction() {
	rAF = requestAnimationFrame(loop);
}

