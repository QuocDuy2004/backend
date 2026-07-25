$ErrorActionPreference = 'Stop'

$project = 'backend-5nxv'
$envFile = Join-Path $PSScriptRoot '..\.env.vercel.local'

if (-not (Test-Path -LiteralPath $envFile)) {
  throw "Missing env file: $envFile"
}

$pairs = @{}
Get-Content -LiteralPath $envFile | ForEach-Object {
  $line = $_.Trim()
  if (-not $line -or $line.StartsWith('#')) { return }
  if ($line -notmatch '^(.*?)=(.*)$') { return }
  $pairs[$matches[1]] = $matches[2]
}

$required = @(
  'NODE_ENV',
  'APP_URL',
  'FRONTEND_URL',
  'JWT_SECRET'
)

$errors = @()

foreach ($key in $required) {
  if (-not $pairs.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($pairs[$key])) {
    $errors += "Missing required value for $key"
  }
  elseif ($pairs[$key] -match 'change-this|xxx\.aivencloud\.com|your-vercel-domain') {
    $errors += "Placeholder value still present for $key"
  }
}

$hasDatabaseUrl = $pairs.ContainsKey('DATABASE_URL') -and -not [string]::IsNullOrWhiteSpace($pairs['DATABASE_URL']) -and $pairs['DATABASE_URL'] -notmatch 'change-this'
$splitDbKeys = @('DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_DATABASE', 'DB_SSL')
$hasSplitDb = $true
foreach ($key in $splitDbKeys) {
  if (-not $pairs.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($pairs[$key]) -or $pairs[$key] -match 'change-this|xxx\.aivencloud\.com|your-vercel-domain') {
    $hasSplitDb = $false
  }
}

if (-not $hasDatabaseUrl -and -not $hasSplitDb) {
  $errors += 'Provide either DATABASE_URL or the split DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_DATABASE/DB_SSL fields.'
}

if ($errors.Count -gt 0) {
  throw ($errors -join "`n")
}

$envKeys = @(
  'NODE_ENV',
  'APP_URL',
  'FRONTEND_URL',
  'EXTRA_CORS_ORIGINS',
  'VITE_API_BASE_URL',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'DATABASE_URL',
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_DATABASE',
  'DB_SSL',
  'DB_CONNECTION_LIMIT',
  'GEMINI_API_KEY',
  'VNPAY_TMN_CODE',
  'VNPAY_HASH_SECRET',
  'VNPAY_URL',
  'VNPAY_RETURN_URL',
  'MOMO_PARTNER_CODE',
  'MOMO_ACCESS_KEY',
  'MOMO_SECRET_KEY',
  'MOMO_ENDPOINT',
  'MOMO_RETURN_URL',
  'MOMO_IPN_URL'
)

foreach ($key in $envKeys) {
  $value = if ($pairs.ContainsKey($key)) { $pairs[$key] } else { '' }
  if ($hasDatabaseUrl -and $splitDbKeys -contains $key) { continue }
  if (-not $hasDatabaseUrl -and $key -eq 'DATABASE_URL') { continue }
  & npx.cmd vercel env add $key production --project $project --force --value $value --yes
}

Write-Host "Done. Re-deploy with: npx vercel deploy --prod --yes"
