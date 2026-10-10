<#
.SYNOPSIS
    Comprehensive Validation Test Suite for CareerReady AI System.
    Tests Website Mode, Mobile Mode, Database, Random Forest ML microservice, and End-to-End APIs.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\verify-all.ps1
#>

$ErrorActionPreference = "Continue"

Write-Host "`n======================================================================" -ForegroundColor Cyan
Write-Host "   CAREERREADY AI - COMPREHENSIVE END-TO-END VALIDATION SUITE" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

# Detect LAN IPv4
$activeIps = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object {
    $_.InterfaceAlias -notlike "*Loopback*" -and
    $_.IPAddress -notlike "169.254*" -and
    $_.IPAddress -notlike "127.*"
}
$wifi = $activeIps | Where-Object { $_.InterfaceAlias -like "*Wi-Fi*" } | Select-Object -First 1
$lanIp = if ($wifi) { $wifi.IPAddress } elseif ($activeIps.Count -gt 0) { $activeIps[0].IPAddress } else { "127.0.0.1" }

$results = [System.Collections.Generic.List[PSObject]]::new()

function Record-Test($Name, $Category, $Passed, $Details) {
    $symbol = if ($Passed) { "✅ PASS" } else { "❌ FAIL" }
    $color = if ($Passed) { "Green" } else { "Red" }
    Write-Host ("  [{0}] {1,-35} | {2}" -f $symbol, $Name, $Details) -ForegroundColor $color
    $results.Add([PSCustomObject]@{
        Category = $Category
        Test     = $Name
        Status   = if ($Passed) { "PASS" } else { "FAIL" }
        Details  = $Details
    })
}

# 1. MySQL Database Port Check
Write-Host "`n[1] Infrastructure Checks:" -ForegroundColor Yellow
$mysqlUp = $false
try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $tcp.Connect("127.0.0.1", 3306)
    $mysqlUp = $tcp.Connected
    $tcp.Close()
} catch { $mysqlUp = $false }
Record-Test "MySQL Database Port (3306)" "Infrastructure" $mysqlUp "Listening for career_ready_db"

# 2. Python ML Microservice
$mlOk = $false
$mlDetails = ""
try {
    $ml = Invoke-RestMethod -Uri "http://127.0.0.1:5000/health" -Method Get -TimeoutSec 4 -ErrorAction Stop
    if ($ml.status -eq "UP") {
        $mlOk = $true
        $mlDetails = "$($ml.model) ($([math]::Round($ml.accuracy * 100, 1))% accuracy, $($ml.version))"
    }
} catch { $mlDetails = $_.Exception.Message }
Record-Test "Python ML Service (Port 5000)" "ML Microservice" $mlOk $mlDetails

# 3. Spring Boot Backend (Localhost)
$bkLocal = $false
$bkDetails = ""
try {
    $b = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/health" -Method Get -TimeoutSec 4 -ErrorAction Stop
    if ($b.success) {
        $bkLocal = $true
        $bkDetails = "$($b.message) - DB: $($b.data.database)"
    }
} catch { $bkDetails = $_.Exception.Message }
Record-Test "Backend Health (localhost:8080)" "Website Mode" $bkLocal $bkDetails

# 4. Spring Boot Backend (LAN IPv4)
$bkLan = $false
$bkLanDetails = ""
try {
    $b2 = Invoke-RestMethod -Uri "http://${lanIp}:8080/api/health" -Method Get -TimeoutSec 4 -ErrorAction Stop
    if ($b2.success) {
        $bkLan = $true
        $bkLanDetails = "Reachable over Wi-Fi / Hotspot at http://${lanIp}:8080"
    }
} catch { $bkLanDetails = $_.Exception.Message }
Record-Test "Backend Health (LAN: $lanIp)" "Mobile Mode" $bkLan $bkLanDetails

# 5. Vite Frontend (Localhost)
$vtLocal = $false
try {
    $h = Invoke-WebRequest -Uri "http://localhost:5173" -Method Get -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
    if ($h.StatusCode -eq 200) { $vtLocal = $true }
} catch { }
Record-Test "Vite Frontend (localhost:5173)" "Website Mode" $vtLocal "Web interface accessible on laptop browser"

# 6. Vite Frontend (LAN IPv4)
$vtLan = $false
try {
    $h2 = Invoke-WebRequest -Uri "http://${lanIp}:5173" -Method Get -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
    if ($h2.StatusCode -eq 200) { $vtLan = $true }
} catch { }
Record-Test "Vite Frontend (LAN: $lanIp)" "Mobile Mode" $vtLan "Responsive web UI accessible on phone browser"

