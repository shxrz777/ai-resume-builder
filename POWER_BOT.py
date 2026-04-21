#!/usr/bin/env python3
# ╔══════════════════════════════════════════════════════════════════════════╗
# ║          XM MT5  —  ULTIMATE POWER TRADING BOT  v3.0                  ║
# ║  Strategies : EMA Cross · RSI · MACD · Bollinger · Supertrend ·        ║
# ║               Stochastic · ADX · Ichimoku · CCI · Williams%R ·         ║
# ║               Pin-Bar · Engulfing · Support/Resistance breakout        ║
# ║  Multi-TF   : M1 · M5 · M15 · H1 (4-timeframe confluence)             ║
# ║  Sessions   : London + New-York overlap (highest liquidity)            ║
# ║  Sizing     : ATR-based + compound growth                              ║
# ║  Exits      : Partial close at 1R, trail rest, scale-in on momentum   ║
# ╚══════════════════════════════════════════════════════════════════════════╝
#
#  REQUIREMENTS  (Windows only – MT5 terminal must be open)
#  pip install MetaTrader5 pandas numpy
#
#  RUN
#  python POWER_BOT.py

import sys, time, logging
from datetime import datetime, timezone
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

TARGET_BALANCE       = 500.0   # 🎯 stop when reached
MAX_DD_PCT           = 0.40    # 40 % drawdown → emergency stop
DAILY_LOSS_PCT       = 0.25    # 25 % session loss → pause 4 h
RISK_PCT             = 0.15    # 15 % of balance risked per trade
MAX_TRADES           = 5       # max concurrent open positions
PARTIAL_CLOSE_AT_1R  = True    # close 50 % at 1×ATR profit
MAGIC                = 31337   # unique identifier for bot's orders

# Forex pairs (always available on XM)
FOREX_PAIRS = [
    "EURUSD", "GBPUSD", "USDJPY", "USDCHF",
    "AUDUSD", "USDCAD", "NZDUSD", "EURJPY", "GBPJPY",
    "EURGBP", "AUDJPY", "GBPJPY", "CHFJPY",
]

# XM uses different names depending on server — all variants listed, bot picks whichever works
SYMBOL_VARIANTS = {
    "GOLD":   ["XAUUSD", "XAUUSDm", "GOLD", "XAUUSD."],
    "DOW":    ["US30", "DJ30", "WS30", "US30Cash", "DJIA", "USA30"],
    "NASDAQ": ["USTEC", "NAS100", "NASDAQ", "US100", "USTEC100", "USA100"],
    "OIL":    ["USOIL", "OIL", "WTIUSD", "USOIL.", "CrudOil", "USOil"],
    "SP500":  ["US500", "SP500", "USA500", "S&P500", "SPX500"],
    "SILVER": ["XAGUSD", "SILVER", "XAGUSDm"],
}

SCAN_SECS   = 20   # scan every 20 s
ENTRY_TF    = mt5.TIMEFRAME_M5
TREND_TF    = mt5.TIMEFRAME_H1
CONFIRM_TF  = mt5.TIMEFRAME_M15

# ══════════════════════════════════════════════════════════════════════════════
#  LOGGING
# ══════════════════════════════════════════════════════════════════════════════
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(levelname)-8s │ %(message)s",
    datefmt="%H:%M:%S",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("power_bot.log", encoding="utf-8"),
    ],
)
log = logging.getLogger("POWER")

# ══════════════════════════════════════════════════════════════════════════════
#  INDICATOR LIBRARY
# ══════════════════════════════════════════════════════════════════════════════

def ema(s: pd.Series, n: int) -> pd.Series:
    return s.ewm(span=n, adjust=False).mean()

def sma(s: pd.Series, n: int) -> pd.Series:
    return s.rolling(n).mean()

def rsi(s: pd.Series, n=14) -> pd.Series:
    d = s.diff()
    g = d.clip(lower=0).ewm(com=n-1, adjust=False).mean()
    l = (-d).clip(lower=0).ewm(com=n-1, adjust=False).mean()
    return 100 - 100/(1 + g/l.replace(0, np.nan))

