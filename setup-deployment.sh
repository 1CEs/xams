#!/bin/bash

# XAMS Deployment Setup Script
# This script helps you set up the environment for deployment

echo "🚀 XAMS Deployment Setup"
echo "========================="

# Check if .env file exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " overwrite
    if [[ ! "$overwrite" =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled."
        exit 1
    fi
fi

# Copy the template
echo "📋 Creating .env file from template..."
cp .env.deployment .env

echo "✅ .env file created successfully!"
echo ""

echo "🔧 Next steps:"
echo "1. Edit the .env file and update the following required values:"
echo "   - OPEN_ROUTER_API_KEY (for AI features)"
echo "   - JWT_SECRET (use a strong, random string)"
echo "   - EMAIL_* settings (if you want email notifications)"
echo ""
echo "2. Start the deployment:"
echo "   docker-compose -f compose.yml up -d"
echo ""
echo "3. Check the status:"
echo "   docker-compose -f compose.yml ps"
echo ""

echo "📝 Optional configurations:"
echo "   - DB_CONN: Use external MongoDB instead of local container"
echo "   - MODE: Set to 'dev' for development mode"
echo "   - RSA keys: Use RSA authentication instead of JWT"
echo ""

echo "🌐 Default URLs after startup:"
echo "   - Frontend: http://localhost:8080"
echo "   - Backend API: http://localhost:3000"
echo "   - MongoDB: localhost:27017"
echo ""

echo "For more information, check the README or contact the development team."
