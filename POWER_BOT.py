#!/usr/bin/env python3
# ╔══════════════════════════════════════════════════════════════════════════╗
# ║     XM MT5 — ULTRA SCALPER BOT  (5-second tick bars)  v4.0            ║
# ║  Tick data resampled to 5s OHLCV bars                                  ║
# ║  EMA 3/8 cross + RSI(7) + tick momentum → fires on 2/3 agreement      ║
# ║  M1 trend filter  |  Tight 5-pip SL / 10-pip TP  |  6 concurrent      ║
# ╚══════════════════════════════════════════════════════════════════════════╝
#  pip install MetaTrader5 pandas numpy
#  python POWER_BOT.py

import sys, time, logging
from datetime import datetime, timezone, timedelta
from typing import Optional

import numpy as np
import pandas as pd

try:
    import MetaTrader5 as mt5
except ImportError:
    print("Run:  pip install MetaTrader5 pandas numpy")
    sys.exit(1)

# ══════════════════════════════════════════════════════════════════════════════
#  CONFIG
# ══════════════════════════════════════════════════════════════════════════════
LOGIN    = 336294735
PASSWORD = "Demo2024!1"
SERVER   = "XMGlobal-MT5 9"

TARGET_BALANCE  = 500.0
MAX_DD_PCT      = 0.40    # 40 % drawdown  → kill switch
DAILY_LOSS_PCT  = 0.25    # 25 % session loss → pause 4 h
RISK_PCT        = 0.20    # 20 % per trade (aggressive demo)
MAX_TRADES      = 6
MAGIC           = 55555
SCAN_SECS       = 5       # scan every 5 seconds

# Scalp settings
SL_PIPS         = 8       # stop loss in pips
TP_PIPS         = 16      # take profit in pips (2:1 R:R)
MAX_SPREAD_PIPS = 3.0     # skip if spread > 3 pips
TICK_WINDOW_SEC = 30      # look back 30 s of ticks for momentum

# Only the most liquid pairs — tight spreads, high tick volume
SCALP_SYMBOLS = [
    "EURUSD", "GBPUSD", "USDJPY", "USDCHF",
    "AUDUSD", "USDCAD", "NZDUSD", "EURJPY", "GBPJPY",
]

SYMBOL_VARIANTS = {
    "GOLD":   ["XAUUSD", "XAUUSDm", "GOLD"],
    "DOW":    ["US30", "DJ30", "WS30", "USA30"],
    "NASDAQ": ["USTEC", "NAS100", "NASDAQ", "US100"],
    "OIL":    ["USOIL", "OIL", "WTIUSD"],
    "SP500":  ["US500", "SP500", "USA500"],
    "SILVER": ["XAGUSD", "SILVER", "XAGUSDm"],
}

# ══════════════════════════════════════════════════════════════════════════════
#  LOGGING
# ══════════════════════════════════════════════════════════════════════════════
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%H:%M:%S",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("scalper.log", encoding="utf-8"),
    ],
)
log = logging.getLogger("SCALPER")

# ══════════════════════════════════════════════════════════════════════════════
#  TICK → 5-SECOND OHLCV BARS
# ══════════════════════════════════════════════════════════════════════════════

def get_tick_bars(symbol: str, seconds_back: int = 120) -> Optional[pd.DataFrame]:
    """Fetch ticks for last N seconds and resample into 5-second OHLCV bars."""
    utc_now  = datetime.now(timezone.utc)
    utc_from = utc_now - timedelta(seconds=seconds_back)

    ticks = mt5.copy_ticks_range(
        symbol,
        utc_from.replace(tzinfo=None),
        utc_now.replace(tzinfo=None),
        mt5.COPY_TICKS_ALL,
    )
    if ticks is None or len(ticks) < 10:
        return None

    df = pd.DataFrame(ticks)
    df["time"] = pd.to_datetime(df["time"], unit="s", utc=True)
    df = df.set_index("time")

    # mid price
    df["mid"] = (df["bid"] + df["ask"]) / 2

    # resample to 5-second bars
    bars = df["mid"].resample("5s").ohlc()
    bars["volume"] = df["mid"].resample("5s").count()
    bars.dropna(inplace=True)

    if len(bars) < 15:
        return None
    return bars