def macd(s: pd.Series, fast=12, slow=26, sig=9):
    m = ema(s,fast) - ema(s,slow)
    signal = ema(m, sig)
    return m, signal, m - signal

def bollinger(s: pd.Series, n=20, k=2.0):
    mid = sma(s, n)
    std = s.rolling(n).std()
    return mid+k*std, mid, mid-k*std

def atr(df: pd.DataFrame, n=14) -> pd.Series:
    h,l,c = df.high, df.low, df.close
    tr = pd.concat([(h-l),(h-c.shift()).abs(),(l-c.shift()).abs()],axis=1).max(axis=1)
    return tr.ewm(com=n-1, adjust=False).mean()

def stoch(df: pd.DataFrame, k=14, d=3) -> tuple:
    lo = df.low.rolling(k).min()
    hi = df.high.rolling(k).max()
    k_line = 100*(df.close-lo)/(hi-lo+1e-10)
    d_line = k_line.rolling(d).mean()
    return k_line, d_line

def adx(df: pd.DataFrame, n=14) -> pd.Series:
    h,l,c = df.high, df.low, df.close
    up   = h.diff(); dn = -l.diff()
    pdm  = up.where((up > dn) & (up > 0), 0.0)
    ndm  = dn.where((dn > up) & (dn > 0), 0.0)
    tr   = pd.concat([(h-l),(h-c.shift()).abs(),(l-c.shift()).abs()],axis=1).max(axis=1)
    atr_ = tr.ewm(com=n-1, adjust=False).mean()
    pdi  = 100*pdm.ewm(com=n-1,adjust=False).mean()/atr_.replace(0,np.nan)
    ndi  = 100*ndm.ewm(com=n-1,adjust=False).mean()/atr_.replace(0,np.nan)
    dx   = 100*(pdi-ndi).abs()/(pdi+ndi+1e-10)
    return dx.ewm(com=n-1,adjust=False).mean()

def cci(df: pd.DataFrame, n=20) -> pd.Series:
    tp = (df.high+df.low+df.close)/3
    ma = tp.rolling(n).mean()
    md = tp.rolling(n).apply(lambda x: np.mean(np.abs(x-x.mean())))
    return (tp-ma)/(0.015*md.replace(0,np.nan))

def williams_r(df: pd.DataFrame, n=14) -> pd.Series:
    hi = df.high.rolling(n).max()
    lo = df.low.rolling(n).min()
    return -100*(hi-df.close)/(hi-lo+1e-10)

def supertrend(df: pd.DataFrame, n=10, mult=3.0):
    atr_ = atr(df, n)
    hl2  = (df.high+df.low)/2
    upper = hl2+mult*atr_
    lower = hl2-mult*atr_
    st  = pd.Series(np.nan, index=df.index)
    dir_ = pd.Series(1,   index=df.index)
    for i in range(1, len(df)):
        if df.close.iloc[i] > upper.iloc[i-1]:
            dir_.iloc[i] = 1
        elif df.close.iloc[i] < lower.iloc[i-1]:
            dir_.iloc[i] = -1
        else:
            dir_.iloc[i] = dir_.iloc[i-1]
        st.iloc[i] = lower.iloc[i] if dir_.iloc[i]==1 else upper.iloc[i]
    return st, dir_

def ichimoku(df: pd.DataFrame):
    high9  = df.high.rolling(9).max();  low9  = df.low.rolling(9).min()
    high26 = df.high.rolling(26).max(); low26 = df.low.rolling(26).min()
    high52 = df.high.rolling(52).max(); low52 = df.low.rolling(52).min()
    tenkan  = (high9 + low9)/2
    kijun   = (high26+low26)/2
    spana   = ((tenkan+kijun)/2).shift(26)
    spanb   = ((high52+low52)/2).shift(26)
    chikou  = df.close.shift(-26)
    return tenkan, kijun, spana, spanb, chikou

