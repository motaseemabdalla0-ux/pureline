$loginBody = @{ username = "admin"; password = "Pureline@2026" } | ConvertTo-Json
$login = Invoke-RestMethod -Uri http://localhost:8080/api/platform/auth/login -Method POST -ContentType 'application/json' -Body $loginBody
Write-Output "LOGIN:"; $login | ConvertTo-Json

$farms = Invoke-RestMethod -Uri http://localhost:8080/api/platform/farms -Method GET
Write-Output "FARMS COUNT: $($farms.Count)"
$farms | Select-Object farm_code, name, region | Format-Table -AutoSize

$headers = @{ Authorization = "Bearer $($login.token)" }
$dash = Invoke-RestMethod -Uri http://localhost:8080/api/platform/ops/dashboard -Method GET -Headers $headers
Write-Output "OPS DASHBOARD:"; $dash | ConvertTo-Json

$pestTypes = Invoke-RestMethod -Uri http://localhost:8080/api/platform/pests/types -Method GET
Write-Output "PEST TYPES COUNT: $($pestTypes.Count)"
