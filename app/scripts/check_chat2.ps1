try {
    $r = Invoke-WebRequest -Uri http://localhost:8080/chat/ -UseBasicParsing -TimeoutSec 10
    Write-Output "chat/ status: $($r.StatusCode)"
} catch {
    Write-Output "chat/ error: $($_.Exception.Message)"
}
try {
    $r2 = Invoke-WebRequest -Uri http://localhost:8080/chat -UseBasicParsing -TimeoutSec 10 -MaximumRedirection 0 -ErrorAction Stop
    Write-Output "chat (no redirect) status: $($r2.StatusCode)"
} catch {
    Write-Output "chat (no redirect) result: $($_.Exception.Response.StatusCode.value__)"
}
