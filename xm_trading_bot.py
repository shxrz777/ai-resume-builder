#!/usr/bin/env python3
"""
XM MT5 AI Trading Bot
Goal  : $100 → $500 (demo account)
Run   : python xm_trading_bot.py
Needs : Windows + MetaTrader5 terminal installed and running
"""

import sys
import time
import logging
from datetime import datetime
from typing import Optional

import numpy as np
import pandas as pd

try:
    import MetaTrader5 as mt5
except ImportError:
    print("[ERROR] MetaTrader5 not installed. Run: pip install MetaTrader5")
    sys.exit(1)

# ─────────────────────────── ACCOUNT ────────────────────────────────────────
LOGIN_XM   = 336294735
PASSWORD_XM = "Demo2024!1"
SERVER_XM  = "XMGlobal-MT5 9"

# ─────────────────────────── TARGETS ────────────────────────────────────────
TARGET_BALANCE      = 500.0   # stop trading when reached
MAX_DRAWDOWN_PCT    = 0.35    # emergency stop if down 35 % from peak
DAILY_LOSS_LIMIT_PCT = 0.20   # pause for the day if down 20 % in one session
RISK_PER_TRADE_PCT  = 0.12    # 12 % of balance per trade (aggressive demo)
MAX_OPEN_TRADES     = 4
MAGIC               = 20260421

# ─────────────────────────── SYMBOLS ────────────────────────────────────────
WATCHLIST = [
    "EURUSD", "GBPUSD", "USDJPY", "USDCHF",
    "AUDUSD", "USDCAD", "NZDUSD",
    "XAUUSD",   # Gold – high volatility
    "US30",     # Dow Jones
]

# ─────────────────────────── TIMEFRAMES ─────────────────────────────────────
TF_ENTRY = mt5.TIMEFRAME_M5   # 5-min entry
TF_TREND = mt5.TIMEFRAME_H1   # 1-hr trend filter

# ─────────────────────────── LOGGING ─────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("trading_bot.log", encoding="utf-8"),
    ],
)
log = logging.getLogger("XM_BOT")

# ════════════════════════════════════════════════════════════════════════════
#  INDICATORS
# ════════════════════════════════════════════════════════════════════════════

def ema(series: pd.Series, period: int) -> pd.Series:
    return series.ewm(span=period, adjust=False).mean()


def rsi(series: pd.Series, period: int = 14) -> pd.Series:
    delta = series.diff()
    gain  = delta.clip(lower=0)
    loss  = (-delta).clip(lower=0)
    avg_g = gain.ewm(com=period - 1, adjust=False).mean()
    avg_l = loss.ewm(com=period - 1, adjust=False).mean()
    rs    = avg_g / avg_l.replace(0, np.nan)
    return 100 - (100 / (1 + rs))


def macd(series: pd.Series, fast=12, slow=26, sig=9):
    fast_ema = ema(series, fast)
    slow_ema = ema(series, slow)
    macd_line = fast_ema - slow_ema
    signal_line = ema(macd_line, sig)
    hist = macd_line - signal_line
    return macd_line, signal_line, hist


def bollinger(series: pd.Series, period=20, std_dev=2.0):
    mid   = series.rolling(period).mean()
    std   = series.rolling(period).std()
    upper = mid + std_dev * std
    lower = mid - std_dev * std
    return upper, mid, lower


def atr(df: pd.DataFrame, period=14) -> pd.Series:
    high, low, close = df["high"], df["low"], df["close"]
    tr = pd.concat([
        high - low,
        (high - close.shift()).abs(),
        (low  - close.shift()).abs(),
    ], axis=1).max(axis=1)
    return tr.ewm(com=period - 1, adjust=False).mean()


# ════════════════════════════════════════════════════════════════════════════
#  DATA LAYER
# ════════════════════════════════════════════════════════════════════════════