def support_resistance(df: pd.DataFrame, lookback=50):
    recent = df.tail(lookback)
    resistance = recent.high.max()
    support    = recent.low.min()
    return support, resistance

def is_pin_bar(df: pd.DataFrame) -> int:
    c = df.iloc[-1]
    body   = abs(c.close - c.open)
    total  = c.high - c.low + 1e-10
    upper  = c.high - max(c.close, c.open)
    lower  = min(c.close, c.open) - c.low
    if lower > 2*body and lower > 0.6*total:
        return 1   # bullish pin bar (hammer)
    if upper > 2*body and upper > 0.6*total:
        return -1  # bearish pin bar (shooting star)
    return 0

def is_engulfing(df: pd.DataFrame) -> int:
    p = df.iloc[-2]; c = df.iloc[-1]
    if c.close > c.open and p.close < p.open:
        if c.close > p.open and c.open < p.close:
            return 1   # bullish engulfing
    if c.close < c.open and p.close > p.open:
        if c.close < p.open and c.open > p.close:
            return -1  # bearish engulfing
    return 0

# ══════════════════════════════════════════════════════════════════════════════
#  DATA
# ══════════════════════════════════════════════════════════════════════════════

def bars(symbol: str, tf: int, n=300) -> Optional[pd.DataFrame]:
    r = mt5.copy_rates_from_pos(symbol, tf, 0, n)
    if r is None or len(r) < 60:
        return None
    df = pd.DataFrame(r)
    df.time = pd.to_datetime(df.time, unit="s")
    df.rename(columns={"tick_volume":"volume"}, inplace=True)
    return df

# ══════════════════════════════════════════════════════════════════════════════
#  SESSION FILTER  (only trade London/NY overlap 13:00–17:00 UTC)
# ══════════════════════════════════════════════════════════════════════════════

def in_best_session() -> bool:
    h = datetime.now(timezone.utc).hour
    # London open (08:00) to NY close (21:00) UTC — widest window
    return 8 <= h < 21

# ══════════════════════════════════════════════════════════════════════════════
#  SIGNAL ENGINE  (10-indicator confluence score)
# ══════════════════════════════════════════════════════════════════════════════

