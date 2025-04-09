import { Elysia } from 'elysia';
import { LoggerService } from '../../core/logger/logger.service';

export const requestLoggerMiddleware = new Elysia()
  .onRequest(({ request }) => {
    // Store the start time in the request object
    const startTime = Date.now();
    // @ts-ignore - Adding custom property to request
    request.startTime = startTime;
    
    // Get client IP address
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // Get request details
    const method = request.method;
    const url = new URL(request.url).pathname;
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Log the request
    LoggerService.getInstance().info('Incoming request', {
      method,
      url,
      ip,
      userAgent,
    });
  }); 