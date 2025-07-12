// middleware/loggerMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { createStream } from 'rotating-file-stream';

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create a rotating write stream for access logs
const accessLogStream = createStream('access.log', {
  interval: '1d', // Rotate daily
  path: logsDir,
  size: '10M', // Rotate when size exceeds 10MB
  compress: 'gzip' // Compress rotated files
});

// Custom token for request body (be careful with sensitive data)
morgan.token('body', (req: Request) => {
  const body = { ...req.body };
  
  // Redact sensitive fields
  if (body.password) body.password = '[REDACTED]';
  if (body.refreshToken) body.refreshToken = '[REDACTED]';
  
  return JSON.stringify(body);
});

// Custom token for error message
morgan.token('error', (req: Request, res: Response) => {
  return res.locals.errorMessage || '';
});

// Custom format for development environment
const developmentFormat = ':method :url :status :response-time ms - :res[content-length] - :body';

// Custom format for production environment (more concise)
const productionFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';

// Middleware to capture error messages for logging
export const errorCaptureMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  
  res.send = function(body: any) {
    try {
      const parsedBody = JSON.parse(body);
      if (!parsedBody.success && parsedBody.message) {
        res.locals.errorMessage = parsedBody.message;
      }
    } catch (error) {
      // Not JSON or parsing failed, continue
    }
    
    return originalSend.call(this, body);
  };
  
  next();
};

// Export different middleware configurations
export const morganLogger = {
  // For development: Log to console with detailed info
  dev: morgan(developmentFormat, {
    skip: (req, res) => res.statusCode < 400
  }),
  
  // For production: Log all requests to file
  prod: morgan(productionFormat, {
    stream: accessLogStream
  }),
  
  // For debugging: Log everything with full details
  debug: [
    errorCaptureMiddleware,
    morgan(':method :url :status :response-time ms - :error', {
      skip: (req, res) => res.statusCode < 400
    })
  ]
};