export const securityPatterns = {
    xss: [
        /<script\b[^>]*>/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /data:\s*text\/html/i
    ],
    sqlInjection: [
        /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
        /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
        /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
        /exec(\s|\+)+(s|x)p\w+/i
    ],
    pathTraversal: [
        /\.\./i,
        /\.\.\\/, 
        /\.\.\//, 
    ]
}; 