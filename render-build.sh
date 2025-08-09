#!/bin/bash

echo "🚀 Starting GuardianChain Full Stack Build..."

# Install API dependencies
echo "📦 Installing API dependencies..."
cd api
npm ci --only=production
cd ..

# Install Frontend dependencies
echo "📦 Installing Frontend dependencies..."
cd frontend
npm ci

# Build frontend for production
echo "🏗️ Building frontend..."
npm run build

# Move build files to API public directory for serving
echo "📁 Moving frontend build to API public directory..."
cd ..
mkdir -p api/public
cp -r frontend/dist/* api/public/

echo "✅ Build completed successfully!"
echo "📋 Build artifacts:"
echo "   - API server: /api"
echo "   - Frontend build: /api/public"
echo "   - Ready for single-service deployment!"
