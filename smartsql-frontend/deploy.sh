#!/bin/bash

### === CONFIGURATION ===
PROJECT_ID="db-group2-cs5200-25spring"  # ✅ 替换为你自己的 GCP 项目 ID（不需要改）
BUCKET_NAME="smartsql-frontend"         # ✅ 自定义 GCS Bucket 名称（可改）
REGION="us-west2"                        # ✅ 区域与你后端保持一致

echo "🚀 开始前端构建..."
npm run build || { echo "❌ 构建失败"; exit 1; }

echo "📦 检查 GCS bucket 是否存在..."
if gsutil ls -b "gs://$BUCKET_NAME" > /dev/null 2>&1; then
  echo "✅ Bucket 已存在：$BUCKET_NAME"
else
  echo "⚙️  创建 Bucket：$BUCKET_NAME"
  gsutil mb -p "$PROJECT_ID" -l "$REGION" -b on "gs://$BUCKET_NAME"
fi

echo "🌐 设置网站托管属性..."
gsutil web set -m index.html -e 404.html "gs://$BUCKET_NAME"

echo "🔓 设置公开权限（所有用户可访问）..."
gsutil iam ch allUsers:objectViewer "gs://$BUCKET_NAME"

echo "⬆️ 正在上传 dist/ 到 GCS..."
gsutil -o "GSUtil:parallel_process_count=1" rsync -d -r ./dist "gs://$BUCKET_NAME"

echo "✅ 部署完成！访问地址如下："
echo "🔗 https://storage.googleapis.com/$BUCKET_NAME/index.html"
