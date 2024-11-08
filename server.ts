import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { WebSocketServer } from 'ws';
import {Client as SSHClient} from 'ssh2'


const port = parseInt(process.env.PORT || "4000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server=createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  }
  

).listen(port);



// Create a WebSocket server
const wss = new WebSocketServer({ noServer: true });

// Handle WebSocket connections
wss.on('connection', (ws) => {
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
            stream.on('data', (data:any) => {
                console.log(`SSH Data: ${data}`);
                // Send SSH output back to WebSocket clients
                ws.send(data.toString());
            });

            // Handle input from WebSocket clients and send to SSH shell
            ws.on('message', (message: string) => {
                console.log(`Received from WebSocket: ${message}`);
                stream.write(message); // Send to SSH shell
            });

            // Handle WebSocket close event
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
        ws.close();
    });
});



// Upgrade the HTTP server to handle WebSocket connections
server.on('upgrade', (request: any, socket: any, head: any) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
      console.log('upgrade')
      wss.emit('connection', ws, request);
  });
});




  console.log(
    `> Server listening at http://localhost:${port} as ${
      dev ? "development" : process.env.NODE_ENV
    }`,
  );
});
