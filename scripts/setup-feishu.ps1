# 一键：列出知识库 / 同步飞书到博客（需先填好 scripts\.env 里的 FEISHU_APP_SECRET）
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "已创建 .env，请先编辑 FEISHU_APP_SECRET 后重新运行本脚本" -ForegroundColor Yellow
    exit 1
}

$secret = (Get-Content .env | Where-Object { $_ -match '^FEISHU_APP_SECRET=' }) -replace '^FEISHU_APP_SECRET=', ''
if ($secret -match '请在这里') {
    Write-Host @"

请打开 scripts\.env ，把这一行改成你的 App Secret：
  FEISHU_APP_SECRET=（从飞书开放平台 Blob 应用 → 凭证与基础信息 复制）

保存后重新运行:  .\setup-feishu.ps1

"@ -ForegroundColor Yellow
    exit 1
}

Write-Host "=== 1. 查询知识库 space_id ===" -ForegroundColor Cyan
node feishu-list-spaces.js

Write-Host "=== 2. 从飞书同步到 content/docs ===" -ForegroundColor Cyan
node sync-feishu.js

Write-Host "`n完成。可在 mysite 目录运行: hugo server -D" -ForegroundColor Green