def get_rates(symbol: str, timeframe: int, bars: int = 200) -> Optional[pd.DataFrame]:
    rates = mt5.copy_rates_from_pos(symbol, timeframe, 0, bars)
    if rates is None or len(rates) < 50:
        return None
    df = pd.DataFrame(rates)
    df["time"] = pd.to_datetime(df["time"], unit="s")
    return df.rename(columns={"open": "open", "high": "high",
                               "low": "low", "close": "close",
                               "tick_volume": "volume"})


# ════════════════════════════════════════════════════════════════════════════
#  SIGNAL ENGINE  (3 strategies combined → consensus required)
# ════════════════════════════════════════════════════════════════════════════

def score_symbol(symbol: str) -> int:
    """
    Returns +1 (buy), -1 (sell), 0 (no trade).
    Requires 2 of 3 strategy agreements on entry TF
    AND trend alignment on higher TF.
    """
    df_e = get_rates(symbol, TF_ENTRY, 200)
    df_t = get_rates(symbol, TF_TREND, 100)
    if df_e is None or df_t is None:
        return 0

    close_e = df_e["close"]
    close_t = df_t["close"]

    # ── Trend filter (H1) ───────────────────────────────────────────────────
    ema50_t = ema(close_t, 50).iloc[-1]
    ema200_t = ema(close_t, 200).iloc[-1]
    trend = 1 if ema50_t > ema200_t else -1

    # ── Strategy 1 : EMA crossover (M5) ────────────────────────────────────
    e9  = ema(close_e, 9)
    e21 = ema(close_e, 21)
    ema_cross = 0
    if e9.iloc[-1] > e21.iloc[-1] and e9.iloc[-2] <= e21.iloc[-2]:
        ema_cross = 1
    elif e9.iloc[-1] < e21.iloc[-1] and e9.iloc[-2] >= e21.iloc[-2]:
        ema_cross = -1

    # ── Strategy 2 : RSI extremes (M5) ─────────────────────────────────────
    rsi_val = rsi(close_e, 14).iloc[-1]
    rsi_sig = 0
    if rsi_val < 35:
        rsi_sig = 1
    elif rsi_val > 65:
        rsi_sig = -1

    # ── Strategy 3 : MACD histogram flip (M5) ──────────────────────────────
    _, _, hist = macd(close_e)
    macd_sig = 0
    if hist.iloc[-1] > 0 and hist.iloc[-2] <= 0:
        macd_sig = 1
    elif hist.iloc[-1] < 0 and hist.iloc[-2] >= 0:
        macd_sig = -1

    # ── Bollinger squeeze breakout (bonus confirmaton) ──────────────────────
    upper, _, lower = bollinger(close_e, 20, 2.0)
    bb_sig = 0
    last_close = close_e.iloc[-1]
    if last_close < lower.iloc[-1]:
        bb_sig = 1
    elif last_close > upper.iloc[-1]:
        bb_sig = -1

    # ── Consensus ──────────────────────────────────────────────────────────
    votes = [ema_cross, rsi_sig, macd_sig, bb_sig]
    bull  = sum(1 for v in votes if v == 1)
    bear  = sum(1 for v in votes if v == -1)

    signal = 0
    if bull >= 2:
        signal = 1
    elif bear >= 2:
        signal = -1

    # Trend filter: only take trades in trend direction
    if signal != 0 and signal != trend:
        signal = 0   # counter-trend → skip

    return signal


# ════════════════════════════════════════════════════════════════════════════
#  POSITION SIZING
# ════════════════════════════════════════════════════════════════════════════

