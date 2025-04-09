import express, { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from 'dotenv';
import { connectDB } from "./config/db";

import { connectRedis } from "../src/config/redisConfig";

import user from "../src/Routes/patient/patientApi";
// import doctorRoutes from "../src/Routes/doctor/doctor"; 
// import adminRoutes from "./Routes/admin/admin";
import { errorHandler } from "./middleware/errorMiddleware";

import { morganLogger } from './middleware/loggerMiddleware';

dotenv.config();


      const app: Application = express();


    app.use(express.json());
    app.use(cookieParser()); // For parsing cookies (refresh token)

                app.use(cors({
                  origin: process.env.FRONTEND_URL || "http://localhost:3000",
                  credentials: true, 
                  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                  allowedHeaders: ['Content-Type', 'Authorization']
                }))

          connectDB();
        connectRedis();

                if (process.env.NODE_ENV === 'production') {
                  app.use(morganLogger.prod);
                }else {
                  app.use(morganLogger.dev);
                   // (enable when development)
                  //app.use(morganLogger.debug);
                }
      
            app.use("/api", user);
          // app.use("/api/doctor", doctorRoutes);
          // app.use("/api/admin", adminRoutes);


app.use(errorHandler);


const PORT = process.env.PORT
app.listen(PORT, () => console.log(`==>>>> Server running on port ${PORT}`));


process.on('unhandledRejection', (err: Error) => {
  console.log(`Error: ${err.message}`);
  
  process.exit(1);
});