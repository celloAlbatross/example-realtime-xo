var io = require('socket.io')(8000);
var clients = [];
var players = [];
var boxs = []; // one boxs dimension 2 people only --> but can scaleup --> boxs = [[], [], ...]

// frontend copy
var playerTurn = true;
var nBox = 9;
var playBox = 3;

function checkRow() {
	for (var i = 0; i < playBox; i++) {
		var wingame = true;
		for (var j = 0; j < playBox; j++) {
			if (boxs[i*3 + 0] != boxs[i*3 + j] || boxs[i*3 + j] == 0) wingame = false;
		}
		if (wingame) return true;
	}
	return false;
}

function checkCol() {
	for (var i = 0; i < playBox; i++) {
		var wingame = true;
		for (var j = 0; j < playBox; j++) {
			if (boxs[0*playBox + i] != boxs[j*playBox + i] || boxs[j*playBox + i] == 0) wingame = false;
		}
		if (wingame) return true;
	}
	return false;
}

function checkCornor() {
	var wingame = true;
	for (var i = 0; i < playBox; i++) {
		if (boxs[0] != boxs[i*playBox + i] || boxs[i*playBox + i] == 0) wingame = false;
	}
	if (wingame) return true;

	wingame = true;
	for (var i = 0; i < playBox; i++) {
		if (boxs[(playBox-1)*playBox + 0] != boxs[(playBox-1-i)*playBox + i] || boxs[(playBox-1-i)*playBox + i] == 0) wingame = false;
	}
	if (wingame) return true;
	return false;
}

function checkDraw() {
	for (var i = 0; i < nBox; i++) {
		if (boxs[i] == 0) return false;
	}
	return true;
}

function isGameEnd() {
	return checkRow() || checkCol() || checkCornor() || checkDraw();
}

function fillColorBox(position) {
	console.log("fillColorBox");
	if (boxs[position] == 0) {
		console.log('in if');
		boxs[position] = (playerTurn ? -1 : 1);
		console.log("Box Position " + boxs[position]);
		playerTurn = (playerTurn + 1) % 2;
	}
}
// front end copy

function isPlayerTurn(id) {
	var index = players.indexOf(id);
	return index != playerTurn;
}

function isPlayer(id) {
	var index = players.indexOf(id);
	return index >= 0; // hard code
}

function gameStart() {
	// boxs = new Array(9+1).join('0').split('');
	console.log("GAmeStart");
	for (var i = 0, len = players.length; i < len; i++) {
		console.log("id" + i + " : " + players[i]);
		io.to(players[i]).emit('canplay', ((i % 2 == 0) ? "red" : "blue"));
	}
}

function gameEnd() {
	players = [];
	boxs = new Array(9+1).join('0').split('');
	io.sockets.emit('gameend', '');
	playerTurn = true;
}

function prepare(socket) {
	if (players.length == 0) {
		players.push(socket.id);
	}
	else if (players.length == 1) {
		players.push(socket.id); // wait_state
		gameStart();
	}
	// else scaleup matchPair
}

io.on('connection', function(socket) {
	io.to(socket.id).emit('fillcolor', boxs);
	console.log('connected : ' + socket.id);
	clients.push(socket.id);

	socket.on('regame', function(data) {
		prepare(socket);
		io.sockets.emit('fillcolor', boxs);
	});

	socket.on('join', function(username) {
		console.log(username + ' join game');
		socket.username = username;
		prepare(socket);
	});

	socket.on('update', function(position) {
		if (isPlayer(socket.id) && isPlayerTurn(socket.id)) {
			fillColorBox(position);
			io.sockets.emit('fillcolor', boxs);
			if (isGameEnd()) gameEnd();
		}
	});

	socket.on('disconnect', function() {
		console.log('***[disconnected : ' + socket.id + ']');
		var index = clients.indexOf(socket.id);
		clients.splice(index, 1);
		if (isPlayer(socket.id)) {
			gameEnd();
			console.log('game should end');
		}
	});
});

