require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const discoverRoutes = require("./routes/discover");
const matchingRoutes = require("./routes/matching");
const chatRoutes = require("./routes/chat");
const videoRoutes = require("./routes/videos");
const postRoutes = require("./routes/posts");
const mediaRoutes = require("./routes/media");
const postLikeRoutes = require("./routes/postLikes");
const commentRoutes = require("./routes/comments");
const followRoutes = require("./routes/follow");
const notificationRoutes = require("./routes/notifications");

const app = express();
const server = http.createServer(app);

// SOCKET.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Make Socket.IO available to Express routes later
app.set("io", io);

connectDB();

app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

app.use(express.json());

// API ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/discover", discoverRoutes);
app.use("/api/matching", matchingRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/post-likes", postLikeRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/notifications", notificationRoutes);


// TEST ROUTE
app.get("/", (req, res) => {
  res.json({
    message: "ASK API + Socket.IO is running 🚀",
  });
});

// SOCKET.IO CONNECTION
io.on("connection", (socket) => {
  console.log("ASK user connected:", socket.id);

  // JOIN CHAT ROOM
  socket.on("join_conversation", (conversationId) => {
    if (!conversationId) return;

    socket.join(`conversation_${conversationId}`);

    console.log(
      `Socket ${socket.id} joined conversation ${conversationId}`
    );
  });

  // LEAVE CHAT ROOM
  socket.on("leave_conversation", (conversationId) => {
    if (!conversationId) return;

    socket.leave(`conversation_${conversationId}`);

    console.log(
      `Socket ${socket.id} left conversation ${conversationId}`
    );
  });

  // BROADCAST NEW MESSAGE
  socket.on("send_message", (data) => {
    if (!data || !data.conversationId || !data.message) {
      return;
    }

    io.to(`conversation_${data.conversationId}`).emit(
      "new_message",
      data.message
    );
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    console.log("ASK user disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`ASK API + Socket.IO running on port ${PORT}`);
});