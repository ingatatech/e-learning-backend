import { Server } from "socket.io"
import http from "http"

export const initSocket = (server: http.Server) => {
  const io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:3000",
        "https://e-learning-yixk.onrender.com",
      ],
      credentials: true,
    },
  })

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id)

    socket.on("join", ({ userId, orgId }) => {
      if (userId) socket.join(`user-${userId}`)
      if (orgId) socket.join(`organization-${orgId}`)
    })

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id)
    })
  })

  return io
}
