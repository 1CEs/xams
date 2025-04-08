import { Elysia } from "elysia";
import { appendFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { securityPatterns } from "./security-patterns";

function detectSecurityThreats(url: string, body: any, headers: Headers): string[] {
    const threats: string[] = [];
    const testString = `${url}${JSON.stringify(body)}${JSON.stringify(Object.fromEntries(headers))}`.toLowerCase();

    // Check for XSS attempts
    if (securityPatterns.xss.some(pattern => pattern.test(testString))) {
        threats.push('XSS');
    }

    // Check for SQL injection attempts
    if (securityPatterns.sqlInjection.some(pattern => pattern.test(testString))) {
        threats.push('SQL Injection');
    }

    // Check for path traversal attempts
    if (securityPatterns.pathTraversal.some(pattern => pattern.test(testString))) {
        threats.push('Path Traversal');
    }

    return threats;
}

export const loggerMiddleware = new Elysia()
  .onBeforeHandle(({ request }) => {
    console.log(request.url);
  })
  .derive(async ({ request }) => {
    const startTime = Date.now();
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // Clone the request to read the body
    let body = {};
    try {
        const clonedRequest = request.clone();
        body = await clonedRequest.json().catch(() => ({}));
    } catch {
        // If body can't be parsed as JSON, ignore it
    }

    const threats = detectSecurityThreats(request.url, body, request.headers);
    
    return {
      startTime,
      ip,
      threats
    };
  })
  .onAfterHandle(({ request, set, startTime, ip, threats }: { request: Request; set: any; startTime: number; ip: string; threats: string[] }) => {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    let logMessage = `[${new Date().toISOString()}] ${ip} - ${request.method} ${request.url} - Status: ${set.status} - Response Time: ${responseTime}ms`;
    
    // Add security threat information if any threats were detected
    if (threats.length > 0) {
        logMessage += `\n⚠️ SECURITY ALERT - Detected: ${threats.join(', ')}\n`;
    }
    
    logMessage += '\n';
    
    // Log to console
    console.log(join(process.cwd(), "logs"));
    
    // Ensure logs directory exists
    const logsDir = join(process.cwd(), "logs");
    if (!existsSync(logsDir)) {
        mkdirSync(logsDir, { recursive: true });
    }
    
    // Write to log file
    try {
        appendFileSync(join(logsDir, "app.log"), logMessage);
    } catch (error) {
        console.error("Failed to write to log file:", error);
    }
  }); 