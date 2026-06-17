import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

// Route & Controller Imports
import qrRoutes from './features/qr/routes/qr.routes.js';
import { loginAdmin, logoutAdmin } from './features/qr/controller/auth.controller.js';
import { seedDatabase } from './seed.js';

// Load env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;


// FRONTEND_URL may contain one or more comma-separated origins. Trailing
// slashes are stripped because the browser's Origin header never has one, and
// the cors package matches origins by exact string.
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser clients (no Origin header) and any whitelisted origin.
    // Refuse others without throwing: the browser blocks the response (no
    // Allow-Origin header) but we avoid emitting a 500 for every bad origin.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true, // CRITICAL: This allows the HttpOnly cookie to be sent to the frontend
}));
app.use(express.json());
app.use(cookieParser());

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: "Too many requests, please try again later." }
});
app.use('/api/', apiLimiter);


const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI is missing in .env file");
    }
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};



// Auth Routes (Public)
app.post('/api/auth/login', loginAdmin);
app.post('/api/auth/logout', logoutAdmin);

// QR Routes 
app.use('/api/qr', qrRoutes);


app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'QR service is running perfectly' });
});


// Connect to the database first, then start listening so the server
// never accepts requests before MongoDB is ready.
connectDB().then(async () => {
  // Optional one-shot seeding on boot, using THIS host's env vars (e.g. Render).
  // Set RUN_SEED=true, deploy once, then set it back to false and redeploy.
  if (process.env.RUN_SEED === 'true') {
    console.log('RUN_SEED=true -> seeding database from environment...');
    try {
      await seedDatabase();
    } catch (err) {
      console.error('Seed-on-boot failed:', err);
    }
  }

  app.listen(PORT, () => {
    console.log(`QR Scanner service running on http://localhost:${PORT}`);
  });
});