$ErrorActionPreference = 'Stop'
Write-Output ('health: ' + (Invoke-WebRequest -UseBasicParsing http://localhost:8080/api/health).Content)
$r = Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/platform/auth/login -ContentType 'application/json' -Body '{"username":"admin","password":"Pureline@2026"}'
Write-Output ('login-as: ' + ($r.user | ConvertTo-Json -Compress))
$H = @{ Authorization = 'Bearer ' + $r.token }
$u = Invoke-RestMethod -Uri http://localhost:8080/api/platform/users -Headers $H
Write-Output ('users-count: ' + $u.Count)
Write-Output ('first-user: ' + ($u[0] | ConvertTo-Json -Compress))
# create + deactivate + reactivate a smoke-test user
$name = 'smoketest_' + (Get-Random -Maximum 99999)
$body = @{ username = $name; password = 'Test@12345'; full_name = 'Smoke Test'; role = 'customer' } | ConvertTo-Json -Compress
$c = Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/platform/users -Headers $H -ContentType 'application/json' -Body $body
Write-Output ('created: ' + $c.username + ' active=' + $c.is_active)
$d = Invoke-RestMethod -Method Patch -Uri ("http://localhost:8080/api/platform/users/" + $c.id) -Headers $H -ContentType 'application/json' -Body '{"is_active": false}'
Write-Output ('deactivated: active=' + $d.is_active)
# deactivated user must not be able to log in
try {
  Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/platform/auth/login -ContentType 'application/json' -Body ('{"username":"' + $name + '","password":"Test@12345"}') | Out-Null
  Write-Output 'FAIL: deactivated user logged in'
} catch { Write-Output 'deactivated-login-blocked: OK' }
# route checks
$routes = @('/', '/platform/login', '/platform/dashboard', '/platform/farms', '/platform/users', '/ndvi-analytics', '/platform/irrigation', '/services', '/chat/')
foreach ($p in $routes) {
  $code = (Invoke-WebRequest -UseBasicParsing ("http://localhost:8080" + $p)).StatusCode
  Write-Output ("route " + $p + " -> " + $code)
}
