$ErrorActionPreference = "Stop"

# Usage:
#   powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File web/scripts/apply_users_sql.ps1 -Pat "<PAT>" -Ref "<PROJECT_REF>"

param(
  [Parameter(Mandatory=$true)][string]$Pat,
  [Parameter(Mandatory=$true)][string]$Ref
)

$sqlPath = "web/supabase/sql/001_users.sql"
if (!(Test-Path $sqlPath)) {
  Write-Error "SQL file not found: $sqlPath"
  exit 1
}

$query = Get-Content $sqlPath -Raw
$body = @{ query = $query } | ConvertTo-Json -Compress

Invoke-RestMethod `
  -Method Post `
  -ContentType 'application/json' `
  -Headers @{ Authorization = "Bearer $Pat" } `
  -Body $body `
  -Uri "https://api.supabase.com/v1/projects/$Ref/database/query"

Write-Host "Applied SQL from $sqlPath"