def calc_lot(symbol: str, sl_pips: float, balance: float) -> float:
    """Kelly-inspired lot sizing: risk RISK_PER_TRADE_PCT of balance."""
    if sl_pips <= 0:
        return 0.01

    info = mt5.symbol_info(symbol)
    if info is None:
        return 0.01

    risk_amount = balance * RISK_PER_TRADE_PCT

    # pip value per lot (approximate: contract_size * point * 1 lot)
    point = info.point
    digits = info.digits
    pip = point * (10 if digits in (3, 5) else 1)

    tick_val  = info.trade_tick_value   # value of 1 tick for 1 lot
    tick_size = info.trade_tick_size

    if tick_size == 0 or tick_val == 0:
        return 0.01

    pip_value_per_lot = (pip / tick_size) * tick_val  # USD per pip per lot

    if pip_value_per_lot == 0:
        return 0.01

    lot = risk_amount / (sl_pips * pip_value_per_lot)
    lot = round(lot, 2)

    # Clamp to broker limits
    lot = max(info.volume_min, min(lot, info.volume_max))
    # Snap to step
    step = info.volume_step
    lot = round(lot / step) * step
    lot = round(lot, 2)
    return lot


# ════════════════════════════════════════════════════════════════════════════
#  ORDER EXECUTION
# ════════════════════════════════════════════════════════════════════════════

def open_trade(symbol: str, direction: int, balance: float) -> bool:
    """direction: 1=buy, -1=sell"""
    df = get_rates(symbol, TF_ENTRY, 50)
    if df is None:
        return False

    atr_val = atr(df, 14).iloc[-1]
    info    = mt5.symbol_info(symbol)
    if info is None:
        return False

    tick = mt5.symbol_info_tick(symbol)
    if tick is None:
        return False

    digits  = info.digits
    point   = info.point
    # ATR-based SL (1.5x ATR), TP (2.5x ATR → 1.67 R:R)
    sl_dist = atr_val * 1.5
    tp_dist = atr_val * 2.5

    if direction == 1:   # BUY
        order_type = mt5.ORDER_TYPE_BUY
        price = tick.ask
        sl    = round(price - sl_dist, digits)
        tp    = round(price + tp_dist, digits)
    else:                # SELL
        order_type = mt5.ORDER_TYPE_SELL
        price = tick.bid
        sl    = round(price + sl_dist, digits)
        tp    = round(price - tp_dist, digits)

    sl_pips = sl_dist / point / (10 if digits in (3, 5) else 1)
    lot     = calc_lot(symbol, sl_pips, balance)

    request = {
        "action":       mt5.TRADE_ACTION_DEAL,
        "symbol":       symbol,
        "volume":       lot,
        "type":         order_type,
        "price":        price,
        "sl":           sl,
        "tp":           tp,
        "deviation":    20,
        "magic":        MAGIC,
        "comment":      "XM_AI_BOT",
        "type_time":    mt5.ORDER_TIME_GTC,
        "type_filling": mt5.ORDER_FILLING_IOC,
    }

    result = mt5.order_send(request)
    if result is None:
        log.error(f"[{symbol}] order_send returned None")
        return False

    if result.retcode == mt5.TRADE_RETCODE_DONE:
        side = "BUY " if direction == 1 else "SELL"
        log.info(f"✅ [{symbol}] {side} {lot} lots @ {price:.{digits}f}  "
                 f"SL={sl:.{digits}f}  TP={tp:.{digits}f}  "
                 f"ticket={result.order}")
        return True
    else:
        log.warning(f"[{symbol}] Order failed: retcode={result.retcode}  "
                    f"comment={result.comment}")
        # Try IOC → FOK fallback
        request["type_filling"] = mt5.ORDER_FILLING_FOK
        result2 = mt5.order_send(request)
        if result2 and result2.retcode == mt5.TRADE_RETCODE_DONE:
            log.info(f"✅ [{symbol}] (FOK) order placed ticket={result2.order}")
            return True
        return False


