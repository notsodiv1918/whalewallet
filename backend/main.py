from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from backend.etherscan import get_wallet_transactions, get_wallet_balance
from analysis import analyze_wallet, analyze_event_behavior, calculate_suspicion_score
import uvicorn
from collections import deque
import json
import os
import time
import re

app = FastAPI(title="Whale Tracker API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load wallets from JSON file
WALLETS_FILE = os.path.join(os.path.dirname(__file__), 'wallets.json')
MAX_INTEL_WALLETS = int(os.getenv('MAX_INTEL_WALLETS', '60'))
WALLET_CACHE_TTL_SECONDS = int(os.getenv('WALLET_CACHE_TTL_SECONDS', '120'))

# Simple in-memory cache to reduce repeated Etherscan calls for the same wallet.
_WALLET_CACHE = {}
_DASHBOARD_INTEL_HISTORY = deque(maxlen=24)
ETH_ADDRESS_RE = re.compile(r"^0x[a-fA-F0-9]{40}$")
PLACEHOLDER_NAME_RE = re.compile(r"^whale wallet \d+$", re.IGNORECASE)

# Curated wallets with known on-chain activity to avoid synthetic/generated entries.
CURATED_REAL_WALLETS = [
    {"id": "vitalik", "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", "name": "Vitalik Buterin"},
    {"id": "wintermute", "address": "0x28C6c06298d514Db089934071355E5743bf21d60", "name": "Binance 14 (Wintermute-linked)"},
    {"id": "jump_trading", "address": "0x9507c04b10486547584C37BCBd931B2A4Fe4A4bE", "name": "Jump Trading"},
    {"id": "kraken_10", "address": "0x267be1C1D684F78cb4F6a176C4911b741E4Ffdc0", "name": "Kraken 10"},
    {"id": "bitfinex_2", "address": "0x876EabF441B2EE5b5b0554fd502a8E0600950Cfa", "name": "Bitfinex 2"},
    {"id": "binance_8", "address": "0xF977814e90dA44bFA03b6295A0616a897441aceC", "name": "Binance 8"},
    {"id": "coinbase_10", "address": "0x7Be8076f4EA4A4AD08075C2508e481d6C946D12b", "name": "Coinbase 10"},
    {"id": "gemini_4", "address": "0xD24400ae8BfEBb18cA49Be86258a3C749Cf46853", "name": "Gemini 4"},
    {"id": "huobi_10", "address": "0x46705dFf24256421a05D056c29E81bE687EAcA1d", "name": "Huobi 10"},
    {"id": "okx_1", "address": "0x1d8aF972f00CdE99c6A8b9d5fA5F1A42fAa3fE6a", "name": "OKX 1"},
    {"id": "bitstamp", "address": "0x1522900B6DaC587d499a862861C0869Be6E4285a", "name": "Bitstamp"},
    {"id": "binance_7", "address": "0x564286362092D8e7936f0549571a803B203aAceD", "name": "Binance 7"},
    {"id": "binance_15", "address": "0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549", "name": "Binance 15"},
    {"id": "coinbase_3", "address": "0x503828976D22510aad0201ac7EC88293211D23Da", "name": "Coinbase 3"},
    {"id": "coinbase_4", "address": "0x3CD751E6b0078Be393132286c442345e5DC49699", "name": "Coinbase 4"},
    {"id": "coinbase_5", "address": "0xb739D0895772DBB71A89A3754A160269068F0D45", "name": "Coinbase 5"},
    {"id": "kraken_4", "address": "0x2910543Af39abA0Cd09dBb2D50200b3E800A63D2", "name": "Kraken 4"},
    {"id": "kraken_5", "address": "0x0A869d79a7052C7f1b55a8ebabbea3420F0D1E13", "name": "Kraken 5"},
    {"id": "gemini_3", "address": "0x6FC82a5fe25A5cdb58Bc74600A40A69C065263f8", "name": "Gemini 3"},
    {"id": "bittrex", "address": "0xf73c3c65bde10bf26c2e1763104e609a41702efe", "name": "Bittrex"},
    {"id": "poloniex", "address": "0x32Be343B94f860124dC4fEe278FDCBD38C102D88", "name": "Poloniex"},
    {"id": "okx_2", "address": "0xA7EFae728D2936e78BDA97dc267687568dD593f3", "name": "OKX 2"},
    {"id": "okx_3", "address": "0x2B5634C42055806a59e9107ED44D43c426E58258", "name": "OKX 3"},
    {"id": "kucoin_1", "address": "0x689C56Aef474Df92D44A1b70850f808488f9769C", "name": "KuCoin 1"},
    {"id": "kucoin_2", "address": "0xA1D8d972560C2f8144Af871Db508F0B0B10A3fBf", "name": "KuCoin 2"},
    {"id": "crypto_com_1", "address": "0x46340b20830761efd32832A74d7169B29FEB9758", "name": "Crypto.com 1"},
    {"id": "gateio_1", "address": "0x0d0707963952f2fba59dd06f2b425ace40b492fe", "name": "Gate.io 1"},
    {"id": "mexc_1", "address": "0x4982085C9e2F89a8cd9B8b6fC0A5D1735D3b77A9", "name": "MEXC 1"},
    {"id": "bybit_1", "address": "0xF89d7b9c864F589bbF53a82105107622B35EaA40", "name": "Bybit 1"},
    {"id": "bitget_1", "address": "0x1Bf68a9D5D8f6F5f3E6757f0AA0A4f5B4A5f95E2", "name": "Bitget 1"},
]


def _is_cache_valid(cached_item: dict) -> bool:
    return (time.time() - cached_item.get('cached_at', 0)) < WALLET_CACHE_TTL_SECONDS


def _is_valid_eth_address(address: str) -> bool:
    return bool(address and ETH_ADDRESS_RE.match(address))


def _is_placeholder_wallet(wallet_id: str, wallet_name: str) -> bool:
    wallet_id = (wallet_id or "").strip().lower()
    wallet_name = (wallet_name or "").strip()
    return wallet_id.startswith("whale_") or bool(PLACEHOLDER_NAME_RE.match(wallet_name))


def _cache_has_full_wallet_payload(cached_data: dict) -> bool:
    if not isinstance(cached_data, dict):
        return False
    required_keys = ("id", "address", "transactions", "analysis", "suspicion")
    return all(key in cached_data for key in required_keys)


def _find_wallet_id_by_address(address: str):
    normalized = (address or "").lower()
    for wallet_id, wallet_meta in WHALE_WALLETS.items():
        if (wallet_meta.get("address") or "").lower() == normalized:
            return wallet_id
    return None


def _normalize_wallet_entries(entries: list) -> dict:
    wallets = {}
    for wallet in entries:
        wallet_id = (wallet.get('id') or '').strip()
        address = (wallet.get('address') or '').strip()
        name = (wallet.get('name') or '').strip()
        if not wallet_id or not _is_valid_eth_address(address):
            continue
        wallets[wallet_id] = {
            'address': address,
            'name': name or wallet_id.replace('_', ' ').title(),
        }
    return wallets

def load_wallets():
    """Load wallets from wallets.json file."""
    try:
        with open(WALLETS_FILE, 'r') as f:
            data = json.load(f)
            trusted_wallets = []
            for wallet in data.get('wallets', []):
                wallet_id = wallet.get('id')
                address = wallet.get('address')
                wallet_name = wallet.get('name')
                if not wallet_id or not address:
                    continue
                if _is_placeholder_wallet(wallet_id, wallet_name):
                    continue
                trusted_wallets.append(wallet)

            wallets = _normalize_wallet_entries(trusted_wallets)
            curated_wallets = _normalize_wallet_entries(CURATED_REAL_WALLETS)

            # Always merge curated wallets so the list remains broad and stable.
            for wallet_id, wallet_meta in curated_wallets.items():
                wallets.setdefault(wallet_id, wallet_meta)

            return wallets or curated_wallets
    except FileNotFoundError:
        print(f"Warning: {WALLETS_FILE} not found. Please run generate_wallets.py")
        return _normalize_wallet_entries(CURATED_REAL_WALLETS)

WHALE_WALLETS = load_wallets()

MAJOR_EVENTS = [
    {"name": "FTX Collapse", "date": "2022-11-08", "description": "FTX files for bankruptcy"},
    {"name": "ETH Merge", "date": "2022-09-15", "description": "Ethereum transitions to Proof of Stake"},
    {"name": "Bitcoin ETF Approval", "date": "2024-01-10", "description": "SEC approves spot Bitcoin ETFs"},
    {"name": "LUNA Crash", "date": "2022-05-09", "description": "Terra/LUNA ecosystem collapses"},
]


def _pretty_wallet_name(wallet_id: str) -> str:
    wallet_meta = WHALE_WALLETS.get(wallet_id, {})
    return wallet_meta.get('name') or wallet_id.replace("_", " ").title()


def _cached_wallet_balance(wallet_id: str) -> float:
    cached = _WALLET_CACHE.get(wallet_id)
    if not cached:
        return 0.0
    return float((cached.get("data") or {}).get("balance_eth", 0.0) or 0.0)


def _tx_value_eth(tx: dict) -> float:
    return int(tx.get("value", 0)) / 1e18


def _build_whale_alert(wallet_id: str, tx: dict) -> dict:
    value = _tx_value_eth(tx)
    return {
        "wallet_id": wallet_id,
        "wallet_label": _pretty_wallet_name(wallet_id),
        "eth_value": round(value, 2),
        "hash": tx.get("hash"),
        "timestamp": int(tx.get("timeStamp", 0)),
        "message": f"{_pretty_wallet_name(wallet_id)} just moved {round(value, 2)} ETH",
    }


def _average_suspicion_score(suspicion_by_wallet: dict) -> float:
    scores = [float(value.get("score", 0) or 0) for value in suspicion_by_wallet.values() if isinstance(value, dict)]
    if not scores:
        return 0.0
    return round(sum(scores) / len(scores), 2)


def _top_suspicion_wallet(suspicion_by_wallet: dict):
    if not suspicion_by_wallet:
        return None
    return max(suspicion_by_wallet.items(), key=lambda item: float((item[1] or {}).get("score", 0) or 0))

@app.get("/")
def root():
    return {"status": "Whale Tracker API is running"}

@app.get("/api/wallets")
def get_wallets(
    min_balance_eth: float = Query(default=0.05, ge=0),
    max_wallets: int = Query(default=100, ge=1, le=300),
    min_non_zero_wallets: int = Query(default=100, ge=0, le=300),
):
    wallet_rows = []
    for wallet_id, wallet_meta in WHALE_WALLETS.items():
        balance_eth = _cached_wallet_balance(wallet_id)

        wallet_rows.append({
            "id": wallet_id,
            "address": wallet_meta['address'],
            "name": wallet_meta.get('name') or _pretty_wallet_name(wallet_id),
            "balance_eth": round(balance_eth, 6),
        })

    # Refresh only a small subset each request so this endpoint stays responsive.
    refresh_count = min(8, len(wallet_rows))
    for idx in range(refresh_count):
        row = wallet_rows[idx]
        try:
            live_balance = float(get_wallet_balance(row["address"], quick=True) or 0.0)
            if live_balance > 0:
                row["balance_eth"] = round(live_balance, 6)
                cached = _WALLET_CACHE.get(row["id"], {"cached_at": time.time(), "data": {}})
                cached_data = cached.get("data") or {}
                cached_data["balance_eth"] = live_balance
                cached["data"] = cached_data
                cached["cached_at"] = time.time()
                _WALLET_CACHE[row["id"]] = cached
        except Exception:
            continue

    wallet_rows.sort(key=lambda item: item["balance_eth"], reverse=True)
    filtered_rows = [item for item in wallet_rows if item["balance_eth"] >= min_balance_eth]

    # Keep the list rich even when live balance providers are slow.
    if len(filtered_rows) < min_non_zero_wallets:
        used_ids = {item["id"] for item in filtered_rows}
        filler = [item for item in wallet_rows if item["id"] not in used_ids]
        filtered_rows.extend(filler[:max(0, min_non_zero_wallets - len(filtered_rows))])

    if not filtered_rows:
        filtered_rows = wallet_rows

    return {
        "wallets": filtered_rows[:max_wallets]
    }


def _fetch_wallet_data(wallet_identifier: str, tx_limit: int = 500) -> dict:
    wallet_meta = None
    effective_wallet_id = wallet_identifier
    address = None

    if wallet_identifier in WHALE_WALLETS:
        wallet_meta = WHALE_WALLETS[wallet_identifier]
        address = wallet_meta['address']
    elif _is_valid_eth_address(wallet_identifier):
        address = wallet_identifier
        known_wallet_id = _find_wallet_id_by_address(address)
        if known_wallet_id:
            effective_wallet_id = known_wallet_id
            wallet_meta = WHALE_WALLETS[known_wallet_id]
            address = wallet_meta['address']
        else:
            effective_wallet_id = address.lower()
            wallet_meta = {
                "name": "External Wallet",
                "address": address,
            }
    else:
        raise HTTPException(status_code=404, detail="Wallet not found")

    cached = _WALLET_CACHE.get(effective_wallet_id)
    if cached and _is_cache_valid(cached):
        cached_data = cached.get('data') or {}
        if _cache_has_full_wallet_payload(cached_data):
            return cached_data

    txs = get_wallet_transactions(address, limit=tx_limit)
    balance = get_wallet_balance(address)
    analysis = analyze_wallet(txs)
    suspicion = calculate_suspicion_score(txs)

    data = {
        "id": effective_wallet_id,
        "name": wallet_meta.get('name') or _pretty_wallet_name(effective_wallet_id),
        "address": address,
        "balance_eth": balance,
        "transactions": txs,
        "analysis": analysis,
        "suspicion": suspicion,
        "source": "etherscan",
        "cached_at": time.time(),
    }
    # Avoid pinning temporary upstream failures in cache.
    if txs:
        _WALLET_CACHE[effective_wallet_id] = {"cached_at": time.time(), "data": data}
    return data

@app.get("/api/wallet/{wallet_id}")
def get_wallet(wallet_id: str, tx_limit: int = Query(default=300, ge=20, le=1000)):
    return _fetch_wallet_data(wallet_id, tx_limit=tx_limit)

@app.get("/api/events")
def get_events():
    return {"events": MAJOR_EVENTS}

@app.get("/api/events/analysis")
def get_event_analysis():
    results = []
    for event in MAJOR_EVENTS:
        wallets_behavior = {}
        for wallet_id, wallet_meta in WHALE_WALLETS.items():
            txs = get_wallet_transactions(wallet_meta['address'], limit=1000)
            behavior = analyze_event_behavior(txs, event["date"])
            wallets_behavior[wallet_id] = behavior
        results.append({
            "event": event,
            "wallets": wallets_behavior,
        })
    return {"event_analysis": results}


@app.get("/api/dashboard/intel")
def get_dashboard_intel(min_alert_eth: float = Query(default=100.0, ge=0)):
    suspicion_by_wallet = {}
    alerts = []

    wallet_ids = list(WHALE_WALLETS.keys())
    selected_wallet_ids = wallet_ids[:MAX_INTEL_WALLETS]

    for wallet_id in selected_wallet_ids:
        try:
            wallet_data = _fetch_wallet_data(wallet_id, tx_limit=150)
            txs = wallet_data.get("transactions", [])
            suspicion_by_wallet[wallet_id] = wallet_data.get("suspicion") or calculate_suspicion_score(txs)
        except Exception:
            txs = []
            suspicion_by_wallet[wallet_id] = {"score": 0, "breakdown": {}}

        large_txs = [
            tx for tx in txs
            if tx.get("isError") != "1" and _tx_value_eth(tx) >= min_alert_eth
        ]
        if large_txs:
            alerts.append(_build_whale_alert(wallet_id, large_txs[0]))

    alerts.sort(key=lambda item: item["timestamp"], reverse=True)

    average_suspicion = _average_suspicion_score(suspicion_by_wallet)
    top_wallet = _top_suspicion_wallet(suspicion_by_wallet)
    top_wallet_id = top_wallet[0] if top_wallet else None
    top_wallet_score = int((top_wallet[1] or {}).get("score", 0) or 0) if top_wallet else 0

    previous_snapshot = _DASHBOARD_INTEL_HISTORY[-1] if _DASHBOARD_INTEL_HISTORY else None
    previous_average_suspicion = float(previous_snapshot.get("average_suspicion", 0) or 0) if previous_snapshot else 0.0
    previous_alert_count = int(previous_snapshot.get("alert_count", 0) or 0) if previous_snapshot else 0
    previous_top_wallet_id = previous_snapshot.get("top_wallet_id") if previous_snapshot else None
    previous_top_wallet_score = int(previous_snapshot.get("top_wallet_score", 0) or 0) if previous_snapshot else 0

    snapshot = {
        "generated_at": time.time(),
        "alert_count": len(alerts),
        "average_suspicion": average_suspicion,
        "top_wallet_id": top_wallet_id,
        "top_wallet_score": top_wallet_score,
    }
    _DASHBOARD_INTEL_HISTORY.append(snapshot)

    trend_summary = {
        "alert_count_delta": len(alerts) - previous_alert_count,
        "average_suspicion_delta": round(average_suspicion - previous_average_suspicion, 2),
        "top_wallet_changed": bool(previous_top_wallet_id and top_wallet_id and previous_top_wallet_id != top_wallet_id),
        "top_wallet_score_delta": top_wallet_score - previous_top_wallet_score,
        "trend_direction": "up" if average_suspicion > previous_average_suspicion else "down" if average_suspicion < previous_average_suspicion else "flat",
    }

    return {
        "wallet_count": len(WHALE_WALLETS),
        "processed_wallet_count": len(selected_wallet_ids),
        "events": MAJOR_EVENTS,
        "suspicion_by_wallet": suspicion_by_wallet,
        "whale_alerts": alerts[:10],
        "generated_at": snapshot["generated_at"],
        "average_suspicion": average_suspicion,
        "top_wallet_id": top_wallet_id,
        "top_wallet_score": top_wallet_score,
        "trend_summary": trend_summary,
    }


@app.get("/api/compare")
def compare_wallets(
    wallet_a: str = Query(...),
    wallet_b: str = Query(...),
    event_name: str = Query(default="FTX Collapse"),
):
    if wallet_a not in WHALE_WALLETS or wallet_b not in WHALE_WALLETS:
        raise HTTPException(status_code=404, detail="Wallet not found")

    event = next((e for e in MAJOR_EVENTS if e["name"] == event_name), None)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    results = {}
    for wallet_id in [wallet_a, wallet_b]:
        txs = get_wallet_transactions(WHALE_WALLETS[wallet_id]['address'], limit=1000)
        behavior = analyze_event_behavior(txs, event["date"])
        suspicion = calculate_suspicion_score(txs)
        event_window = behavior["txs_before_event"] + behavior["txs_after_event"]

        results[wallet_id] = {
            "wallet_id": wallet_id,
            "wallet_label": _pretty_wallet_name(wallet_id),
            "suspicion": suspicion,
            "behavior": behavior,
            "event_window_transactions": event_window,
            "pre_event_share": round((behavior["txs_before_event"] / max(event_window, 1)) * 100, 1),
            "post_event_share": round((behavior["txs_after_event"] / max(event_window, 1)) * 100, 1),
        }

    a = results[wallet_a]["behavior"]
    b = results[wallet_b]["behavior"]
    diffs = {
        "txs_before_delta": a["txs_before_event"] - b["txs_before_event"],
        "txs_after_delta": a["txs_after_event"] - b["txs_after_event"],
        "net_flow_before_delta_eth": round(a["net_flow_before_eth"] - b["net_flow_before_eth"], 4),
        "net_flow_after_delta_eth": round(a["net_flow_after_eth"] - b["net_flow_after_eth"], 4),
        "suspicion_score_delta": results[wallet_a]["suspicion"]["score"] - results[wallet_b]["suspicion"]["score"],
    }

    return {
        "event": event,
        "wallet_a": results[wallet_a],
        "wallet_b": results[wallet_b],
        "diff": diffs,
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
