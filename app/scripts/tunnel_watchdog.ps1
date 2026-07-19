# Pure Line Cloudflare Quick Tunnel watchdog.
# Run periodically (via Task Scheduler). If cloudflared isn't running, starts a
# fresh tunnel, extracts the new public URL from the log, and records it.

$ErrorActionPreference = "SilentlyContinue"
$logFile = "C:\Users\motas\PureLine\cloudflared.log"
$urlFile = "C:\Users\motas\PureLine\tunnel_url.txt"
$watchdogLog = "C:\Users\motas\PureLine\scripts\watchdog.log"

function Write-Log($msg) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content -Path $watchdogLog -Value "[$ts] $msg"
}

$proc = Get-CimInstance Win32_Process -Filter "Name = 'cloudflared.exe'"

$needsRestart = $false
if (-not $proc) {
    Write-Log "cloudflared not running - starting new tunnel"
    $needsRestart = $true
} else {
    # Verify the recorded URL is actually still reachable (process can be alive
    # but the edge connection dropped - the "Error 1033" case seen previously).
    if (Test-Path $urlFile) {
        $url = (Get-Content $urlFile -Raw).Trim()
        if ($url) {
            try {
                $resp = Invoke-WebRequest -Uri $url -Method Head -TimeoutSec 8 -UseBasicParsing
                if ($resp.StatusCode -ne 200) { $needsRestart = $true }
            } catch {
                Write-Log "existing tunnel URL unreachable ($url) - restarting"
                $needsRestart = $true
            }
        } else {
            $needsRestart = $true
        }
    } else {
        $needsRestart = $true
    }
}

if ($needsRestart) {
    if ($proc) {
        Write-Log "killing stale cloudflared process(es): $($proc.ProcessId -join ',')"
        $proc | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
        Start-Sleep -Seconds 2
    }
    Remove-Item $logFile -ErrorAction SilentlyContinue
    Start-Process -FilePath "cloudflared" -ArgumentList "tunnel --url http://localhost:8080 --logfile `"$logFile`"" -WindowStyle Hidden
    Start-Sleep -Seconds 8

    $line = Select-String -Path $logFile -Pattern "https://.*\.trycloudflare\.com" | Select-Object -First 1
    if ($line) {
        $newUrl = ($line.Line | Select-String -Pattern "https://[a-zA-Z0-9\-]+\.trycloudflare\.com").Matches[0].Value
        Set-Content -Path $urlFile -Value $newUrl
        Write-Log "new tunnel started: $newUrl"
    } else {
        Write-Log "WARNING: could not extract new tunnel URL from log"
    }
} else {
    Write-Log "tunnel healthy, no action needed"
}
