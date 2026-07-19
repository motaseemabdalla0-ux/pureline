$ErrorActionPreference = 'Stop'
$r = Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/platform/auth/login -ContentType 'application/json' -Body '{"username":"admin","password":"Pureline@2026"}'
$H = @{ Authorization = 'Bearer ' + $r.token }
# 1. create a pest detection -> should generate a notification + audit entry
$pt = Invoke-RestMethod -Uri http://localhost:8080/api/platform/pests/types
$body = '{"farm_code":"UDH-000338","pest_type_id":' + $pt[0].id + ',"risk_level":"high","location_notes":"phase3 smoke"}'
$det = Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/platform/pests/detections -Headers $H -ContentType 'application/json' -Body $body
Write-Output ('detection: ' + $det.detection_id)
# 2. notifications
$n = Invoke-RestMethod -Uri http://localhost:8080/api/platform/notifications -Headers $H
Write-Output ('notifications: ' + $n.Count + ' latest="' + $n[0].title + '" kind=' + $n[0].kind)
$uc = Invoke-RestMethod -Uri http://localhost:8080/api/platform/notifications/unread-count -Headers $H
Write-Output ('unread: ' + $uc.unread)
$null = Invoke-RestMethod -Method Post -Uri ("http://localhost:8080/api/platform/notifications/" + $n[0].id + "/read") -Headers $H
$uc2 = Invoke-RestMethod -Uri http://localhost:8080/api/platform/notifications/unread-count -Headers $H
Write-Output ('unread-after-read: ' + $uc2.unread)
# 3. audit log
$a = Invoke-RestMethod -Uri "http://localhost:8080/api/platform/audit?limit=5" -Headers $H
Write-Output ('audit-entries: ' + $a.Count + ' latest="' + $a[0].action + '" by @' + $a[0].actor)
# 4. enterprise search
$s = Invoke-RestMethod -Uri "http://localhost:8080/api/platform/search?q=UDH" -Headers $H
Write-Output ('search "UDH": ' + $s.total + ' hits, kinds: ' + (($s.hits | ForEach-Object kind | Select-Object -Unique) -join ','))
# 5. boundary editor cycle
$ring = '{"ring":[[26.6970,38.0410],[26.6980,38.0420],[26.6975,38.0430]]}'
$f = Invoke-RestMethod -Method Patch -Uri http://localhost:8080/api/platform/farms/UDH-000338/boundary -Headers $H -ContentType 'application/json' -Body $ring
Write-Output ('boundary-saved: ' + $f.boundary_json.Count + ' points')
$f2 = Invoke-RestMethod -Method Delete -Uri http://localhost:8080/api/platform/farms/UDH-000338/boundary -Headers $H
Write-Output ('boundary-cleared: ' + ($null -eq $f2.boundary_json))
# 6. customer cannot see audit
try {
  $c = Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/platform/auth/login -ContentType 'application/json' -Body '{"username":"customer1","password":"Pureline@2026"}'
  Invoke-RestMethod -Uri http://localhost:8080/api/platform/audit -Headers @{ Authorization = 'Bearer ' + $c.token } | Out-Null
  Write-Output 'FAIL: customer accessed audit'
} catch { Write-Output 'customer-audit-blocked: OK' }
# 7. routes
foreach ($p in @('/platform/notifications','/platform/audit','/platform/search','/platform/traps','/')) {
  Write-Output ("route " + $p + " -> " + (Invoke-WebRequest -UseBasicParsing ("http://localhost:8080" + $p)).StatusCode)
}
