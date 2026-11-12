echo "🚀 Starting deployment..."

cd /home/backend || exit

echo "🔄 Pulling latest code..."
git pull

echo "📦 Installing dependencies..."
npm install --omit=dev
# npm install --production

echo "🔧 Building..."
npm run build 2>/dev/null || echo "No build step."

echo "🔁 Restarting PM2..."
pm2 restart ecosystem.config.js --env production

echo "💾 Saving PM2 state..."
pm2 save

echo "🎉 Deployment complete!"


