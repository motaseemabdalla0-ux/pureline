$routes = @(
    "/", "/chat/", "/api/health",
    "/services", "/request-service", "/dashboard", "/admin",
    "/ndvi-analytics", "/satellite-intelligence", "/farm-monitoring", "/farm-reports", "/consultancy",
    "/platform/login", "/platform/dashboard", "/platform/farms", "/platform/operations",
    "/platform/pests", "/platform/irrigation", "/platform/assets", "/platform/workforce", "/platform/reports"
)
foreach ($r in $routes) {
    try {
        $resp = Invoke-WebRequest -Uri "http://localhost:8080$r" -UseBasicParsing -TimeoutSec 10
        Write-Output "$r -> $($resp.StatusCode)"
    } catch {
        Write-Output "$r -> ERROR $($_.Exception.Message)"
    }
}
Write-Output "--- backend logs (seed) ---"
docker logs deployment-chatbot-backend-1 --tail 60 2>&1 | Select-String -Pattern "seed|Pureline@2026|startup|error" -CaseSensitive:$false
