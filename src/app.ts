import  express,{ Application } from "express"
const app:Application = express()

import cors from "cors"

import { connectDB } from "./config/db"

import user from "./Routes/user"

import dotenv from 'dotenv';
 
dotenv.config();



app.use(express.json());

app.use(cors({
   origin: "http://localhost:3000/",  
   credentials: true
}));

connectDB() 



app.use("/api",user)


const PORT = process.env.PORT|| 5000
app.listen(PORT, () => console.log(`==>>>> Server running on port ${PORT}`));





