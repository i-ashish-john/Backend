import {createClient} from 'redis';

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  })
  
  redisClient.on('error', (err) => {
    console.error('Redis Connection Error:', err);
  })
  
  redisClient.connect()
  .then(() => console.log('✅ Redis connected'))
  .catch((err) => console.error('❌ Redis connection error', err));
  
const connectRedis = async (): Promise<void> => {
 try {
      console.log('redis connected')
      // await redisClient.connect();
    } catch (error) {
      console.error('Redis Connection Error:', error);
      process.exit(1);
    }

  }
  export { redisClient, connectRedis };
