$routes = @(
    "/", "/services", "/services/ndvi-monitoring", "/request-service", "/dashboard",
    "/ndvi-analytics", "/satellite-intelligence", "/farm-monitoring", "/farm-reports",
    "/consultancy", "/admin", "/chat", "/api/health"
)
foreach ($r in $routes) {
    try {
        $resp = Invoke-WebRequest -Uri "http://localhost:8080$r" -UseBasicParsing -TimeoutSec 10
        Write-Output "$r -> $($resp.StatusCode)"
    } catch {
        Write-Output "$r -> ERROR $($_.Exception.Message)"
    }
}

Write-Output "---TUNNEL---"
$tunnelUrl = Get-Content C:\Users\motas\PureLine\tunnel_url.txt -ErrorAction SilentlyContinue
Write-Output "tunnel_url.txt: $tunnelUrl"
if ($tunnelUrl) {
    try {
        $resp = Invoke-WebRequest -Uri "$tunnelUrl/services" -UseBasicParsing -TimeoutSec 15
        Write-Output "tunnel /services -> $($resp.StatusCode)"
    } catch {
        Write-Output "tunnel /services -> ERROR $($_.Exception.Message)"
    }
}