def get_m1_bars(symbol: str, n: int = 100) -> Optional[pd.DataFrame]:
    """Standard M1 bars for trend direction."""
    r = mt5.copy_rates_from_pos(symbol, mt5.TIMEFRAME_M1, 0, n)
    if r is None or len(r) < 30:
        return None
    df = pd.DataFrame(r)
    df["time"] = pd.to_datetime(df["time"], unit="s")
    df.rename(columns={"tick_volume": "volume"}, inplace=True)
    return df

# ══════════════════════════════════════════════════════════════════════════════
#  INDICATORS (fast, for 5-second bars)
# ══════════════════════════════════════════════════════════════════════════════

def ema(s: pd.Series, n: int) -> pd.Series:
    return s.ewm(span=n, adjust=False).mean()

def rsi(s: pd.Series, n: int = 7) -> pd.Series:
    d = s.diff()
    g = d.clip(lower=0).ewm(com=n-1, adjust=False).mean()
    l = (-d).clip(lower=0).ewm(com=n-1, adjust=False).mean()
    return 100 - 100 / (1 + g / l.replace(0, np.nan))

def atr_m1(df: pd.DataFrame, n: int = 7) -> float:
    h, l, c = df["high"], df["low"], df["close"]
    tr = pd.concat([(h-l), (h-c.shift()).abs(), (l-c.shift()).abs()], axis=1).max(axis=1)
    return tr.ewm(com=n-1, adjust=False).mean().iloc[-1]

# ══════════════════════════════════════════════════════════════════════════════
#  TICK MOMENTUM  (raw buy/sell pressure from bid moves)
# ══════════════════════════════════════════════════════════════════════════════

def tick_momentum(symbol: str) -> int:
    """
    Compare recent tick direction:
    count up-ticks vs down-ticks over last TICK_WINDOW_SEC seconds.
    Returns +1, -1, or 0.
    """
    utc_now  = datetime.now(timezone.utc)
    utc_from = utc_now - timedelta(seconds=TICK_WINDOW_SEC)

    ticks = mt5.copy_ticks_range(
        symbol,
        utc_from.replace(tzinfo=None),
        utc_now.replace(tzinfo=None),
        mt5.COPY_TICKS_ALL,
    )
    if ticks is None or len(ticks) < 5:
        return 0

    bids  = pd.Series([t[1] for t in ticks])   # bid prices
    diffs = bids.diff().dropna()
    ups   = (diffs > 0).sum()
    downs = (diffs < 0).sum()
    total = ups + downs
    if total == 0:
        return 0
    ratio = ups / total
    if ratio > 0.58:
        return 1
    if ratio < 0.42:
        return -1
    return 0

# ══════════════════════════════════════════════════════════════════════════════
#  SPREAD CHECK
# ══════════════════════════════════════════════════════════════════════════════

def spread_ok(symbol: str) -> bool:
    info = mt5.symbol_info(symbol)
    tick = mt5.symbol_info_tick(symbol)
    if info is None or tick is None:
        return False
    digits = info.digits
    pip    = 10 ** -(digits - 1) if digits in (3, 5) else 10 ** -digits
    spread_pips = (tick.ask - tick.bid) / pip
    return spread_pips <= MAX_SPREAD_PIPS

# ══════════════════════════════════════════════════════════════════════════════
#  SIGNAL ENGINE  — 3 fast signals, need 2/3
# ══════════════════════════════════════════════════════════════════════════════

