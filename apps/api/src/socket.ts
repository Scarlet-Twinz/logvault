import { Server } from "socket.io";

export function createSocketServer(httpServer: any) {
  const io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`[socket] Client connected: ${socket.id}`);

    // Worker → API → Dashboard clients
    socket.on("event:processed", (event) => {
      io.emit("event:processed", event);
    });

    socket.on("anomaly:detected", (anomaly) => {
      io.emit("anomaly:detected", anomaly);
    });

    socket.on("disconnect", () => {
      console.log(`[socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}