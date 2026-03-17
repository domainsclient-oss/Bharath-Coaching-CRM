#!/bin/bash
echo "Building project..."
npm run build
echo "Deploying to Firebase..."
firebase deploy --only hosting
echo "Deployment complete!"
