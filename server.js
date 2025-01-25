const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('New client connected');
    
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        
        // Handle different actions
        if (data.action === 'create') {
            const roomCode = generateRoomCode();
            ws.send(JSON.stringify({ action: 'roomCreated', roomCode }));
        } else if (data.action === 'join') {
            // Handle joining room (e.g., check if password is correct)
            ws.send(JSON.stringify({ action: 'joinRoom', roomCode: data.room }));
        } else if (data.action === 'message') {
            // Broadcast the message to all clients in the room
            wss.clients.forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ action: 'message', username: data.username, message: data.message }));
                }
            });
        } else if (data.action === 'leave') {
            // Handle leaving room
            ws.send(JSON.stringify({ action: 'leave', message: 'You have left the room' }));
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

function generateRoomCode() {
    return Math.random().toString(36).substr(2, 6); // Simple random 6-character room code
}

console.log("WebSocket server is running on ws://localhost:8080");
