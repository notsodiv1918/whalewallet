from datetime import datetime, timedelta

def analyze_wallet(transactions: list) -> dict:
    """Generate behavioral analysis for a wallet."""
    if not transactions:
        return {}

    total_sent = 0
    total_received = 0
    hourly_activity = [0] * 24
    daily_activity = [0] * 7

    for tx in transactions:
        value_eth = int(tx.get("value", 0)) / 1e18
        timestamp = int(tx.get("timeStamp", 0))
        dt = datetime.utcfromtimestamp(timestamp)

        if tx.get("from", "").lower() == tx.get("to", "").lower():
            continue
        if tx.get("isError") == "1":
            continue

        total_sent += value_eth
        hourly_activity[dt.hour] += 1
        daily_activity[dt.weekday()] += 1

    avg_tx_value = (total_sent + total_received) / max(len(transactions), 1)
    peak_hour = hourly_activity.index(max(hourly_activity))
    peak_day = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][daily_activity.index(max(daily_activity))]

    return {
        "total_transactions": len(transactions),
        "total_eth_moved": round(total_sent, 4),
        "avg_tx_value_eth": round(avg_tx_value, 4),
        "peak_hour_utc": peak_hour,
        "peak_day": peak_day,
        "hourly_activity": hourly_activity,
        "daily_activity": daily_activity,
    }

def analyze_event_behavior(transactions: list, event_date: str) -> dict:
    """Analyze wallet behavior 48h before and after a major event."""
    event_dt = datetime.strptime(event_date, "%Y-%m-%d")
    before_start = event_dt - timedelta(hours=48)
    after_end = event_dt + timedelta(hours=48)

    before_txs = []
    after_txs = []

    for tx in transactions:
        timestamp = int(tx.get("timeStamp", 0))
        dt = datetime.utcfromtimestamp(timestamp)
        if before_start <= dt < event_dt:
            before_txs.append(tx)
        elif event_dt <= dt <= after_end:
            after_txs.append(tx)

    def net_flow(txs):
        flow = 0
        for tx in txs:
            value = int(tx.get("value", 0)) / 1e18
            flow += value
        return round(flow, 4)

    return {
        "txs_before_event": len(before_txs),
        "txs_after_event": len(after_txs),
        "net_flow_before_eth": net_flow(before_txs),
        "net_flow_after_eth": net_flow(after_txs),
        "activity_spike": len(before_txs) > 5,
    }
def calculate_suspicion_score(transactions: list) -> dict:
    """Score 0-100 how anomalous a wallet's behavior is."""
    if not transactions:
        return {"score": 0, "breakdown": {}}

    total = len(transactions)
    night_txs = 0        # 00:00 - 06:00 UTC
    weekend_txs = 0
    large_txs = 0        # top 10% by value
    round_txs = 0        # suspiciously round ETH amounts

    values = []
    for tx in transactions:
        val = int(tx.get("value", 0)) / 1e18
        values.append(val)

    avg_value = sum(values) / max(len(values), 1)
    large_threshold = avg_value * 3

    for tx in transactions:
        ts = int(tx.get("timeStamp", 0))
        dt = datetime.utcfromtimestamp(ts)
        val = int(tx.get("value", 0)) / 1e18

        if dt.hour < 6:
            night_txs += 1
        if dt.weekday() >= 5:
            weekend_txs += 1
        if val > large_threshold:
            large_txs += 1
        if val > 1 and val == round(val, 0):
            round_txs += 1

    night_score    = min((night_txs / max(total, 1)) * 200, 30)
    weekend_score  = min((weekend_txs / max(total, 1)) * 150, 20)
    large_score    = min((large_txs / max(total, 1)) * 200, 30)
    round_score    = min((round_txs / max(total, 1)) * 200, 20)

    total_score = round(night_score + weekend_score + large_score + round_score)

    return {
        "score": total_score,
        "breakdown": {
            "night_trading": round(night_score),
            "weekend_activity": round(weekend_score),
            "large_transactions": round(large_score),
            "round_amounts": round(round_score),
        }
    }