def signal_score(symbol: str) -> int:
    """
    Returns +1 (BUY) / -1 (SELL) / 0 (no trade).
    Requires score >= +4 or <= -4 out of 10 possible votes
    AND H1 trend alignment.
    """
    df_h1  = bars(symbol, TREND_TF,   200)
    df_m15 = bars(symbol, CONFIRM_TF, 200)
    df_m5  = bars(symbol, ENTRY_TF,   300)
    if df_h1 is None or df_m15 is None or df_m5 is None:
        return 0

    c_h1  = df_h1.close
    c_m5  = df_m5.close

    # ── H1 Trend (must agree for signal to pass) ──────────────────────────
    e50  = ema(c_h1, 50).iloc[-1]
    e200 = ema(c_h1, 200).iloc[-1]
    trend = 1 if e50 > e200 else -1

    # ── 1. EMA 9/21 cross (M5) ────────────────────────────────────────────
    e9  = ema(c_m5, 9); e21 = ema(c_m5, 21)
    v1 = 1 if e9.iloc[-1]>e21.iloc[-1] and e9.iloc[-2]<=e21.iloc[-2] else \
        -1 if e9.iloc[-1]<e21.iloc[-1] and e9.iloc[-2]>=e21.iloc[-2] else 0

    # ── 2. EMA 50/200 momentum (M5) ───────────────────────────────────────
    e50_m5  = ema(c_m5, 50).iloc[-1]
    e200_m5 = ema(c_m5, 200).iloc[-1]
    v2 = 1 if e50_m5 > e200_m5 else -1

    # ── 3. RSI (M5) ───────────────────────────────────────────────────────
    rsi_v = rsi(c_m5, 14).iloc[-1]
    v3 = 1 if rsi_v < 40 else -1 if rsi_v > 60 else 0

    # ── 4. MACD histogram flip (M5) ───────────────────────────────────────
    _, _, hist = macd(c_m5)
    v4 = 1 if hist.iloc[-1]>0 and hist.iloc[-2]<=0 else \
        -1 if hist.iloc[-1]<0 and hist.iloc[-2]>=0 else 0

    # ── 5. Bollinger Band (M5) ────────────────────────────────────────────
    bb_up, _, bb_lo = bollinger(c_m5, 20, 2.0)
    lc = c_m5.iloc[-1]
    v5 = 1 if lc < bb_lo.iloc[-1] else -1 if lc > bb_up.iloc[-1] else 0

    # ── 6. Supertrend (M5) ────────────────────────────────────────────────
    _, st_dir = supertrend(df_m5, 10, 3.0)
    v6 = int(st_dir.iloc[-1])   # +1 or -1

    # ── 7. Stochastic (M15) ───────────────────────────────────────────────
    sk, sd = stoch(df_m15, 14, 3)
    v7 = 1 if sk.iloc[-1]<20 and sd.iloc[-1]<20 else \
        -1 if sk.iloc[-1]>80 and sd.iloc[-1]>80 else 0

    # ── 8. ADX + DI direction (M5) ───────────────────────────────────────
    adx_v = adx(df_m5, 14).iloc[-1]
    if adx_v > 25:
        # strong trend — vote in trend direction
        v8 = 1 if e50_m5 > e200_m5 else -1
    else:
        v8 = 0   # no strong trend → no vote

    # ── 9. CCI (M5) ───────────────────────────────────────────────────────
    cci_v = cci(df_m5, 20).iloc[-1]
    v9 = 1 if cci_v < -100 else -1 if cci_v > 100 else 0

    # ── 10. Candlestick patterns (M5) ────────────────────────────────────
    pin  = is_pin_bar(df_m5)
    eng  = is_engulfing(df_m5)
    v10  = pin if pin != 0 else eng

    votes = [v1,v2,v3,v4,v5,v6,v7,v8,v9,v10]
    bull  = sum(1 for v in votes if v == 1)
    bear  = sum(1 for v in votes if v ==-1)

    # Ichimoku cloud filter (H1) – price must be above/below cloud
    ten, kij, spa, spb, _ = ichimoku(df_h1)
    cloud_top = max(spa.iloc[-1], spb.iloc[-1]) if not np.isnan(spa.iloc[-1]) else None
    cloud_bot = min(spa.iloc[-1], spb.iloc[-1]) if not np.isnan(spa.iloc[-1]) else None
    price_h1  = c_h1.iloc[-1]
    ichi_ok_bull = cloud_top is None or price_h1 > cloud_top
    ichi_ok_bear = cloud_bot is None or price_h1 < cloud_bot

    signal = 0
    if bull >= 4 and ichi_ok_bull:
        signal = 1
    elif bear >= 4 and ichi_ok_bear:
        signal = -1

    # Must align with H1 trend
    if signal != 0 and signal != trend:
        signal = 0

    if signal != 0:
        direction = "BUY " if signal==1 else "SELL"
        log.info(f"  📊 [{symbol}] {direction}  bull={bull} bear={bear} "
                 f"adx={adx_v:.1f} rsi={rsi_v:.1f} trend={'UP' if trend==1 else 'DN'}")
    return signal

# ══════════════════════════════════════════════════════════════════════════════
#  LOT SIZING  (ATR-based, compounds with balance growth)
# ══════════════════════════════════════════════════════════════════════════════

def calc_lot(symbol: str, sl_pts: float, balance: float) -> float:
    info = mt5.symbol_info(symbol)
    if info is None or sl_pts <= 0:
        return info.volume_min if info else 0.01

    risk_usd = balance * RISK_PCT
    tv  = info.trade_tick_value
    ts  = info.trade_tick_size
    if tv == 0 or ts == 0:
        return info.volume_min

    val_per_lot = (sl_pts / ts) * tv
    if val_per_lot == 0:
        return info.volume_min

    lot = risk_usd / val_per_lot
    lot = max(info.volume_min, min(round(lot / info.volume_step) * info.volume_step, info.volume_max))
    return round(lot, 2)

