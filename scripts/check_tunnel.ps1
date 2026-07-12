$tunnelUrl = Get-Content C:\Users\motas\PureLine\tunnel_url.txt
Write-Output "URL: $tunnelUrl"
try {
    $r = Invoke-WebRequest -Uri "$tunnelUrl/services" -UseBasicParsing -TimeoutSec 20
    Write-Output "tunnel /services -> $($r.StatusCode)"
} catch {
    Write-Output "tunnel /services -> ERROR $($_.Exception.Message)"
}
try {
    $r2 = Invoke-WebRequest -Uri "$tunnelUrl/api/health" -UseBasicParsing -TimeoutSec 20
    Write-Output "tunnel /api/health -> $($r2.StatusCode) $($r2.Content)"
} catch {
    Write-Output "tunnel /api/health -> ERROR $($_.Exception.Message)"
}
