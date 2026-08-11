#!/bin/bash
cd "$(dirname "$0")"
echo "每日读经网站启动中：http://localhost:8000"
python3 -m http.server 8000