def signal_score(symbol: str) -> int:
    """
    Returns +1 (BUY) / -1 (SELL) / 0 (skip).
    Uses 5-second tick bars + M1 trend.
    Fires on 2 out of 3 signals.
    """
    # ── 1. Spread filter ──────────────────────────────────────────────────
    if not spread_ok(symbol):
        return 0

    # ── Get 5s bars ───────────────────────────────────────────────────────
    bars5 = get_tick_bars(symbol, seconds_back=150)
    if bars5 is None:
        return 0

    close5 = bars5["close"]

    # ── Signal A : EMA 3/8 crossover on 5s bars ───────────────────────────
    e3 = ema(close5, 3)
    e8 = ema(close5, 8)
    sig_a = 0
    if e3.iloc[-1] > e8.iloc[-1] and e3.iloc[-2] <= e8.iloc[-2]:
        sig_a = 1
    elif e3.iloc[-1] < e8.iloc[-1] and e3.iloc[-2] >= e8.iloc[-2]:
        sig_a = -1

    # ── Signal B : RSI(7) extremes on 5s bars ─────────────────────────────
    rsi7  = rsi(close5, 7)
    rsi_v = rsi7.iloc[-1]
    sig_b = 0
    if rsi_v < 35:
        sig_b = 1
    elif rsi_v > 65:
        sig_b = -1

    # ── Signal C : Tick momentum ───────────────────────────────────────────
    sig_c = tick_momentum(symbol)

    # ── M1 trend filter ────────────────────────────────────────────────────
    df_m1 = get_m1_bars(symbol, 60)
    trend = 0
    if df_m1 is not None:
        e20 = ema(df_m1["close"], 20).iloc[-1]
        e50 = ema(df_m1["close"], 50).iloc[-1]
        trend = 1 if e20 > e50 else -1

    # ── Consensus: need 2 of 3 agreeing ───────────────────────────────────
    votes = [sig_a, sig_b, sig_c]
    bull  = sum(1 for v in votes if v ==  1)
    bear  = sum(1 for v in votes if v == -1)

    signal = 0
    if bull >= 2:
        signal = 1
    elif bear >= 2:
        signal = -1

    # Allow counter-trend only if all 3 agree; otherwise follow trend
    if signal != 0 and trend != 0:
        if signal != trend and (bull < 3 and bear < 3):
            signal = 0

    if signal != 0:
        direction = "BUY " if signal == 1 else "SELL"
        log.info(f"  SIGNAL [{symbol:10s}] {direction}  "
                 f"A={sig_a:+d} B={sig_b:+d} C={sig_c:+d}  "
                 f"rsi={rsi_v:.0f}  trend={'UP' if trend==1 else 'DN' if trend==-1 else '??'}")
    return signal

# ══════════════════════════════════════════════════════════════════════════════
#  LOT SIZING
# ══════════════════════════════════════════════════════════════════════════════

def calc_lot(symbol: str, balance: float, sl_pips: float) -> float:
    info = mt5.symbol_info(symbol)
    if info is None:
        return 0.01
    digits   = info.digits
    pip      = 10 ** -(digits - 1) if digits in (3, 5) else 10 ** -digits
    sl_pts   = sl_pips * pip
    tv       = info.trade_tick_value
    ts       = info.trade_tick_size
    if tv == 0 or ts == 0 or sl_pts == 0:
        return info.volume_min
    risk_usd     = balance * RISK_PCT
    val_per_lot  = (sl_pts / ts) * tv
    lot          = risk_usd / val_per_lot
    lot = max(info.volume_min, min(
        round(lot / info.volume_step) * info.volume_step,
        info.volume_max
    ))
    return round(lot, 2)

# ══════════════════════════════════════════════════════════════════════════════
#  ORDER EXECUTION
# ══════════════════════════════════════════════════════════════════════════════

def open_trade(symbol: str, direction: int, balance: float) -> bool:
    info = mt5.symbol_info(symbol)
    tick = mt5.symbol_info_tick(symbol)
    if info is None or tick is None:
        return False

    digits  = info.digits
    pip     = 10 ** -(digits - 1) if digits in (3, 5) else 10 ** -digits
    sl_dist = SL_PIPS * pip
    tp_dist = TP_PIPS * pip
    lot     = calc_lot(symbol, balance, SL_PIPS)

    if direction == 1:
        price = tick.ask
        sl    = round(price - sl_dist, digits)
        tp    = round(price + tp_dist, digits)
        otype = mt5.ORDER_TYPE_BUY
    else:
        price = tick.bid
        sl    = round(price + sl_dist, digits)
        tp    = round(price - tp_dist, digits)
        otype = mt5.ORDER_TYPE_SELL

    for filling in (mt5.ORDER_FILLING_IOC, mt5.ORDER_FILLING_FOK):
        r = mt5.order_send({
            "action":       mt5.TRADE_ACTION_DEAL,
            "symbol":       symbol,
            "volume":       lot,
            "type":         otype,
            "price":        price,
            "sl":           sl,
            "tp":           tp,
            "deviation":    20,
            "magic":        MAGIC,
            "comment":      "SCALPER",
            "type_time":    mt5.ORDER_TIME_GTC,
            "type_filling": filling,
        })
        if r and r.retcode == mt5.TRADE_RETCODE_DONE:
            side = "BUY " if direction == 1 else "SELL"
            log.info(f"  ✅ OPENED [{symbol}] {side} {lot} lots  "
                     f"@ {price}  SL={sl}  TP={tp}  ticket={r.order}")
            return True

    log.warning(f"  ❌ Order failed [{symbol}]: {mt5.last_error()}")
    return False


