Get-Process -Name cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
Start-Process -FilePath "cloudflared" -ArgumentList "tunnel --url http://localhost:8080" -WindowStyle Hidden -RedirectStandardError C:\Users\motas\PureLine\cloudflared.log
Start-Sleep -Seconds 15
$log = Get-Content C:\Users\motas\PureLine\cloudflared.log -Raw
if ($log -match "https://[a-zA-Z0-9\-]+\.trycloudflare\.com/?\s*$" -or $log -match "\| +(https://[a-zA-Z0-9\-]+\.trycloudflare\.com)") {
    $lines = Get-Content C:\Users\motas\PureLine\cloudflared.log
    $urlLine = $lines | Where-Object { $_ -match "trycloudflare\.com" -and $_ -notmatch "api\.trycloudflare\.com" -and $_ -notmatch "website-terms" -and $_ -notmatch "developers\.cloudflare" }
    Write-Output "candidate lines:"
    $urlLine
} else {
    Write-Output "not found yet"
}
Write-Output "--- full log ---"
Get-Content C:\Users\motas\PureLine\cloudflared.log
