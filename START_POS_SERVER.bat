@echo off
title LAMOGE CAFE POS - MAIN BASE SERVER
cd /d "%~dp0"
color 0A

echo ========================================================================
echo               LAMOGE CAFE POS - بنکەی سەرەکی سێرڤەر
echo ========================================================================
echo.

:: 1. Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js دانەمەزراوە لەسەر ئەم کۆمپیوتەرە!
    echo [ERROR] Node.js is not installed on this computer.
    echo.
    echo تکایە سەرەتا Node.js دابمەزرێنە بۆ ئەوەی سیستەمەکە کار بکات.
    echo وێبگەی فەرمی Node.js دەکرێتەوە بۆ دابەزاندن...
    start https://nodejs.org/
    echo.
    echo دوای دامەزراندنی Node.js، دووبارە ئەم فایلە بکەرەوە.
    pause
    exit /b 1
)

:: 2. Check if node_modules folder exists
if not exist "node_modules\" (
    echo [INFO] پێداویستییەکان (Dependencies) دادەمەزرێن... تکایە کەمێک چاوەڕوان بە...
    echo [INFO] Installing required packages... Please wait...
    call npm.cmd install
    if %errorlevel% neq 0 (
        echo [WARNING] ئەگەر کێشەیەک هەبوو لە ئینتەرنێت، دڵنیابە لە هێڵەکە.
    )
)

:: 3. Open Windows Firewall for Port 3000 & 3001 (Silently, if admin or available)
netsh advfirewall firewall show rule name="LAMOGE POS Server" >nul 2>nul
if %errorlevel% neq 0 (
    netsh advfirewall firewall add rule name="LAMOGE POS Server" dir=in action=allow protocol=TCP localport=3000 profile=any >nul 2>nul
    netsh advfirewall firewall add rule name="LAMOGE POS Bridge" dir=in action=allow protocol=TCP localport=3001 profile=any >nul 2>nul
)

:: 4. Start the Base Server with Smart IP and QR Detection
node start-server.js

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] سیستەمەکە لەناکاو وەستا. تکایە پشکنین بکە.
    pause
)
