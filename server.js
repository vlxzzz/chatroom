require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const crypto = require("crypto");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let rooms = {};  // Stores room codes, passwords, and messages

// Generate a unique 6-character room code
function generateRoomCode() {
    return crypto.randomBytes(3).toString("hex").toUpperCase();
}

app.use(express.static("public"));  // Serve static files (like HTML, CSS, JS)

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Create a new room
    socket.on("createRoom", ({ username, password }) => {
        const roomCode = generateRoomCode();
        rooms[roomCode] = { password, messages: [] };
        socket.join(roomCode);
        console.log(`${username} created room: ${roomCode}`);

        socket.emit("roomCreated", { roomCode });
    });

    // Join an existing room
    socket.on("joinRoom", ({ username, roomCode, password }) => {
        if (!rooms[roomCode]) {
            socket.emit("errorMessage", "Room does not exist.");
            return;
        }

        if (rooms[roomCode].password && rooms[roomCode].password !== password) {
            socket.emit("errorMessage", "Incorrect password.");
            return;
        }

        socket.join(roomCode);
        console.log(`${username} joined room: ${roomCode}`);

        socket.emit("loadMessages", rooms[roomCode].messages);
    });

    // Send a message to the room
    socket.on("sendMessage", ({ username, roomCode, message }) => {
        if (!rooms[roomCode]) return;

        const msgData = { username, message, timestamp: new Date() };
        rooms[roomCode].messages.push(msgData);
        io.to(roomCode).emit("receiveMessage", msgData);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });

    // Clear chat messages every 15 minutes
    setInterval(() => {
        rooms = {};
        console.log("Chat reset.");
    }, 15 * 60 * 1000);  // 15 minutes in milliseconds
});

// Serve the app on the PORT specified in environment or default to 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
