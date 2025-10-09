#!/bin/bash
# Deployment Platform Mode Selector Script

echo "=================================="
echo "DEPLOYMENT PLATFORM MODE SELECTOR"
echo "=================================="

echo "Current Environment:"
echo "NODE_ENV: ${NODE_ENV:-development}"
echo "MOCK_MODE: ${MOCK_MODE:-false}"
echo "PLATFORM_PROVIDER: ${PLATFORM_PROVIDER:-dokku}"
echo

echo "Choose deployment mode:"
echo "1) Mock Mode (Fast frontend development)"
echo "2) Real Mode (Production deployment)"
echo "3) Heroku Provider"
echo "4) Vercel Provider"
echo "5) Exit"
echo

read -p "Enter your choice [1-5]: " choice

case $choice in
  1)
    echo "Setting up MOCK MODE..."
    export NODE_ENV=development
    export MOCK_MODE=true
    export PLATFORM_PROVIDER=dokku
    echo "✅ Mock mode enabled"
    echo "🚀 Starting server in mock mode..."
    npm run dev
    ;;
  2)
    echo "Setting up REAL MODE with Dokku..."
    export NODE_ENV=production
    export MOCK_MODE=false
    export PLATFORM_PROVIDER=dokku
    echo "✅ Real mode with Dokku enabled"
    echo "🚀 Starting server in real mode..."
    npm start
    ;;
  3)
    echo "Setting up REAL MODE with Heroku..."
    export NODE_ENV=production
    export MOCK_MODE=false
    export PLATFORM_PROVIDER=heroku
    echo "✅ Real mode with Heroku enabled"
    echo "🚀 Starting server in Heroku mode..."
    npm start
    ;;
  4)
    echo "Setting up REAL MODE with Vercel..."
    export NODE_ENV=production
    export MOCK_MODE=false
    export PLATFORM_PROVIDER=vercel
    echo "✅ Real mode with Vercel enabled"
    echo "🚀 Starting server in Vercel mode..."
    npm start
    ;;
  5)
    echo "Exiting..."
    exit 0
    ;;
  *)
    echo "❌ Invalid choice. Please select 1-5."
    exit 1
    ;;
esac