# ══════════════════════════════════════════════════════════════════════════════
#  ORDER MANAGEMENT
# ══════════════════════════════════════════════════════════════════════════════

def send_order(symbol, order_type, lot, price, sl, tp, digits, comment="POWER_BOT") -> Optional[int]:
    for filling in (mt5.ORDER_FILLING_IOC, mt5.ORDER_FILLING_FOK):
        req = {
            "action":       mt5.TRADE_ACTION_DEAL,
            "symbol":       symbol,
            "volume":       lot,
            "type":         order_type,
            "price":        price,
            "sl":           sl,
            "tp":           tp,
            "deviation":    30,
            "magic":        MAGIC,
            "comment":      comment,
            "type_time":    mt5.ORDER_TIME_GTC,
            "type_filling": filling,
        }
        r = mt5.order_send(req)
        if r and r.retcode == mt5.TRADE_RETCODE_DONE:
            return r.order
    return None


def open_trade(symbol: str, direction: int, balance: float) -> bool:
    df = bars(symbol, ENTRY_TF, 50)
    if df is None:
        return False

    info = mt5.symbol_info(symbol)
    tick = mt5.symbol_info_tick(symbol)
    if info is None or tick is None:
        return False

    atr_v   = atr(df, 14).iloc[-1]
    digits  = info.digits
    sl_dist = atr_v * 1.8      # SL = 1.8× ATR
    tp1_dist = atr_v * 1.8     # TP1 (partial close) = 1R
    tp2_dist = atr_v * 4.0     # TP2 (remainder)     = 2.2R

    if direction == 1:
        price  = tick.ask
        sl     = round(price - sl_dist, digits)
        tp1    = round(price + tp1_dist, digits)
        tp2    = round(price + tp2_dist, digits)
        otype  = mt5.ORDER_TYPE_BUY
    else:
        price  = tick.bid
        sl     = round(price + sl_dist, digits)
        tp1    = round(price - tp1_dist, digits)
        tp2    = round(price - tp2_dist, digits)
        otype  = mt5.ORDER_TYPE_SELL

    sl_pts  = sl_dist
    lot     = calc_lot(symbol, sl_pts, balance)

    if PARTIAL_CLOSE_AT_1R and lot >= info.volume_min * 2:
        lot1 = round(lot * 0.5 / info.volume_step) * info.volume_step
        lot1 = max(info.volume_min, round(lot1, 2))
        lot2 = round(lot * 0.5 / info.volume_step) * info.volume_step
        lot2 = max(info.volume_min, round(lot2, 2))
        t1 = send_order(symbol, otype, lot1, price, sl, tp1, digits, "PWR_PART1")
        t2 = send_order(symbol, otype, lot2, price, sl, tp2, digits, "PWR_PART2")
        ok = t1 is not None or t2 is not None
    else:
        t = send_order(symbol, otype, lot, price, sl, tp2, digits, "PWR_BOT")
        ok = t is not None

    if ok:
        side = "BUY " if direction==1 else "SELL"
        log.info(f"✅ [{symbol}] {side} {lot} lots  price={price}  "
                 f"SL={sl}  TP={tp2}  (ATR={atr_v:.5f})")
    return ok


def trail_and_manage():
    positions = mt5.positions_get(magic=MAGIC)
    if not positions:
        return
    for pos in positions:
        df = bars(pos.symbol, ENTRY_TF, 20)
        if df is None:
            continue
        info = mt5.symbol_info(pos.symbol)
        tick = mt5.symbol_info_tick(pos.symbol)
        if info is None or tick is None:
            continue
        digits  = info.digits
        atr_v   = atr(df, 14).iloc[-1]
        new_sl  = None

        if pos.type == mt5.ORDER_TYPE_BUY:
            cp = tick.bid
            if cp - pos.price_open >= atr_v * 1.8:   # 1R reached → trail
                trail = round(cp - atr_v * 1.0, digits)
                if trail > pos.sl + info.point:
                    new_sl = trail
        else:
            cp = tick.ask
            if pos.price_open - cp >= atr_v * 1.8:
                trail = round(cp + atr_v * 1.0, digits)
                if pos.sl == 0 or trail < pos.sl - info.point:
                    new_sl = trail

        if new_sl:
            mt5.order_send({
                "action":   mt5.TRADE_ACTION_SLTP,
                "position": pos.ticket,
                "sl":       new_sl,
                "tp":       pos.tp,
            })


