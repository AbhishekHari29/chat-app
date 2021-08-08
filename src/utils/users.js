const users = [];

const addUser = ({ id, username, room }) => {
	//Clean data
	username = username.trim().toLowerCase();
	room = room.trim().toLowerCase();

	//Validate data
	if (!username || !room)
		return {
			error: "Username and room is required!"
		};

	//Check for existing user
	const existingUser = users.find(
		(user) => user.room === room && user.username === username
	);

	//Validate User
	if (existingUser)
		return {
			error: "Username is already in use!"
		};

	//Store User
	const user = { id, username, room };
	users.push(user);
	return { user };
};

const removeUser = (id) => {
	const index = users.findIndex((user) => user.id === id);
	if (index !== -1) return users.splice(index, 1)[0];
};

const getUser = (id) => {
	return users.find((user) => user.id === id);
};

const getUserInRoom = (room) => {
	return users.filter((user) => user.room === room.trim().toLowerCase());
};

module.exports = {
	addUser,
	removeUser,
	getUser,
	getUserInRoom
};
