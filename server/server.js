const express = require("express");
const cors = require("cors");
const http = require('http');
const path = require('path');
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
const dashboardRoutes = require('./routes/dashboard.routes');
const userRoutes = require('./routes/user.routes');
const floorPlanRoutes = require('./routes/floorPlan.routes');
const customerReservationRoutes = require('./routes/customerReservation.routes');
const customerOrderRoutes = require('./routes/customerOrder.routes');
const posTerminalRoutes = require('./routes/posTerminal.routes');
const paymentRoutes = require('./routes/payment.routes');
const kitchenRoutes = require('./routes/kitchen.routes');
const pdfRoutes = require('./routes/pdf.routes');
const restaurantConfigRoutes = require('./routes/restaurantConfig.routes');
const { cleanupExpiredReservationsAndHolds } = require('./services/customerReservation.service');
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api', categoryRoutes);
app.use('/api/variants', variantRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api', floorPlanRoutes);
app.use('/api', customerReservationRoutes);
app.use('/api', customerOrderRoutes);
app.use('/api', posTerminalRoutes);
app.use('/api', paymentRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api', pdfRoutes);
app.use('/api', restaurantConfigRoutes);
app.use('/generated', express.static(path.join(__dirname, 'generated')));

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
const RESERVATION_CLEANUP_INTERVAL_MS = 30000;

setInterval(async () => {
  try {
    await cleanupExpiredReservationsAndHolds(io);
  } catch (error) {
    console.error('Reservation cleanup failed:', error.message);
  }
}, RESERVATION_CLEANUP_INTERVAL_MS);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});