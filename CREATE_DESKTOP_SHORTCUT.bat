@echo off
title دروستکردنی شۆرتکەت لەسەر دێسکتۆپ - Create Desktop Shortcut
cd /d "%~dp0"

echo دروستکردنی شۆرتکەت لەسەر دێسکتۆپ...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([System.IO.Path]::Combine([Environment]::GetFolderPath('Desktop'), 'LAMOGE POS - دەستپێکردنی سێرڤەر.lnk')); $s.TargetPath = '%~dp0START_POS_SERVER.bat'; $s.WorkingDirectory = '%~dp0'; $s.IconLocation = 'shell32.dll,13'; $s.Save()"

echo.
echo ========================================================================
echo [سەرکەوتوو بوو] شۆرتکەت لەسەر دێسکتۆپ (Desktop) دروستکرا!
echo دەتوانیت ڕۆژانە ڕاستەوخۆ لەسەر دێسکتۆپ کلیکی لێ بکەیت.
echo ========================================================================
echo.
pause
