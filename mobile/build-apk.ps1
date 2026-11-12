# AI Traffic Voice Assistant - Native Android Build Script
param (
    [string]$BuildType = "apk" # "apk" or "aab" or "both"
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$androidDir = Join-Path $scriptDir "android"
$distDir = Join-Path $scriptDir "dist"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  AI TRAFFIC VOICE ASSISTANT - ANDROID BUILD PIPELINE     " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Environment Detection
if (-not $env:JAVA_HOME) {
    if (Test-Path "C:\Program Files\Android\Android Studio\jbr") {
        $env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
    }
}

if (-not $env:ANDROID_HOME) {
    if (Test-Path "$env:USERPROFILE\AppData\Local\Android\Sdk") {
        $env:ANDROID_HOME = "$env:USERPROFILE\AppData\Local\Android\Sdk"
    }
}

Write-Host "[1/4] JAVA_HOME:    $env:JAVA_HOME" -ForegroundColor Green
Write-Host "[2/4] ANDROID_HOME: $env:ANDROID_HOME" -ForegroundColor Green

if (-not (Test-Path $distDir)) {
    New-Item -ItemType Directory -Path $distDir -Force | Out-Null
}

Push-Location $androidDir
try {
    if ($BuildType -eq "apk" -or $BuildType -eq "both") {
        Write-Host "`n[3/4] Compiling Standalone Android APK (assembleDebug)..." -ForegroundColor Yellow
        .\gradlew.bat assembleDebug --no-daemon

        $apkSource = Join-Path $androidDir "app\build\outputs\apk\debug\app-debug.apk"
        if (Test-Path $apkSource) {
            $apkTarget = Join-Path $distDir "ai-traffic-voice-assistant-debug.apk"
            Copy-Item -Path $apkSource -Destination $apkTarget -Force
            $apkSizeMB = [math]::Round((Get-Item $apkTarget).Length / 1MB, 2)
            Write-Host "`n✓ SUCCESS: Generated Installable Android APK!" -ForegroundColor Green
            Write-Host "  Location: $apkTarget" -ForegroundColor White
            Write-Host "  Size:     $apkSizeMB MB" -ForegroundColor White
        }
    }

    if ($BuildType -eq "aab" -or $BuildType -eq "both") {
        Write-Host "`n[4/4] Compiling Google Play Store Bundle (bundleRelease)..." -ForegroundColor Yellow
        .\gradlew.bat bundleRelease --no-daemon

        $aabSource = Join-Path $androidDir "app\build\outputs\bundle\release\app-release.aab"
        if (Test-Path $aabSource) {
            $aabTarget = Join-Path $distDir "ai-traffic-voice-assistant-release.aab"
            Copy-Item -Path $aabSource -Destination $aabTarget -Force
            $aabSizeMB = [math]::Round((Get-Item $aabTarget).Length / 1MB, 2)
            Write-Host "`n✓ SUCCESS: Generated Production Google Play Store Bundle!" -ForegroundColor Green
            Write-Host "  Location: $aabTarget" -ForegroundColor White
            Write-Host "  Size:     $aabSizeMB MB" -ForegroundColor White
        }
    }
} finally {
    Pop-Location
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  ANDROID BUILD PIPELINE COMPLETED SUCCESSFULLY           " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
