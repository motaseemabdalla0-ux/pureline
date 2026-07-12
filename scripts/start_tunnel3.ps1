Remove-Item C:\Users\motas\PureLine\cloudflared.log -ErrorAction SilentlyContinue
Start-Process -FilePath "cloudflared" -ArgumentList "tunnel --url http://localhost:8080" -WindowStyle Hidden -RedirectStandardError C:\Users\motas\PureLine\cloudflared.log
Start-Sleep -Seconds 15
$lines = Get-Content C:\Users\motas\PureLine\cloudflared.log
$urlLine = $lines | Where-Object { $_ -match "https://[a-zA-Z0-9\-]+\.trycloudflare\.com" -and $_ -notmatch "api\.trycloudflare\.com" }
if ($urlLine) {
    $m = [regex]::Match($urlLine, "https://[a-zA-Z0-9\-]+\.trycloudflare\.com")
    $url = $m.Value
    Set-Content -Path C:\Users\motas\PureLine\tunnel_url.txt -Value $url -NoNewline
    Write-Output "NEW URL: $url"
} else {
    Write-Output "NOT FOUND"
    $lines
}
