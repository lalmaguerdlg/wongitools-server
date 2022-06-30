import path from "path";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { logger } from "./logger";
import bonjour from 'bonjour';
import { PORT, SERVICE_NAME } from "./env";
import { fork } from "child_process";
import { IPCAdvertiseServiceMessage } from "./types";
import LineTagTransform from "./util";

function startServiceBroadcaster(servicePort: number) {
  const child = fork(path.join(__dirname, "./service-broadcaster"), {
    stdio: ['pipe', 'pipe', 'pipe', 'ipc']
  });
  child.stdout?.pipe(new LineTagTransform(`[service-broadcaster:${child.pid}]`)).on('data', (data) => {
    logger.info(data)
  })
  child.stderr?.pipe(new LineTagTransform(`[service-broadcaster:${child.pid}]`)).on('data', (data) => {
    logger.info(data)
  });
  child.on('close', (code, signal) => {
    logger.info(`[service-broadcaster:${child.pid}] Process exited with code: ${code}`)
  })
  const ipcMessage: IPCAdvertiseServiceMessage = {
    type: 'advertise-service',
    service: {
      type: 'local',
      name: SERVICE_NAME,
      port: servicePort
    }
  }
  child.send(ipcMessage);
}

const bonjourService = bonjour()

bonjourService.publish({ name: 'WongiTools', type: 'http', port: PORT, protocol: 'tcp' })

const app = express();
const server = http.createServer(app);

interface ServerToClientEvents {
  "heart:bpm": (message: { bpm: number }) => void;
}

type ServerEvent = keyof ServerToClientEvents;

interface ClientToSeverEvents {
  "heart:read:bpm": (message: { bpm: number }) => void;
}

interface InterServerEvents {}

interface SocketData {}

const io = new Server<
  ClientToSeverEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(server);

const cache = new Map<ServerEvent, any>();

io.on("connection", (socket) => {
  logger.info(`[socket.io:main] Client connected: [Socket ${socket.id}]`);

  socket.on('heart:read:bpm', (message) => {
    const eventName: ServerEvent = "heart:bpm";
    if (cache.has(eventName)) {
      const lastMessageSent = cache.get(eventName);
      socket.emit(eventName, lastMessageSent);
      logger.info(`[socket.io:main] Sending last ${eventName} message to new client [${socket.id}]: ${lastMessageSent.bpm} bpm`);
    }
  })
});

app.set("port", PORT);
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

app.get("/ping", (req, res) => {
  logger.info(`[http:main] ping from: ${req.ip}`)
  res.send("pong");
})

app.post("/heart", (req, res) => {
  const message = { bpm: req.body.bpm };
  cache.set("heart:bpm", message);

  const socketCount = io.of("/").sockets.size;

  if (socketCount > 0) {
    logger.info(`[socket.io:main] Broadcasting to ${socketCount} sockets: heart:bpm ${message.bpm} bpm`);
    io.of("/").emit("heart:bpm", message);
  } else {
    logger.info(`[socket.io:main] No listeners. Skipping message: ${message.bpm} bpm`);
  }

  res.send("ok");
});

server.listen(app.get("port"), async () => {
  let port = app.get("port");
  logger.info(`[http:main] Server listening on port ${port}`);
  startServiceBroadcaster(port)
  
});
