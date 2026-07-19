$ErrorActionPreference = 'Stop'
$r = Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/platform/auth/login -ContentType 'application/json' -Body '{"username":"admin","password":"Pureline@2026"}'
$H = @{ Authorization = 'Bearer ' + $r.token }
# Regions
$regions = Invoke-RestMethod -Uri http://localhost:8080/api/platform/regions
Write-Output ('regions: ' + $regions.Count + ' first=' + $regions[0].name + ' farms=' + $regions[0].farm_count)
# Operators
$ops = Invoke-RestMethod -Uri http://localhost:8080/api/platform/operators
Write-Output ('operators: ' + $ops.Count + ' first=' + $ops[0].full_name + ' farms=' + ($ops[0].farm_codes -join ','))
# Traps
$traps = Invoke-RestMethod -Uri http://localhost:8080/api/platform/traps-registry
Write-Output ('traps: ' + $traps.Count + ' first=' + $traps[0].trap_code + ' lat=' + $traps[0].lat)
$td = Invoke-RestMethod -Uri http://localhost:8080/api/platform/traps-registry/dashboard
Write-Output ('traps-dash: total=' + $td.total_traps + ' active=' + $td.by_status.active)
# Recycling
$st = Invoke-RestMethod -Uri http://localhost:8080/api/platform/recycling/stations
Write-Output ('stations: ' + $st.Count + ' first=' + $st[0].station_code)
# write intake
$intake = Invoke-RestMethod -Method Post -Uri ("http://localhost:8080/api/platform/recycling/stations/" + $st[0].id + "/intakes") -Headers $H -ContentType 'application/json' -Body '{"material":"palm_fronds","quantity_kg":250,"source_farm_code":"UDH-000338"}'
Write-Output ('intake-logged: ' + $intake.quantity_kg + ' kg')
$rd = Invoke-RestMethod -Uri http://localhost:8080/api/platform/recycling/dashboard
Write-Output ('recycling-dash: month_kg=' + $rd.intake_month_kg)
# create+patch region cycle
$nr = Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/platform/regions -Headers $H -ContentType 'application/json' -Body '{"code":"TST","name":"Smoke Region"}'
$null = Invoke-RestMethod -Method Patch -Uri ("http://localhost:8080/api/platform/regions/" + $nr.id) -Headers $H -ContentType 'application/json' -Body '{"is_active": false}'
Write-Output 'region create+deactivate: OK'
# routes
$routes = @('/platform/traps','/platform/recycling','/platform/regions','/platform/operators','/platform/users','/platform/dashboard','/ndvi-analytics','/')
foreach ($p in $routes) {
  $code = (Invoke-WebRequest -UseBasicParsing ("http://localhost:8080" + $p)).StatusCode
  Write-Output ("route " + $p + " -> " + $code)
}
