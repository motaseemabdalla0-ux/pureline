Write-Output "--- cloudflared process ---"
Get-Process -Name cloudflared -ErrorAction SilentlyContinue | Select-Object Id,StartTime | Format-Table -AutoSize

Write-Output "--- tunnel_url.txt ---"
$tunnelUrl = Get-Content C:\Users\motas\PureLine\tunnel_url.txt -ErrorAction SilentlyContinue
Write-Output $tunnelUrl

Write-Output "--- homepage ---"
try {
    $r = Invoke-WebRequest -Uri "$tunnelUrl/" -UseBasicParsing -TimeoutSec 20
    Write-Output "homepage: $($r.StatusCode)"
} catch {
    Write-Output "homepage ERROR: $($_.Exception.Message)"
}

Write-Output "--- /chat/ ---"
try {
    $r2 = Invoke-WebRequest -Uri "$tunnelUrl/chat/" -UseBasicParsing -TimeoutSec 20
    Write-Output "chat: $($r2.StatusCode)"
} catch {
    Write-Output "chat ERROR: $($_.Exception.Message)"
}

Write-Output "--- /api/health ---"
try {
    $r3 = Invoke-WebRequest -Uri "$tunnelUrl/api/health" -UseBasicParsing -TimeoutSec 20
    Write-Output "api/health: $($r3.StatusCode) $($r3.Content)"
} catch {
    Write-Output "api/health ERROR: $($_.Exception.Message)"
}
