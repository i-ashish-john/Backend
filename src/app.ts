import express, { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from 'dotenv';
import { connectDB } from "./config/db";
import userRoutes from "./Routes/patient/user";
// import doctorRoutes from "../src/Routes/doctor/doctor"; 
// import adminRoutes from "./Routes/admin/admin";
import { errorHandler } from "./middleware/errorMiddleware";


dotenv.config();


const app: Application = express();


app.use(express.json());
app.use(cookieParser()); // For parsing cookies (refresh token)


app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true, 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


connectDB();


app.use("/api", userRoutes);
// app.use("/api/doctor", doctorRoutes);
// app.use("/api/admin", adminRoutes);


app.use(errorHandler);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`==>>>> Server running on port ${PORT}`));


process.on('unhandledRejection', (err: Error) => {
  console.log(`Error: ${err.message}`);
  
  process.exit(1);
});