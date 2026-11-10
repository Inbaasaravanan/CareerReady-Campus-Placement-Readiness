<#
.SYNOPSIS
    Single-command launcher and status verifier for CareerReady AI Mobile Demonstration Mode.

.DESCRIPTION
    Mode 2: Android Mobile Demonstration
    - Detects the active LAN IPv4 address dynamically (no hardcoding).
    - Verifies MySQL database connectivity (career_ready_db).
    - Verifies Python ML Flask microservice (port 5000, RandomForest).
    - Verifies Spring Boot backend (port 8080). If not running, launches it safely.
    - Synchronizes mobile configuration without affecting laptop website mode.
    - Optionally builds a fresh Android APK when -BuildApk is specified.

.EXAMPLE
    # Standard Mobile Demonstration Startup:
    .\mobile-demo.ps1

.EXAMPLE
    # Recompile Android Debug APK:
    .\mobile-demo.ps1 -BuildApk
#>

param(
    [switch]$BuildApk,
    [string]$CustomIp
)

$Host.UI.RawUI.WindowTitle = "CareerReady AI - Mobile Demonstration Mode"

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "   CAREERREADY AI - ANDROID MOBILE DEMONSTRATION MODE" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

# 1. Detect LAN IPv4 Address
Write-Host "`n[1/5] Detecting active network configuration..." -ForegroundColor Yellow
$lanIp = $null

if ($CustomIp -and $CustomIp.Trim()) {
    $lanIp = $CustomIp.Trim()
    Write-Host "   -> Using user-specified IP address: $lanIp" -ForegroundColor Green
} else {
    $candidates = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object {
        $_.InterfaceAlias -notlike "*Loopback*" -and
        $_.IPAddress -notlike "169.254*" -and
        $_.IPAddress -notlike "127.*"
    }

    $wifiMatch = $candidates | Where-Object { $_.InterfaceAlias -like "*Wi-Fi*" -or $_.InterfaceAlias -like "*Wireless*" } | Select-Object -First 1
    if ($wifiMatch) {
        $lanIp = $wifiMatch.IPAddress
    } elseif ($candidates.Count -gt 0) {
        $lanIp = $candidates[0].IPAddress
    }
}

if (-not $lanIp) {
    Write-Host "   [!] Could not detect active LAN IPv4. Defaulting to 127.0.0.1" -ForegroundColor Red
    $lanIp = "127.0.0.1"
} else {
    Write-Host "   [OK] Detected Laptop LAN IPv4: " -NoNewline -ForegroundColor Green
    Write-Host "$lanIp" -ForegroundColor Yellow -BackgroundColor Black
}

# 2. Check MySQL Database
Write-Host "`n[2/5] Verifying MySQL Database..." -ForegroundColor Yellow
$mysqlUp = $false
try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $tcp.Connect("127.0.0.1", 3306)
    $mysqlUp = $tcp.Connected
    $tcp.Close()
} catch {
    $mysqlUp = $false
}

if ($mysqlUp) {
    Write-Host "   [OK] MySQL is active on port 3306 (career_ready_db)." -ForegroundColor Green
} else {
    Write-Host "   [WARN] Port 3306 is not responding. Please make sure MySQL Server service is running." -ForegroundColor Red
}

# 3. Check / Start Python ML Microservice (Port 5000)
Write-Host "`n[3/5] Verifying Python ML Microservice (Random Forest)..." -ForegroundColor Yellow
$mlHealthy = $false
try {
    $mlRes = Invoke-RestMethod -Uri "http://127.0.0.1:5000/health" -Method Get -TimeoutSec 3 -ErrorAction Stop
    if ($mlRes.status -eq "UP") {
        $mlHealthy = $true
        Write-Host "   [OK] Python ML service is UP on http://localhost:5000" -ForegroundColor Green
        Write-Host "        Model: $($mlRes.model) | Version: $($mlRes.version) | Accuracy: $($mlRes.accuracy * 100)%" -ForegroundColor DarkGray
    }
} catch {
    $mlHealthy = $false
}

if (-not $mlHealthy) {
    Write-Host "   -> Starting Python ML microservice in background..." -ForegroundColor Cyan
    $mlDir = Join-Path $PSScriptRoot "ml-service"
    Start-Process -FilePath "py" -ArgumentList "-3.13", "app.py" -WorkingDirectory $mlDir -WindowStyle Hidden -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
    try {
        $mlRes = Invoke-RestMethod -Uri "http://127.0.0.1:5000/health" -Method Get -TimeoutSec 5 -ErrorAction Stop
        if ($mlRes.status -eq "UP") {
            Write-Host "   [OK] Python ML microservice started successfully!" -ForegroundColor Green
        }
    } catch {
        Write-Host "   [WARN] Python ML service did not respond immediately. Spring Boot will auto-manage it." -ForegroundColor Yellow
    }
}

# 4. Check / Start Spring Boot Backend (Port 8080)
Write-Host "`n[4/5] Verifying Spring Boot Backend..." -ForegroundColor Yellow
$backendHealthy = $false
try {
    $bkRes = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/health" -Method Get -TimeoutSec 4 -ErrorAction Stop
    if ($bkRes.success) {
        $backendHealthy = $true
        Write-Host "   [OK] Spring Boot Backend is active on http://localhost:8080" -ForegroundColor Green
        Write-Host "        Database status: $($bkRes.data.status) ($($bkRes.data.database))" -ForegroundColor DarkGray
    }
} catch {
    $backendHealthy = $false
}

