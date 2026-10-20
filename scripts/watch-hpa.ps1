Write-Host "=== Surveillance HPA en temps reel ===" -ForegroundColor Green
Write-Host "Format: SERVICE | CPU | MEMORY | REPLICAS/MAX | PODS RUNNING" -ForegroundColor Cyan
Write-Host ""

while ($true) {
    Clear-Host
    Write-Host "=== HPA Status - $(Get-Date -Format 'HH:mm:ss') ===" -ForegroundColor Green
    Write-Host ""

    $hpaOutput = kubectl get hpa 2>$null
    $hpaLines = $hpaOutput -split "`n" | Select-Object -Skip 1 | Where-Object { $_ -ne "" }

    $podsOutput = kubectl get pods 2>$null

    Write-Host "SERVICE              CPU/TARGET    MEM/TARGET    MIN  MAX  REPLICAS  PODS" -ForegroundColor Yellow
    Write-Host ("=" * 85) -ForegroundColor Gray

    foreach ($line in $hpaLines) {
        if ($line -match "(\S+)\s+\S+\s+cpu:\s+(\d+)%/(\d+)%,\s+memory:\s+(\d+)%/(\d+)%\s+(\d+)\s+(\d+)\s+(\d+)") {
            $name     = $Matches[1]
            $cpuCur   = $Matches[2]
            $cpuTgt   = $Matches[3]
            $memCur   = $Matches[4]
            $memTgt   = $Matches[5]
            $minPods  = $Matches[6]
            $maxPods  = $Matches[7]
            $replicas = $Matches[8]

            $serviceName = $name -replace "-hpa", ""
            $runningPods = ($podsOutput | Select-String "$serviceName" | Select-String "Running").Count

            $cpuColor = "Green"
            if ([int]$cpuCur -gt 70) { $cpuColor = "Red" }
            elseif ([int]$cpuCur -gt 50) { $cpuColor = "Yellow" }

            $repColor = "Green"
            if ([int]$replicas -eq [int]$maxPods) { $repColor = "Red" }
            elseif ([int]$replicas -gt ([int]$maxPods * 0.7)) { $repColor = "Yellow" }

            $serviceFormatted = $name.PadRight(20)
            $cpuFormatted     = "$cpuCur%/$cpuTgt%".PadRight(13)
            $memFormatted     = "$memCur%/$memTgt%".PadRight(13)
            $minFormatted     = $minPods.PadRight(4)
            $maxFormatted     = $maxPods.PadRight(4)
            $repFormatted     = "$replicas/$maxPods"
            $podFormatted     = "($runningPods running)"

            Write-Host $serviceFormatted -NoNewline -ForegroundColor White
            Write-Host $cpuFormatted     -NoNewline -ForegroundColor $cpuColor
            Write-Host $memFormatted     -NoNewline -ForegroundColor Cyan
            Write-Host $minFormatted     -NoNewline -ForegroundColor Gray
            Write-Host $maxFormatted     -NoNewline -ForegroundColor Gray
            Write-Host "  $repFormatted  " -NoNewline -ForegroundColor $repColor
            Write-Host $podFormatted     -ForegroundColor Gray
        }
    }

    Write-Host ""
    Write-Host ("=" * 85) -ForegroundColor Gray

    $totalPods   = ($podsOutput | Select-String "Running").Count
    $crashedPods = ($podsOutput | Select-String "CrashLoopBackOff|Error").Count

    Write-Host ""
    Write-Host "Total pods Running : $totalPods" -ForegroundColor Green

    if ($crashedPods -gt 0) {
        Write-Host "Pods en erreur     : $crashedPods" -ForegroundColor Red
    }

    Write-Host ""
    Write-Host "Refresh toutes les 30 secondes - Ctrl+C pour arreter" -ForegroundColor Gray

    Start-Sleep -Seconds 30
}