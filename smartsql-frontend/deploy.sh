#!/bin/bash

echo "🚀 开始前端构建..."
npm run build || { echo "❌ 构建失败"; exit 1; }

echo "🌐 更新 Firebase 托管..."
firebase deploy --only hosting