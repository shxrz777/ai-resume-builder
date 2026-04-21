@echo off
title XM AI Trading Bot

echo ============================================================
echo   XM MT5 AI Trading Bot  ^|  Goal: $100 --^> $500
echo ============================================================
echo.

:: Check Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Install Python 3.10+ from python.org
    pause
    exit /b 1
)

:: Install / upgrade dependencies silently
echo [SETUP] Installing required packages...
pip install -q -r requirements.txt

echo [SETUP] Done. Starting bot...
echo.
echo [INFO]  Make sure MetaTrader 5 terminal is OPEN and RUNNING.
echo [INFO]  Press Ctrl+C to stop the bot at any time.
echo.
timeout /t 3 /nobreak >nul

python xm_trading_bot.py

echo.
echo [INFO] Bot stopped.
pause
