$tunnelUrl = Get-Content C:\Users\motas\PureLine\tunnel_url.txt
$routes = @("/platform/login", "/platform/dashboard", "/platform/farms", "/api/platform/farms")
foreach ($r in $routes) {
    try {
        $resp = Invoke-WebRequest -Uri "$tunnelUrl$r" -UseBasicParsing -TimeoutSec 15
        Write-Output "$r -> $($resp.StatusCode)"
    } catch {
        Write-Output "$r -> ERROR $($_.Exception.Message)"
    }
}
