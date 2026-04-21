@echo off
title 🤖 XM POWER BOT — $100 to $500
color 0A

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║     XM MT5 POWER BOT  —  STARTING UP        ║
echo  ║     Goal: $100  ──►  $500                   ║
echo  ╚══════════════════════════════════════════════╝
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Python not found!
    echo  Download from: https://www.python.org/downloads/
    pause & exit /b 1
)

echo  [1/3] Installing dependencies...
pip install -q MetaTrader5 pandas numpy

echo  [2/3] Checking MetaTrader5 terminal...
echo.
echo  ┌─────────────────────────────────────────────┐
echo  │  IMPORTANT: MetaTrader 5 must be OPEN       │
echo  │  and you must be LOGGED IN to XM            │
echo  └─────────────────────────────────────────────┘
echo.

timeout /t 4 /nobreak >nul

echo  [3/3] Launching bot...
echo.
python POWER_BOT.py

echo.
echo  ══════════════════════════════════════════════
echo  Bot stopped. Check power_bot.log for history.
echo  ══════════════════════════════════════════════
pause
