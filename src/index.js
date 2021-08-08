const http = require("http");
const path = require("path");
const express = require("express");
const socketio = require("socket.io");
const Filter = require("bad-words");
const {
	generateMessage,
	generateLocationMessage
} = require("./utils/messages");
const {
	addUser,
	removeUser,
	getUser,
	getUserInRoom
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const PORT = process.env.PORT || 3000;
const publicDirectory = path.join(__dirname, "../public");
const systemMessageName = "Admin";

app.use(express.static(publicDirectory));

io.on("connection", (socket) => {
	console.log("New WebSocket connection!");

	socket.on("join", (options, callback) => {
		const { error, user } = addUser({ id: socket.id, ...options });

		if (error) return callback(error);

		socket.join(user.room);
		socket.emit(
			"message",
			generateMessage(systemMessageName, "Welcome to Chat App!")
		);
		socket.broadcast
			.to(user.room)
			.emit(
				"message",
				generateMessage(
					systemMessageName,
					`${user.username} has joined!`
				)
			);
		io.to(user.room).emit("roomData", {
			room: user.room,
			users: getUserInRoom(user.room)
		});
		callback();
	});

	socket.on("sendMessage", (message, callback) => {
		const user = getUser(socket.id);
		if (!user) return callback("User doesn't exist");

		const filter = new Filter();
		if (filter.isProfane(message)) {
			// message = filter.clean(message);
			return callback("Bad words are not allowed");
		}
		io.to(user.room).emit(
			"message",
			generateMessage(user.username, message)
		);
		callback();
	});

	socket.on("shareLocation", (latitude, longitude, callback) => {
		const user = getUser(socket.id);
		if (!user) return callback("User doesn't exist");
		io.to(user.room).emit(
			"locationMessage",
			generateLocationMessage(
				user.username,
				`https://www.google.com/maps?q=${latitude},${longitude}`
			)
		);
		callback();
	});

	socket.on("disconnect", () => {
		const user = removeUser(socket.id);
		if (user) {
			io.to(user.room).emit(
				"message",
				generateMessage(systemMessageName, `${user.username} has left!`)
			);
			io.to(user.room).emit("roomData", {
				room: user.room,
				users: getUserInRoom(user.room)
			});
		}
	});
});

server.listen(PORT, () => {
	console.log("Server running on", PORT);
});