# 7. Authentication & Real Database Access
Write-Host "`n[2] Authentication & Business Logic Checks:" -ForegroundColor Yellow
$studentToken = $null
try {
    $body = @{ email = "student@careerready.ai"; password = "password123"; role = "student" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/auth/login" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 5 -ErrorAction Stop
    if ($res.success -and $res.data.token) {
        $studentToken = $res.data.token
        Record-Test "Student Authentication (MySQL)" "Auth" $true "User: $($res.data.name) (ID: $($res.data.userId), StudentID: $($res.data.studentId))"
    } else {
        Record-Test "Student Authentication (MySQL)" "Auth" $false "Failed to authenticate"
    }
} catch {
    Record-Test "Student Authentication (MySQL)" "Auth" $false $_.Exception.Message
}

$adminToken = $null
try {
    $body = @{ email = "inbaasara@gmail.com"; password = "Inbaa@1234"; role = "admin" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/auth/login" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 5 -ErrorAction Stop
    if ($res.success -and $res.data.token) {
        $adminToken = $res.data.token
        Record-Test "Admin Authentication (MySQL)" "Auth" $true "Role: $($res.data.role) - $($res.data.email)"
    } else {
        Record-Test "Admin Authentication (MySQL)" "Auth" $false "Failed to authenticate"
    }
} catch {
    Record-Test "Admin Authentication (MySQL)" "Auth" $false $_.Exception.Message
}

# 8. Readiness Prediction Query
if ($studentToken) {
    try {
        $hdrs = @{ Authorization = "Bearer $studentToken" }
        $pred = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/readiness/student/1" -Method Get -Headers $hdrs -TimeoutSec 5 -ErrorAction Stop
        if ($pred.success -and $pred.data.readinessScore) {
            Record-Test "Readiness Score Query (MySQL)" "Readiness" $true "Score: $($pred.data.readinessScore)% ($($pred.data.classificationDisplay)) - Model: $($pred.data.modelVersion)"
        } else {
            Record-Test "Readiness Score Query (MySQL)" "Readiness" $false "Invalid response payload"
        }
    } catch {
        Record-Test "Readiness Score Query (MySQL)" "Readiness" $false $_.Exception.Message
    }
}

# 9. Live Random Forest Inference via Backend
if ($studentToken) {
    try {
        $hdrs = @{ Authorization = "Bearer $studentToken" }
        $body = @{ studentId = 1; cgpa = 8.5; academicScore = 85; aptitudeScore = 80; technicalScore = 85; programmingScore = 90; communicationScore = 80 } | ConvertTo-Json
        $pred = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/readiness/predict" -Method Post -Headers $hdrs -Body $body -ContentType "application/json" -TimeoutSec 6 -ErrorAction Stop
        if ($pred.success -and $pred.data.readinessScore) {
            Record-Test "Live ML Inference Execution" "ML Microservice" $true "Computed Score: $($pred.data.readinessScore)% ($($pred.data.classificationDisplay)) via Flask RandomForest"
        } else {
            Record-Test "Live ML Inference Execution" "ML Microservice" $false "Failed to infer score"
        }
    } catch {
        Record-Test "Live ML Inference Execution" "ML Microservice" $false $_.Exception.Message
    }
}

# 10. Company Directory Query
if ($adminToken) {
    try {
        $hdrs = @{ Authorization = "Bearer $adminToken" }
        $comps = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/companies" -Method Get -Headers $hdrs -TimeoutSec 5 -ErrorAction Stop
        if ($comps.success -and $comps.data.Count -gt 0) {
            Record-Test "Company Matching Directory (MySQL)" "Workflows" $true "Loaded $($comps.data.Count) real placement partner companies"
        } else {
            Record-Test "Company Matching Directory (MySQL)" "Workflows" $false "No companies found"
        }
    } catch {
        Record-Test "Company Matching Directory (MySQL)" "Workflows" $false $_.Exception.Message
    }
}

# 11. Skill-Gap Analysis Query
if ($studentToken) {
    try {
        $hdrs = @{ Authorization = "Bearer $studentToken" }
        $sg = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/companies/7/skill-gaps/me" -Method Get -Headers $hdrs -TimeoutSec 5 -ErrorAction Stop
        if ($sg.success -and $sg.data.skillGaps) {
            Record-Test "Skill-Gap Diagnostics (MySQL)" "Workflows" $true "Computed diagnostic gaps for $($sg.data.companyName): $($sg.data.skillGaps.Count) skills analyzed"
        } else {
            Record-Test "Skill-Gap Diagnostics (MySQL)" "Workflows" $false "Failed to compute skill gaps"
        }
    } catch {
        Record-Test "Skill-Gap Diagnostics (MySQL)" "Workflows" $false $_.Exception.Message
    }
}

# 12. Android APK Package Status
Write-Host "`n[3] Mobile Android Build Artifacts:" -ForegroundColor Yellow
$apkPath = Join-Path $PSScriptRoot "frontend\android\app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apkPath) {
    $apkItem = Get-Item $apkPath
    Record-Test "Android Debug APK Package" "Mobile Mode" $true "$([math]::Round($apkItem.Length / 1MB, 2)) MB (Built: $($apkItem.LastWriteTime))"
} else {
    Record-Test "Android Debug APK Package" "Mobile Mode" $false "APK not found at expected path"
}

Write-Host "`n======================================================================" -ForegroundColor Cyan
$passCount = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$totalCount = $results.Count
Write-Host "   TEST RESULTS: $passCount / $totalCount TESTS PASSED" -ForegroundColor $(if ($passCount -eq $totalCount) { "Green" } else { "Yellow" })
Write-Host "======================================================================`n" -ForegroundColor Cyan
