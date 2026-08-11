#!/bin/bash
cd "$(dirname "$0")"
echo "每日讀經網站啟動中：http://localhost:8000"
python3 -m http.server 8000
