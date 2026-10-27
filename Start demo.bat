@echo off
title RepairFair demo (close this window to stop)
cd /d "%~dp0"
echo Starting the RepairFair demo...
start "" cmd /c "timeout /t 3 >nul & start http://localhost:5000"
python app.py
pause
