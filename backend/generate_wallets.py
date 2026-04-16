import json
import re

ETH_ADDRESS_RE = re.compile(r"^0x[a-fA-F0-9]{40}$")

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
]

def generate_wallets():
    """Return curated wallets with known activity and human-readable labels."""
    wallets = []
    for wallet in CURATED_REAL_WALLETS:
        if ETH_ADDRESS_RE.match(wallet["address"]):
            wallets.append(wallet)
    return wallets

if __name__ == "__main__":
    print("Generating curated real-wallet list...")
    wallets = generate_wallets()

    data = {"wallets": wallets}

    with open("wallets.json", "w") as f:
        json.dump(data, f, indent=2)

    print(f"Generated {len(wallets)} wallets")
    print(f"Saved to wallets.json")
    print(f"File size: {len(json.dumps(data)) / 1024:.2f} KB")
