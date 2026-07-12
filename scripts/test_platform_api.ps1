$loginBody = @{ password = "pureline-admin-2026" } | ConvertTo-Json
$login = Invoke-RestMethod -Uri http://localhost:8080/api/platform/admin/login -Method POST -ContentType 'application/json' -Body $loginBody
Write-Output "LOGIN:"
$login | ConvertTo-Json

$reqBody = @{
    customer = @{
        full_name = "Test User"
        email     = "test@example.com"
        phone     = "0500000000"
    }
    farm_name      = "Test Farm"
    farm_location  = "AlUla"
    farm_size      = "50 ha"
    crop_type      = "Dates"
    service_slug   = "ndvi-monitoring"
    service_name   = "NDVI Monitoring"
    description    = "Need NDVI monitoring"
    priority       = "normal"
} | ConvertTo-Json

$req = Invoke-RestMethod -Uri http://localhost:8080/api/platform/requests -Method POST -ContentType 'application/json' -Body $reqBody
Write-Output "REQUEST CREATED:"
$req | ConvertTo-Json

$headers = @{ Authorization = "Bearer $($login.token)" }
$kpis = Invoke-RestMethod -Uri http://localhost:8080/api/platform/admin/kpis -Method GET -Headers $headers
Write-Output "KPIS:"
$kpis | ConvertTo-Json

$lookup = Invoke-RestMethod -Uri "http://localhost:8080/api/platform/requests/lookup?email=test@example.com" -Method GET
Write-Output "LOOKUP:"
$lookup | ConvertTo-Json -Depth 5
