const express = require("express");
const cors = require("cors");
const http = require('http');
const jwt = require('jsonwebtoken');
require("dotenv").config();
const { Server } = require('socket.io');
const { setIo } = require('./realtime');

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true,
}));
app.use(express.json());

const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

const dashboardRoutes = require('./routes/dashboard.routes');
app.use('/api/dashboard', dashboardRoutes);

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173'],
    methods: ['GET', 'POST', 'PATCH'],
    credentials: true,
  },
});

setIo(io);

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next();
  }

  try {
    socket.data.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    next(new Error('Invalid socket token'));
  }
});

io.on('connection', (socket) => {
  const sessionId = socket.handshake.auth?.sessionId || socket.handshake.query?.sessionId;

  if (sessionId) {
    socket.join(`session:${sessionId}`);
  }

  socket.on('dashboard:join', ({ sessionId: joinedSessionId }) => {
    if (joinedSessionId) {
      socket.join(`session:${joinedSessionId}`);
    }
  });

  socket.on('dashboard:leave', ({ sessionId: leftSessionId }) => {
    if (leftSessionId) {
      socket.leave(`session:${leftSessionId}`);
    }
  });
});

app.get("/", (req, res) => {
  res.send("API Running...");
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});