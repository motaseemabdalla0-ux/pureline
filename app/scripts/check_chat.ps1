try {
    $r = Invoke-WebRequest -Uri http://localhost:8080/chat -UseBasicParsing -TimeoutSec 10
    Write-Output "chat status: $($r.StatusCode)"
} catch {
    Write-Output "chat error: $($_.Exception.Message)"
}