def trail_stops():
    """Move SL to break-even once profit ≥ 1 R, then trail at 1 ATR."""
    positions = mt5.positions_get(magic=MAGIC)
    if not positions:
        return

    for pos in positions:
        symbol  = pos.symbol
        df      = get_rates(symbol, TF_ENTRY, 20)
        if df is None:
            continue
        atr_val  = atr(df, 14).iloc[-1]
        info     = mt5.symbol_info(symbol)
        if info is None:
            continue
        digits   = info.digits
        tick     = mt5.symbol_info_tick(symbol)
        if tick is None:
            continue

        new_sl = None
        if pos.type == mt5.ORDER_TYPE_BUY:
            current_price = tick.bid
            profit_dist   = current_price - pos.price_open
            if profit_dist >= atr_val * 1.5:                 # 1R in profit
                trail_sl = round(current_price - atr_val, digits)
                if trail_sl > pos.sl + info.point:           # only move up
                    new_sl = trail_sl
        else:  # SELL
            current_price = tick.ask
            profit_dist   = pos.price_open - current_price
            if profit_dist >= atr_val * 1.5:
                trail_sl = round(current_price + atr_val, digits)
                if trail_sl < pos.sl - info.point or pos.sl == 0:
                    new_sl = trail_sl

        if new_sl is not None:
            req = {
                "action":   mt5.TRADE_ACTION_SLTP,
                "position": pos.ticket,
                "sl":       new_sl,
                "tp":       pos.tp,
            }
            r = mt5.order_send(req)
            if r and r.retcode == mt5.TRADE_RETCODE_DONE:
                log.info(f"🔄 [{symbol}] Trailing SL → {new_sl:.{digits}f}  "
                         f"(ticket={pos.ticket})")


def close_all():
    """Emergency: close every open position."""
    positions = mt5.positions_get(magic=MAGIC)
    if not positions:
        return
    for pos in positions:
        tick = mt5.symbol_info_tick(pos.symbol)
        if tick is None:
            continue
        price = tick.bid if pos.type == mt5.ORDER_TYPE_BUY else tick.ask
        order_type = (mt5.ORDER_TYPE_SELL
                      if pos.type == mt5.ORDER_TYPE_BUY
                      else mt5.ORDER_TYPE_BUY)
        req = {
            "action":       mt5.TRADE_ACTION_DEAL,
            "position":     pos.ticket,
            "symbol":       pos.symbol,
            "volume":       pos.volume,
            "type":         order_type,
            "price":        price,
            "deviation":    50,
            "magic":        MAGIC,
            "comment":      "BOT_CLOSE",
            "type_filling": mt5.ORDER_FILLING_IOC,
        }
        mt5.order_send(req)
    log.warning("⚠️  All positions closed (emergency stop triggered).")


# ════════════════════════════════════════════════════════════════════════════
#  STATS DISPLAY
# ════════════════════════════════════════════════════════════════════════════

def print_status(balance: float, equity: float, peak: float, start_balance: float):
    pnl   = balance - start_balance
    pnl_p = pnl / start_balance * 100
    prog  = min((balance - start_balance) / (TARGET_BALANCE - start_balance) * 100, 100)
    bar   = ("█" * int(prog / 5)).ljust(20)
    pos   = mt5.positions_get(magic=MAGIC)
    n_pos = len(pos) if pos else 0

    print("\n" + "═" * 60)
    print(f"  Balance  : ${balance:.2f}   Equity : ${equity:.2f}")
    print(f"  P&L      : ${pnl:+.2f}  ({pnl_p:+.1f}%)")
    print(f"  Peak     : ${peak:.2f}   Open Trades: {n_pos}")
    print(f"  Progress : [{bar}] {prog:.1f}% → ${TARGET_BALANCE:.0f}")
    print("═" * 60 + "\n")


# ════════════════════════════════════════════════════════════════════════════
#  MAIN LOOP
# ════════════════════════════════════════════════════════════════════════════

def init_mt5() -> bool:
    if not mt5.initialize():
        log.error("MT5 initialize() failed – is the terminal running?")
        return False

    authorized = mt5.login(LOGIN_XM, PASSWORD_XM, SERVER_XM)
    if not authorized:
        log.error(f"Login failed: {mt5.last_error()}")
        mt5.shutdown()
        return False

    info = mt5.account_info()
    log.info(f"✅ Logged in  account={info.login}  server={info.server}  "
             f"balance=${info.balance:.2f}")
    return True


