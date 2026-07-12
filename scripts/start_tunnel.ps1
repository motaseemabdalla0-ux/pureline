Start-Process -FilePath "cloudflared" -ArgumentList "tunnel --url http://localhost:8080" -WindowStyle Hidden -RedirectStandardError C:\Users\motas\PureLine\cloudflared.log
Start-Sleep -Seconds 12
$log = Get-Content C:\Users\motas\PureLine\cloudflared.log -Raw
if ($log -match "https://[a-zA-Z0-9\-]+\.trycloudflare\.com") {
    $url = $matches[0]
    Set-Content -Path C:\Users\motas\PureLine\tunnel_url.txt -Value $url -NoNewline
    Write-Output "NEW URL: $url"
} else {
    Write-Output "URL not found yet, log tail:"
    Write-Output ($log -split "`n" | Select-Object -Last 20)
}
