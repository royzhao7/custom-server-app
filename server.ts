import { createServer } from "http";
import next from "next";
import { Client as SSHClient } from 'ssh2'
import { Server } from "socket.io";


const port = parseInt(process.env.PORT || "4000", 10);
const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost"
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler)
  const io=new Server(httpServer)

  // Handle WebSocket connections
  io.on('connection', (ws) => {
    console.log('New WebSocket connection established.');

    // Create an SSH client
    const sshClient = new SSHClient();

    // Connect to the SSH server
    sshClient.on('ready', () => {
      console.log('SSH Client: Connection established.');

      // Start a shell session
      sshClient.shell((err, stream) => {
        if (err) throw err;

        // Handle data from the SSH stream
        stream.on('data', (data: any) => {
          console.log(`SSH Data: ${data}`);
          // Send SSH output back to WebSocket clients
          ws.emit('message',data.toString());
        });

        // Handle input from Socket.IO clients and send to SSH shell
        ws.on('message', (value) => {
          console.log(`Received from WebSocket: ${value}`);
          stream.write(value); // Send to SSH shell
        });

        // Handle Socket.IO close event
        ws.on('close', () => {
          console.log('WebSocket connection closed.');
          sshClient.end(); // Close the SSH connection
        });
      });
    }).connect({
      host: '192.168.1.77', // SSH server address
      port: 22,                // SSH port
      username: 'zhaos', // SSH username
      password: '123456'  // SSH password
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
