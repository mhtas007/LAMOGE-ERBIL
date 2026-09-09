@echo off
title کرانەوەی فایەروۆڵ بۆ ئایپاد - Allow Firewall for iPad
cd /d "%~dp0"

echo ========================================================================
echo         ڕێگەپێدانی فایەروۆڵی ویندۆز بۆ بەستنەوەی ئایپاد
echo         ALLOW WINDOWS FIREWALL FOR IPAD & TABLETS
echo ========================================================================
echo.

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [تێبینی] تکایە بە ڕاست کلیک لەسەر ئەم فایلە بکە و (Run as administrator) هەڵبژێرە!
    echo [NOTE] Please Right-Click this file and choose "Run as administrator".
    echo.
    pause
    exit /b 1
)

echo کردنەوەی پۆرتەکانی 3000 و 3001 بۆ سیستەم...
netsh advfirewall firewall delete rule name="LAMOGE POS Server" >nul 2>&1
netsh advfirewall firewall delete rule name="LAMOGE POS Bridge" >nul 2>&1

netsh advfirewall firewall add rule name="LAMOGE POS Server" dir=in action=allow protocol=TCP localport=3000 profile=any
netsh advfirewall firewall add rule name="LAMOGE POS Bridge" dir=in action=allow protocol=TCP localport=3001 profile=any

echo.
echo ========================================================================
echo [سەرکەوتوو بوو] فایەروۆڵ کرایەوە! ئێستا ئایپاد دەتوانێت بەبێ کێشە پەیوەست بێت.
echo [SUCCESS] Firewall ports 3000 & 3001 are now open for iPad and network devices!
echo ========================================================================
echo.
pause
