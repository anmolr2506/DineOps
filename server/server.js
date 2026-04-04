const express = require("express");
const cors = require("cors");
const http = require('http');
const { Server } = require('socket.io');
require("dotenv").config();

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

app.locals.io = io;

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth.routes');
const sessionRoutes = require('./routes/session.routes');
const categoryRoutes = require('./routes/category.routes');
const variantRoutes = require('./routes/variant.routes');
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api', categoryRoutes);
app.use('/api/variants', variantRoutes);

io.on('connection', (socket) => {
  socket.on('join_session_room', (sessionId) => {
    if (!sessionId) return;
    socket.join(`session_${sessionId}`);
  });
});

app.get("/", (req, res) => {
  res.send("API Running...");
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});