def close_all():
    for pos in (mt5.positions_get(magic=MAGIC) or []):
        tick  = mt5.symbol_info_tick(pos.symbol)
        if not tick:
            continue
        otype = mt5.ORDER_TYPE_SELL if pos.type == mt5.ORDER_TYPE_BUY else mt5.ORDER_TYPE_BUY
        price = tick.bid if pos.type == mt5.ORDER_TYPE_BUY else tick.ask
        mt5.order_send({
            "action":       mt5.TRADE_ACTION_DEAL,
            "position":     pos.ticket,
            "symbol":       pos.symbol,
            "volume":       pos.volume,
            "type":         otype,
            "price":        price,
            "deviation":    50,
            "magic":        MAGIC,
            "comment":      "CLOSE_ALL",
            "type_filling": mt5.ORDER_FILLING_IOC,
        })
    log.warning("All positions closed.")

# ══════════════════════════════════════════════════════════════════════════════
#  DASHBOARD
# ══════════════════════════════════════════════════════════════════════════════

def dashboard(balance, equity, peak, start, n_pos, n_wins, n_losses, trades_today):
    pnl   = balance - start
    pct   = pnl / start * 100
    prog  = min((balance - start) / (TARGET_BALANCE - start) * 100, 100)
    bar   = ("#" * int(prog / 5)).ljust(20)
    wr    = n_wins / (n_wins + n_losses) * 100 if (n_wins + n_losses) > 0 else 0
    dd    = (peak - equity) / peak * 100 if peak > 0 else 0
    print(f"""
+=========================================================+
|  Balance  : ${balance:>10.2f}     Equity : ${equity:.2f}
|  P&L      : ${pnl:>+10.2f}  ({pct:+.1f}%)
|  Drawdown : {dd:.1f}%              Open trades : {n_pos}
|  Progress : [{bar}] {prog:.1f}%
|  W/L      : {n_wins}/{n_losses}  WinRate: {wr:.0f}%  Today: {trades_today} trades
+=========================================================+""")

# ══════════════════════════════════════════════════════════════════════════════
#  SYMBOL DISCOVERY
# ══════════════════════════════════════════════════════════════════════════════

def resolve_extras() -> list:
    found = []
    for name, variants in SYMBOL_VARIANTS.items():
        for v in variants:
            if mt5.symbol_select(v, True) and mt5.symbol_info(v):
                found.append(v)
                log.info(f"  [AUTO] {name:8s} → {v}")
                break
        else:
            log.warning(f"  [AUTO] {name:8s} → not found on this server")
    return found


def enable_symbols() -> list:
    ok = []
    for s in SCALP_SYMBOLS:
        if mt5.symbol_select(s, True):
            ok.append(s)
    log.info("Searching extra symbols (Gold, Indices, Oil)...")
    ok.extend(resolve_extras())
    ok = list(dict.fromkeys(ok))
    log.info(f"Watchlist ({len(ok)}): {ok}")
    return ok

# ══════════════════════════════════════════════════════════════════════════════
#  INIT
# ══════════════════════════════════════════════════════════════════════════════

def init() -> bool:
    if not mt5.initialize():
        log.error("mt5.initialize() failed — open MT5 terminal first!")
        return False
    if not mt5.login(LOGIN, PASSWORD, SERVER):
        log.error(f"Login failed: {mt5.last_error()}")
        mt5.shutdown()
        return False
    info = mt5.account_info()
    log.info(f"Connected  account={info.login}  "
             f"balance=${info.balance:.2f}  leverage=1:{info.leverage}")
    return True