def verify_symbols() -> list:
    available = []
    for sym in WATCHLIST:
        if mt5.symbol_select(sym, True):
            available.append(sym)
        else:
            log.warning(f"Symbol not available / could not be enabled: {sym}")
    log.info(f"Active watchlist: {available}")
    return available


def already_trading(symbol: str) -> bool:
    positions = mt5.positions_get(symbol=symbol, magic=MAGIC)
    return bool(positions)


def run():
    if not init_mt5():
        return

    symbols = verify_symbols()
    if not symbols:
        log.error("No symbols available. Check broker / MT5 market watch.")
        mt5.shutdown()
        return

    info          = mt5.account_info()
    start_balance = info.balance
    peak_balance  = start_balance
    last_status   = time.time()
    scan_interval = 30  # seconds between full scans

    log.info("═" * 60)
    log.info(f"  🤖  XM AI Trading Bot STARTED")
    log.info(f"  Start balance : ${start_balance:.2f}")
    log.info(f"  Target        : ${TARGET_BALANCE:.2f}")
    log.info(f"  Max drawdown  : {MAX_DRAWDOWN_PCT*100:.0f}%")
    log.info(f"  Risk/trade    : {RISK_PER_TRADE_PCT*100:.0f}%")
    log.info("═" * 60)

    try:
        while True:
            info    = mt5.account_info()
            if info is None:
                log.warning("Lost MT5 connection – attempting reconnect…")
                mt5.shutdown()
                time.sleep(5)
                if not init_mt5():
                    time.sleep(30)
                    continue
                info = mt5.account_info()

            balance = info.balance
            equity  = info.equity

            # ── Update peak ────────────────────────────────────────────────
            peak_balance = max(peak_balance, balance)

            # ── TARGET reached ─────────────────────────────────────────────
            if balance >= TARGET_BALANCE:
                log.info(f"🎯 TARGET REACHED! Balance=${balance:.2f}  "
                         f"Profit=${balance - start_balance:.2f}  STOPPING.")
                close_all()
                break

            # ── Emergency drawdown stop ────────────────────────────────────
            drawdown = (peak_balance - equity) / peak_balance
            if drawdown >= MAX_DRAWDOWN_PCT:
                log.warning(f"🚨 DRAWDOWN {drawdown*100:.1f}% ≥ {MAX_DRAWDOWN_PCT*100:.0f}%  "
                             f"Emergency stop!")
                close_all()
                break

            # ── Daily loss guard ───────────────────────────────────────────
            session_loss = (start_balance - balance) / start_balance
            if session_loss >= DAILY_LOSS_LIMIT_PCT:
                log.warning(f"⛔ Daily loss limit {session_loss*100:.1f}% hit. "
                             f"Closing all & pausing 4h.")
                close_all()
                time.sleep(4 * 3600)
                info = mt5.account_info()
                start_balance = info.balance if info else start_balance
                continue

            # ── Trail open positions ───────────────────────────────────────
            trail_stops()

            # ── Count open trades ──────────────────────────────────────────
            open_positions = mt5.positions_get(magic=MAGIC)
            n_open = len(open_positions) if open_positions else 0

            # ── Scan for new signals ───────────────────────────────────────
            if n_open < MAX_OPEN_TRADES:
                for sym in symbols:
                    if n_open >= MAX_OPEN_TRADES:
                        break
                    if already_trading(sym):
                        continue
                    signal = score_symbol(sym)
                    if signal != 0:
                        success = open_trade(sym, signal, balance)
                        if success:
                            n_open += 1
                            time.sleep(1)  # small pause between orders

            # ── Periodic status print ──────────────────────────────────────
            if time.time() - last_status >= 60:
                print_status(balance, equity, peak_balance, start_balance)
                last_status = time.time()

            time.sleep(scan_interval)

    except KeyboardInterrupt:
        log.info("⌨️  Keyboard interrupt – shutting down gracefully.")
        close_all()
    finally:
        mt5.shutdown()
        log.info("MT5 connection closed.")


# ════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    run()