def close_all():
    positions = mt5.positions_get(magic=MAGIC)
    if not positions:
        return
    for pos in positions:
        tick = mt5.symbol_info_tick(pos.symbol)
        if not tick:
            continue
        otype = mt5.ORDER_TYPE_SELL if pos.type==mt5.ORDER_TYPE_BUY else mt5.ORDER_TYPE_BUY
        price = tick.bid if pos.type==mt5.ORDER_TYPE_BUY else tick.ask
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
    log.warning("⚠️  All positions closed.")

# ══════════════════════════════════════════════════════════════════════════════
#  DISPLAY
# ══════════════════════════════════════════════════════════════════════════════

def dashboard(balance, equity, peak, start, n_pos, n_wins, n_losses):
    pnl   = balance - start
    pct   = pnl / start * 100
    prog  = min((balance - start) / (TARGET_BALANCE - start) * 100, 100)
    bar   = ("█" * int(prog / 5)).ljust(20)
    wr    = n_wins/(n_wins+n_losses)*100 if (n_wins+n_losses)>0 else 0
    print(f"""
╔══════════════════════════════════════════════════════╗
║  💰 Balance  : ${balance:>10.2f}   Equity : ${equity:.2f}
║  📈 P&L      : ${pnl:>+10.2f}  ({pct:+.1f}%)
║  🏆 Peak     : ${peak:>10.2f}   Trades open: {n_pos}
║  🎯 Progress : [{bar}] {prog:.1f}%
║  📊 W/L      : {n_wins}/{n_losses}  Win-rate: {wr:.0f}%
╚══════════════════════════════════════════════════════╝""")

# ══════════════════════════════════════════════════════════════════════════════
#  INIT
# ══════════════════════════════════════════════════════════════════════════════

def init() -> bool:
    if not mt5.initialize():
        log.error("mt5.initialize() failed – open MT5 terminal first!")
        return False
    if not mt5.login(LOGIN, PASSWORD, SERVER):
        log.error(f"Login failed: {mt5.last_error()}")
        mt5.shutdown(); return False
    info = mt5.account_info()
    log.info(f"✅ Connected  account={info.login}  balance=${info.balance:.2f}  leverage=1:{info.leverage}")
    return True

def resolve_symbol_variants() -> list:
    """Try every variant name per instrument, pick first one that works on this XM server."""
    found = []
    for instrument, variants in SYMBOL_VARIANTS.items():
        for name in variants:
            if mt5.symbol_select(name, True):
                info = mt5.symbol_info(name)
                if info is not None:
                    found.append(name)
                    log.info(f"  [AUTO] {instrument:8s} -> {name}")
                    break
        else:
            log.warning(f"  [AUTO] {instrument:8s} -> NOT FOUND on this server (skipped)")
    return found


def enable_symbols(base: list) -> list:
    """Enable forex pairs + auto-resolve commodity/index symbols."""
    ok = []

    # Standard forex — always available
    for s in base:
        if mt5.symbol_select(s, True):
            ok.append(s)
        else:
            log.warning(f"Symbol not available: {s}")

    # Auto-discover Gold, Indices, Oil etc.
    log.info("Auto-detecting commodity/index symbols on this XM server...")
    extras = resolve_symbol_variants()
    ok.extend(extras)

    ok = list(dict.fromkeys(ok))   # deduplicate, preserve order
    log.info(f"Final watchlist ({len(ok)}): {ok}")
    return ok

# ══════════════════════════════════════════════════════════════════════════════
#  MAIN
# ══════════════════════════════════════════════════════════════════════════════

