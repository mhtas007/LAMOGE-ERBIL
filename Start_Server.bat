@echo off
title LAMOGE CAFE POS SERVER
cd /d "%~dp0"
echo ========================================================
echo            LAMOGE POS SERVER IS RUNNING
echo ========================================================
echo POS Server is starting on port 3000...
echo Keep this window open while the cafe is operating.
echo ========================================================
call npm.cmd run dev