# ══════════════════════════════════════════════════════════════════════════════
#  MAIN LOOP
# ══════════════════════════════════════════════════════════════════════════════

def run():
    if not init():
        return

    symbols = enable_symbols()
    if not symbols:
        log.error("No symbols available.")
        mt5.shutdown()
        return

    acct         = mt5.account_info()
    start_bal    = acct.balance
    peak_bal     = start_bal
    last_disp    = 0
    n_wins       = 0
    n_losses     = 0
    trades_today = 0
    prev_closed  = set()
    last_day     = datetime.now().day

    print(f"""
+=========================================================+
|        XM ULTRA SCALPER BOT  —  5s TICK BARS           |
|  Start  : ${start_bal:.2f}      Target : ${TARGET_BALANCE:.2f}         |
|  SL     : {SL_PIPS} pips          TP : {TP_PIPS} pips              |
|  Risk   : {RISK_PCT*100:.0f}%/trade       Max : {MAX_TRADES} concurrent   |
|  Signal : 2/3 (EMA·RSI·TickFlow)                       |
|  Scan   : every {SCAN_SECS}s                                  |
|  Press Ctrl+C to stop safely                           |
+=========================================================+""")

    try:
        while True:
            acct = mt5.account_info()
            if acct is None:
                log.warning("Disconnected — reconnecting...")
                mt5.shutdown()
                time.sleep(5)
                if not init():
                    time.sleep(30)
                    continue
                acct = mt5.account_info()

            bal    = acct.balance
            equity = acct.equity
            peak_bal = max(peak_bal, bal)

            # Reset daily counter
            today = datetime.now().day
            if today != last_day:
                trades_today = 0
                last_day     = today

            # Track closed trades
            deals = mt5.history_deals_get(datetime(2000, 1, 1), datetime.now())
            if deals:
                for d in deals:
                    if (d.magic == MAGIC
                            and d.ticket not in prev_closed
                            and d.profit != 0):
                        prev_closed.add(d.ticket)
                        if d.profit > 0:
                            n_wins += 1
                        else:
                            n_losses += 1
                        trades_today += 1

            # ── TARGET ────────────────────────────────────────────────────
            if bal >= TARGET_BALANCE:
                log.info(f"TARGET ${TARGET_BALANCE:.0f} REACHED! "
                         f"Balance=${bal:.2f}  P&L=+${bal-start_bal:.2f}")
                close_all()
                break

            # ── MAX DRAWDOWN ───────────────────────────────────────────────
            dd = (peak_bal - equity) / peak_bal
            if dd >= MAX_DD_PCT:
                log.warning(f"DRAWDOWN {dd*100:.1f}% — EMERGENCY STOP!")
                close_all()
                break

            # ── DAILY LOSS ─────────────────────────────────────────────────
            if start_bal > 0 and (start_bal - bal) / start_bal >= DAILY_LOSS_PCT:
                log.warning("Daily loss limit hit — pausing 4h.")
                close_all()
                time.sleep(4 * 3600)
                acct      = mt5.account_info()
                start_bal = acct.balance if acct else start_bal
                continue

            # ── COUNT OPEN ─────────────────────────────────────────────────
            open_pos  = mt5.positions_get(magic=MAGIC) or []
            n_open    = len(open_pos)
            open_syms = {p.symbol for p in open_pos}

            # ── SCAN ALL SYMBOLS ───────────────────────────────────────────
            if n_open < MAX_TRADES:
                for sym in symbols:
                    if n_open >= MAX_TRADES:
                        break
                    if sym in open_syms:
                        continue
                    sig = signal_score(sym)
                    if sig != 0:
                        if open_trade(sym, sig, bal):
                            n_open   += 1
                            open_syms.add(sym)

            # ── DASHBOARD every 30s ────────────────────────────────────────
            if time.time() - last_disp >= 30:
                dashboard(bal, equity, peak_bal, start_bal,
                          n_open, n_wins, n_losses, trades_today)
                last_disp = time.time()

            time.sleep(SCAN_SECS)

    except KeyboardInterrupt:
        log.info("Stopped by user.")
        close_all()
    finally:
        mt5.shutdown()
        log.info("Done. Full history in scalper.log")


if __name__ == "__main__":
    run()
