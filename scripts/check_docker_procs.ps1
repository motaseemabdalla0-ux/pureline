Get-CimInstance Win32_Process -Filter "Name='docker.exe'" | Select-Object ProcessId,CommandLine | Format-List
