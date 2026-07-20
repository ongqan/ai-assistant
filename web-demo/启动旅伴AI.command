#!/bin/zsh
set -e

SCRIPT_DIR="${0:A:h}"
cd "$SCRIPT_DIR"

if [[ ! -f .env ]]; then
  {
    print -r -- "AI_PROVIDER=mock"
    print -r -- "OPENAI_API_KEY="
    print -r -- "OPENAI_MODEL=gpt-5-mini"
    print -r -- "AMAP_API_KEY="
    print -r -- "PORT=8787"
  } > .env
  echo "已启用无需密钥的演示测试模式。"
fi

if [[ ! -d node_modules ]]; then
  echo "正在安装运行组件，请稍候……"
  npm install
fi

echo "正在启动旅伴 AI……"
(sleep 2; open "http://localhost:8787") &
npm start
