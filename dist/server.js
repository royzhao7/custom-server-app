"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const next_1 = __importDefault(require("next"));
const ssh2_1 = require("ssh2");
const socket_io_1 = require("socket.io");
const port = parseInt(process.env.PORT || "4000", 10);
const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const app = (0, next_1.default)({ dev, hostname, port });
const handler = app.getRequestHandler();
app.prepare().then(() => {
    const httpServer = (0, http_1.createServer)(handler);
    const io = new socket_io_1.Server(httpServer);
    // Handle WebSocket connections
    io.on('connection', (ws) => {
        console.log('New WebSocket connection established.');
        // Create an SSH client
        const sshClient = new ssh2_1.Client();
        // Connect to the SSH server
        sshClient.on('ready', () => {
            console.log('SSH Client: Connection established.');
            // Start a shell session
            sshClient.shell((err, stream) => {
                if (err)
                    throw err;
                // Handle data from the SSH stream
                stream.on('data', (data) => {
                    console.log(`SSH Data: ${data}`);
                    // Send SSH output back to WebSocket clients
                    ws.emit('message', data.toString());
                });
                // Handle input from WebSocket clients and send to SSH shell
                ws.on('message', (value) => {
                    console.log(`Received from WebSocket: ${value}`);
                    stream.write(value); // Send to SSH shell
                });
                // Handle WebSocket close event
                ws.on('close', () => {
                    console.log('WebSocket connection closed.');
                    sshClient.end(); // Close the SSH connection
                });
            });
        }).connect({
            host: '192.168.1.77',
            port: 22,
            username: 'zhaos',
            password: '123456' // SSH password
            // You can also use privateKey instead of password if needed
        });
        // Handle SSH errors
        sshClient.on('error', (err) => {
            console.error(`SSH Client Error: ${err}`);
            ws.send('Error connecting to SSH server.');
            ws.disconnect();
        });
    });
    httpServer
        .once("error", (err) => {
        console.error(err);
        process.exit(1);
    })
        .listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
    });
});
