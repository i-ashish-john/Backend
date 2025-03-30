// db.ts
import mongoose from "mongoose";

export const connectDB = async (): Promise<void> => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string, {
            dbName: "NextAppBackend",
        });
        console.log('✅ MongoDB Connected');
        
        // Only check collections if connection is established
        if (mongoose.connection.db) {
            const collections = await mongoose.connection.db.listCollections().toArray();
            console.log('Available collections:', collections.map(c => c.name));
        }
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        process.exit(1);
    }
};