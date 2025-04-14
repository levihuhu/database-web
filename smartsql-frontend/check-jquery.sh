#!/bin/bash

echo "🔍 正在扫描项目中是否使用 jQuery 或基于 jQuery 的插件..."

echo "📦 1. 检查 package.json 中是否依赖了 jQuery："
grep -i '"jquery"' package.json || echo "✅ 未显式安装 jQuery"

echo ""
echo "📁 2. 扫描 src/ 目录中是否使用了 $ 或 jQuery："
grep -rE '\$\(.*\)' src/ --include=\*.{js,jsx,ts,tsx} || echo "✅ 未发现直接使用 $()"

echo ""
echo "📁 3. 检查是否使用了常见 jQuery 插件特征函数（fadeIn, html, append 等）："
grep -rE '\.fadeIn\(|\.html\(|\.append\(|\.css\(|\.ready\(' src/ --include=\*.{js,jsx,ts,tsx} || echo "✅ 未发现可疑 DOM 操作"

echo ""
echo "📄 4. 检查 index.html 中是否引入了 jQuery 脚本："
grep -i 'jquery' index.html || echo "✅ index.html 没有引入 jQuery"

echo ""
echo "🧪 5. 构建产物中是否存在 jQuery 或 $ 全局变量："
grep -rE 'jQuery|\$_|window\.\$' dist/assets/ || echo "✅ 构建产物中未发现可疑 jQuery 残留"

echo ""
echo "🧠 完成扫描。建议尽量避免使用 jQuery 插件，尤其是在 React 项目中。"
