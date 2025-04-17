import morgan, { StreamOptions } from 'morgan';
import { Request, Response } from 'express';

const stream: StreamOptions = {
    write: (message) => console.log(message.trim()),
};

morgan.token('endpoint', (req: Request) => `${req.method} ${req.originalUrl}`);

// Morgan middleware configuration
const morganMiddleware = morgan(':endpoint :status :response-time ms', { stream });

export default morganMiddleware;