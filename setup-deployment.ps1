# XAMS Deployment Setup Script
# This script helps you set up the environment for deployment

Write-Host "🚀 XAMS Deployment Setup" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green

# Check if .env file exists
if (Test-Path ".env") {
    Write-Host "⚠️  .env file already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "❌ Setup cancelled." -ForegroundColor Red
        exit
    }
}

# Copy the template
Write-Host "📋 Creating .env file from template..." -ForegroundColor Blue
Copy-Item ".env.deployment" ".env"

Write-Host "✅ .env file created successfully!" -ForegroundColor Green
Write-Host ""

Write-Host "🔧 Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit the .env file and update the following required values:"
Write-Host "   - OPEN_ROUTER_API_KEY (for AI features)"
Write-Host "   - JWT_SECRET (use a strong, random string)"
Write-Host "   - EMAIL_* settings (if you want email notifications)"
Write-Host ""
Write-Host "2. Start the deployment:"
Write-Host "   docker-compose -f compose.yml up -d"
Write-Host ""
Write-Host "3. Check the status:"
Write-Host "   docker-compose -f compose.yml ps"
Write-Host ""

Write-Host "📝 Optional configurations:" -ForegroundColor Yellow
Write-Host "   - DB_CONN: Use external MongoDB instead of local container"
Write-Host "   - MODE: Set to 'dev' for development mode"
Write-Host "   - RSA keys: Use RSA authentication instead of JWT"
Write-Host ""

Write-Host "🌐 Default URLs after startup:" -ForegroundColor Magenta
Write-Host "   - Frontend: http://localhost:8080"
Write-Host "   - Backend API: http://localhost:3000"
Write-Host "   - MongoDB: localhost:27017"
Write-Host ""

Write-Host "For more information, check the README or contact the development team." -ForegroundColor Gray