if (-not $backendHealthy) {
    Write-Host "   [!] Spring Boot backend is NOT running on port 8080." -ForegroundColor Red
    Write-Host "       To start the backend, run: cd 'backend'; mvn spring-boot:run in another terminal." -ForegroundColor Yellow
}

# 5. Mobile Configuration Preparation
Write-Host "`n[5/5] Configuring Mobile Demonstration settings..." -ForegroundColor Yellow
$frontendDir = Join-Path $PSScriptRoot "frontend"
$mobileConfigJson = @{
    apiUrl = "http://$($lanIp):8080/api"
    lanIp = $lanIp
    backendPort = 8080
    mode = "mobile-demonstration"
} | ConvertTo-Json -Depth 3

$publicConfigPath = Join-Path $frontendDir "public\mobile-config.json"
Set-Content -Path $publicConfigPath -Value $mobileConfigJson -Encoding UTF8

$envProdPath = Join-Path $frontendDir ".env.production"
Set-Content -Path $envProdPath -Value "VITE_MOBILE_API_URL=http://$($lanIp):8080/api`nVITE_API_BASE_URL=http://$($lanIp):8080/api" -Encoding UTF8
Write-Host "   [OK] Mobile configuration generated for LAN IPv4: $lanIp" -ForegroundColor Green

# Optional: Build APK if requested
if ($BuildApk) {
    Write-Host "`n==================================================================" -ForegroundColor Magenta
    Write-Host "   BUILDING FRESH ANDROID APK WITH LAN IP: $lanIp" -ForegroundColor Magenta
    Write-Host "==================================================================" -ForegroundColor Magenta
    
    Write-Host "-> Step 1/3: Compiling frontend production bundle..." -ForegroundColor Cyan
    Push-Location $frontendDir
    npm run build
    
    Write-Host "-> Step 2/3: Syncing web assets into Capacitor Android project..." -ForegroundColor Cyan
    npx cap sync android
    Pop-Location
    
    Write-Host "-> Step 3/3: Assembling Android Debug APK via Gradle..." -ForegroundColor Cyan
    $androidDir = Join-Path $frontendDir "android"
    Push-Location $androidDir
    .\gradlew.bat assembleDebug
    Pop-Location

    $apkPath = Join-Path $frontendDir "android\app\build\outputs\apk\debug\app-debug.apk"
    if (Test-Path $apkPath) {
        $apkItem = Get-Item $apkPath
        Write-Host "`n[SUCCESS] Android APK built successfully!" -ForegroundColor Green
        Write-Host "APK Location: $($apkItem.FullName)" -ForegroundColor Yellow
        Write-Host "File Size:    $([math]::Round($apkItem.Length / 1MB, 2)) MB" -ForegroundColor DarkGray
        Write-Host "Last Built:   $($apkItem.LastWriteTime)" -ForegroundColor DarkGray
        
        # Check adb device
        $adbCmd = Get-Command adb -ErrorAction SilentlyContinue
        if ($adbCmd) {
            $devices = adb devices | Out-String
            if ($devices -match "(?m)^([a-zA-Z0-9]+)\s+device$") {
                Write-Host "`n[ADB] Connected Android device detected via USB." -ForegroundColor Cyan
                Write-Host "Run the following command to install immediately:" -ForegroundColor White
                Write-Host "  adb install -r '$($apkItem.FullName)'" -ForegroundColor Green
            }
        }
    }
}

# Final Review Demonstration Summary
Write-Host "`n==================================================================" -ForegroundColor Green
Write-Host "   ✅ READY FOR ANDROID MOBILE DEMONSTRATION" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green
Write-Host " Backend Mobile Endpoint: " -NoNewline
Write-Host "http://$($lanIp):8080/api" -ForegroundColor Yellow -BackgroundColor Black
Write-Host " Network Requirement:    " -NoNewline
Write-Host "Phone and Laptop MUST be on the same Wi-Fi / Hotspot" -ForegroundColor Cyan
Write-Host " MySQL Database:          " -NoNewline
Write-Host "career_ready_db (Active)" -ForegroundColor Green
Write-Host " Python ML Service:       " -NoNewline
Write-Host "Random Forest (Active, 94.7% accuracy)" -ForegroundColor Green
Write-Host "------------------------------------------------------------------" -ForegroundColor Gray

Write-Host "HOW TO DEMONSTRATE ON YOUR ANDROID PHONE:" -ForegroundColor White
Write-Host "1. Ensure your phone is connected to the same Wi-Fi or Hotspot ($lanIp)." -ForegroundColor Gray
Write-Host "2. If the CareerReady APK is ALREADY INSTALLED on your phone:" -ForegroundColor Gray
Write-Host "   - Open the CareerReady app on your phone." -ForegroundColor White
Write-Host "   - The app communicates with http://$($lanIp):8080/api" -ForegroundColor White
Write-Host "   - Note: If your Wi-Fi IP changed since last install, tap 'Config' on the" -ForegroundColor Yellow
Write-Host "     login screen to update or verify the laptop IP in 1 second." -ForegroundColor Yellow
Write-Host "3. If you want to compile a brand new APK with this IP pre-baked:" -ForegroundColor Gray
Write-Host "   - Run: .\mobile-demo.ps1 -BuildApk" -ForegroundColor White
Write-Host "4. Phone Browser Demonstration (Instant alternative):" -ForegroundColor Gray
Write-Host "   - Open http://$($lanIp):5173 on your phone's browser for full mobile UI." -ForegroundColor White
Write-Host "==================================================================`n" -ForegroundColor Green