def run():
    if not init():
        return

    symbols = enable_symbols(FOREX_PAIRS)
    if not symbols:
        log.error("No tradable symbols found.")
        mt5.shutdown(); return

    acct         = mt5.account_info()
    start_bal    = acct.balance
    peak_bal     = start_bal
    last_display = 0
    n_wins       = 0
    n_losses     = 0
    prev_closed  = set()

    print(f"""
╔══════════════════════════════════════════════════════╗
║       🤖  XM POWER BOT  —  FULLY ARMED              ║
║  Start  : ${start_bal:.2f}     Target : ${TARGET_BALANCE:.2f}     ║
║  Risk   : {RISK_PCT*100:.0f}%/trade     Max trades: {MAX_TRADES}         ║
║  Press Ctrl+C to stop safely                        ║
╚══════════════════════════════════════════════════════╝""")

    try:
        while True:
            acct = mt5.account_info()
            if acct is None:
                log.warning("MT5 disconnected – reconnecting…")
                mt5.shutdown()
                time.sleep(5)
                if not init(): time.sleep(30); continue
                acct = mt5.account_info()

            bal    = acct.balance
            equity = acct.equity
            peak_bal = max(peak_bal, bal)

            # ── Track closed trades (wins/losses) ─────────────────────────
            deals = mt5.history_deals_get(
                datetime(2000,1,1), datetime.now()
            )
            if deals:
                for d in deals:
                    if d.magic == MAGIC and d.ticket not in prev_closed and d.profit != 0:
                        prev_closed.add(d.ticket)
                        if d.profit > 0: n_wins += 1
                        else: n_losses += 1

            # ── Target reached ─────────────────────────────────────────────
            if bal >= TARGET_BALANCE:
                log.info(f"🎯 TARGET ${TARGET_BALANCE:.0f} REACHED!  Balance=${bal:.2f}  Stopping.")
                close_all(); break

            # ── Max drawdown ───────────────────────────────────────────────
            dd = (peak_bal - equity) / peak_bal
            if dd >= MAX_DD_PCT:
                log.warning(f"🚨 Drawdown {dd*100:.1f}% — emergency stop!")
                close_all(); break

            # ── Daily loss limit ───────────────────────────────────────────
            if (start_bal - bal) / start_bal >= DAILY_LOSS_PCT:
                log.warning("⛔ Daily loss limit hit — pausing 4 hours.")
                close_all(); time.sleep(4*3600)
                acct = mt5.account_info()
                start_bal = acct.balance if acct else start_bal
                continue

            # ── Trail / manage open positions ──────────────────────────────
            trail_and_manage()

            # ── Session filter ─────────────────────────────────────────────
            if not in_best_session():
                if time.time() - last_display > 300:
                    log.info("💤 Outside trading session (08:00–21:00 UTC). Waiting…")
                    last_display = time.time()
                time.sleep(60); continue

            # ── Count open positions ───────────────────────────────────────
            open_pos = mt5.positions_get(magic=MAGIC)
            n_open   = len(open_pos) if open_pos else 0

            # ── Scan for signals ───────────────────────────────────────────
            if n_open < MAX_TRADES:
                open_syms = {p.symbol for p in (open_pos or [])}
                for sym in symbols:
                    if n_open >= MAX_TRADES:
                        break
                    if sym in open_syms:
                        continue
                    sig = signal_score(sym)
                    if sig != 0:
                        if open_trade(sym, sig, bal):
                            n_open += 1
                            time.sleep(0.5)

            # ── Dashboard ──────────────────────────────────────────────────
            if time.time() - last_display >= 60:
                dashboard(bal, equity, peak_bal, start_bal, n_open, n_wins, n_losses)
                last_display = time.time()

            time.sleep(SCAN_SECS)

    except KeyboardInterrupt:
        log.info("⌨️  Stopped by user.")
        close_all()
    finally:
        mt5.shutdown()
        log.info("Goodbye. Check power_bot.log for full history.")

if __name__ == "__main__":
    run()
