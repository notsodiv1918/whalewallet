import requests
import os
import re
from dotenv import load_dotenv

load_dotenv()

ETHERSCAN_API_KEY = os.getenv("ETHERSCAN_API_KEY", "YourApiKeyHere")
BASE_URL = "https://api.etherscan.io/api"
BLOCKSCOUT_BASE_URL = "https://eth.blockscout.com/api"
ETH_ADDRESS_RE = re.compile(r"^0x[a-fA-F0-9]{40}$")
PUBLIC_ETH_RPC_URLS = [
    "https://cloudflare-eth.com",
    "https://ethereum.publicnode.com",
]


def _is_valid_eth_address(address: str) -> bool:
    return bool(address and ETH_ADDRESS_RE.match(address))


def _account_api_request(base_url: str, params: dict, timeout_seconds: int = 30) -> list:
    try:
        response = requests.get(base_url, params=params, timeout=timeout_seconds)
        response.raise_for_status()
        data = response.json()
        if data.get("status") == "1" and isinstance(data.get("result"), list):
            return data["result"]
        return []
    except Exception:
        return []

def get_wallet_transactions(address: str, limit: int = 10000) -> list:
    """Fetch normal transactions for a wallet address.

    Note: Etherscan API allows up to 10,000 results per request.
    For larger datasets, pagination might be needed.
    """
    # Cap at 10,000 which is Etherscan's maximum
    limit = min(limit, 10000)

    if not _is_valid_eth_address(address):
        return []

    params = {
        "module": "account",
        "action": "txlist",
        "address": address,
        "startblock": 0,
        "endblock": 99999999,
        "page": 1,
        "offset": limit,
        "sort": "desc",
        "apikey": ETHERSCAN_API_KEY,
    }
    txs = _account_api_request(BASE_URL, params, timeout_seconds=30)
    if txs:
        return txs

    # Fallback source for when Etherscan is unavailable/rate-limited.
    blockscout_params = {k: v for k, v in params.items() if k != "apikey"}
    txs = _account_api_request(BLOCKSCOUT_BASE_URL, blockscout_params, timeout_seconds=30)
    return txs

def get_wallet_balance(address: str, quick: bool = False) -> float:
    """Fetch ETH balance for a wallet address."""
    if not _is_valid_eth_address(address):
        return 0.0

    params = {
        "module": "account",
        "action": "balance",
        "address": address,
        "tag": "latest",
        "apikey": ETHERSCAN_API_KEY,
    }
    try:
        timeout_seconds = 3 if quick else 10
        response = requests.get(BASE_URL, params=params, timeout=timeout_seconds)
        response.raise_for_status()
        data = response.json()
        if data.get("status") == "1":
            return int(data["result"]) / 1e18
    except Exception as e:
        print(f"Error fetching balance for {address}: {e}")

    if quick:
        return 0.0

    # Fallback: query public JSON-RPC providers for latest balance.
    rpc_payload = {
        "jsonrpc": "2.0",
        "method": "eth_getBalance",
        "params": [address, "latest"],
        "id": 1,
    }
    for rpc_url in PUBLIC_ETH_RPC_URLS:
        try:
            response = requests.post(rpc_url, json=rpc_payload, timeout=10)
            response.raise_for_status()
            data = response.json()
            result = data.get("result")
            if isinstance(result, str) and result.startswith("0x"):
                return int(result, 16) / 1e18
        except Exception:
            continue

    return 0.0

def get_internal_transactions(address: str, limit: int = 10000) -> list:
    """Fetch internal transactions (contract interactions).

    Note: Etherscan API allows up to 10,000 results per request.
    """
    # Cap at 10,000 which is Etherscan's maximum
    limit = min(limit, 10000)

    if not _is_valid_eth_address(address):
        return []

    params = {
        "module": "account",
        "action": "txlistinternal",
        "address": address,
        "page": 1,
        "offset": limit,
        "sort": "desc",
        "apikey": ETHERSCAN_API_KEY,
    }
    txs = _account_api_request(BASE_URL, params, timeout_seconds=30)
    if txs:
        return txs

    blockscout_params = {k: v for k, v in params.items() if k != "apikey"}
    return _account_api_request(BLOCKSCOUT_BASE_URL, blockscout_params, timeout_seconds=30)
