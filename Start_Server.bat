@echo off
title LAMOGE CAFE POS SERVER
cd /d "c:\Users\Ram Computer\Downloads\cafe-pos-system (14)"
echo ========================================================
echo            LAMOGE POS SERVER IS RUNNING
echo ========================================================
echo Local:   http://localhost:3000
echo Network: http://192.168.1.86:3000
echo Printer: 192.168.1.35:9100
echo ========================================================
echo To keep POS working on iPad, keep this window open.
echo ========================================================
npm.cmd run dev