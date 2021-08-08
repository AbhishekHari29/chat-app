const socket = io();

//Elements
const $sideBarSection = document.querySelector("#sidebar-section");
const $chatSection = document.querySelector("#chat-section");
const $messageForm = document.querySelector("#message-form");
const $messageTextbox = document.querySelector("#message-textbox");
const $messageSendBtn = document.querySelector("#send-message");
const $sendLocationBtn = document.querySelector("#send-location");

//Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sideBarTemplate = document.querySelector("#sidebar-template").innerHTML;

//Options
const { username, room } = Qs.parse(location.search, {
	ignoreQueryPrefix: true
});

const autoScroll = () => {
	//New message element
	const $newMessage = $chatSection.lastElementChild;

	//Height of new message
	const newMessageStyles = getComputedStyle($newMessage);
	const newMessageMargin = parseInt(newMessageStyles.marginBottom);
	const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

	// Visible height
	const visibleHeight = $chatSection.offsetHeight;

	//Height of chat container
	const containerHeight = $chatSection.scrollHeight;

	// How far is scrolled
	const scrollOffset = $chatSection.scrollTop + visibleHeight;

	if (containerHeight - newMessageHeight <= scrollOffset) {
		$chatSection.scrollTop = $chatSection.scrollHeight;
	}
};

socket.on("roomData", ({ room, users }) => {
	const html = Mustache.render(sideBarTemplate, {
		room,
		users
	});
	$sideBarSection.innerHTML = html;
});

socket.on("message", (message) => {
	const html = Mustache.render(messageTemplate, {
		...message,
		createdAt: moment(message.createdAt).format("h:mm a")
	});
	$chatSection.insertAdjacentHTML("beforeend", html);
	autoScroll();
});

socket.on("locationMessage", (message) => {
	const html = Mustache.render(locationTemplate, {
		...message,
		createdAt: moment(message.createdAt).format("h:mm a")
	});
	$chatSection.insertAdjacentHTML("beforeend", html);
});

sendMessage = (e) => {
	e.preventDefault();
	$messageSendBtn.setAttribute("disabled", "disabled");
	const message = $messageTextbox.value;
	// if (!message) return alert("Please provide message.");
	socket.emit("sendMessage", message, (ackMessage) => {
		$messageSendBtn.removeAttribute("disabled");
		$messageTextbox.value = "";
		$messageTextbox.focus();
		if (ackMessage) return alert(ackMessage);
		console.log("Message Delivered");
	});
};

const shareLocation = (e) => {
	e.preventDefault();
	$sendLocationBtn.setAttribute("disabled", "disabled");
	if (!navigator.geolocation)
		return alert("Your browers doesn't support geolocation");

	navigator.geolocation.getCurrentPosition((location) => {
		console.log("Location sent");
		socket.emit(
			"shareLocation",
			location.coords.latitude,
			location.coords.longitude,
			(ackMessage) => {
				if (ackMessage) return alert(ackMessage);
				console.log("Location shared!");
				$sendLocationBtn.removeAttribute("disabled");
			}
		);
	});
	// $sendLocationBtn.removeAttribute("disabled");
};

$messageForm.addEventListener("submit", sendMessage);
$sendLocationBtn.addEventListener("click", shareLocation);

socket.emit("join", { username, room }, (error) => {
	if (error) {
		alert(error);
		location.href = "/	";
	}
});
