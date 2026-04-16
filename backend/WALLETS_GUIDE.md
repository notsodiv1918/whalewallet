# Whale Tracker - Wallet Management Guide

## Currently Tracking: 1000+ Wallets

### Adding/Modifying Wallets

#### Method 1: Generate Random Wallets (Quick Setup)
The system comes with a wallet generator script. To regenerate or expand wallets:

```bash
cd backend
python generate_wallets.py
```

This will generate 1000 wallets and save them to `wallets.json`.

#### Method 2: Add Specific Wallets Manually
Edit `backend/wallets.json`:

```json
{
  "wallets": [
    {
      "id": "wallet_identifier",
      "address": "0x1234567890abcdef...",
      "name": "Wallet Display Name"
    },
    ...
  ]
}
```

#### Method 3: Import from CSV
Create a CSV file with columns: `id`, `address`, `name`

Then run:
```bash
python -c "
import csv
import json

wallets = []
with open('wallets.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        wallets.append({
            'id': row['id'],
            'address': row['address'],
            'name': row['name']
        })

with open('wallets.json', 'w') as f:
    json.dump({'wallets': wallets}, f, indent=2)
"
```

### Important Notes

1. **Address Format**: All wallet addresses must be valid Ethereum addresses starting with `0x`
2. **API Rate Limits**: Etherscan free tier allows ~5 requests/second. With 1000 wallets, the backend intelligently limits requests
3. **Performance**: 
   - Dashboard shows 30 wallets per page (pagination)
   - Transaction loading limited to top 10 wallets for efficiency
   - Backend caches suspicion scores

### Backend Wallets Endpoint

The API endpoint `/api/wallets` now returns all 1000+ tracked wallets in this format:

```json
{
  "wallets": [
    {
      "id": "wallet_001",
      "address": "0x..."
    },
    ...
  ]
}
```

### Frontend Features

✅ **Dashboard**
- Paginated wallet cards (30 per page)
- Shows all 1000+ wallets with pagination controls
- Live transaction feed from top wallets

✅ **Wallet Detail**
- View any wallet's 1000+ transactions
- Activity charts (hourly & daily)
- Suspicion score & metrics

✅ **Compare Mode**
- Compare any two wallets side-by-side
- Both wallet transaction histories displayed

### Tracking Large Datasets

For optimal performance with 1000+ wallets:

1. **Database (Recommended for 5000+)**:
   Install and use PostgreSQL to cache wallet data
   
2. **Rate Limiting**:
   The backend automatically throttles Etherscan API calls
   
3. **Caching**:
   Transaction data is cached per session to reduce API calls

### Custom Wallet Lists

To use custom whale lists:

1. Get wallet addresses from:
   - Etherscan whale/account tracking
   - CEX treasury addresses
   - Protocol DAO treasuries
   - Your own list

2. Add to `wallets.json` following the format above

3. Restart the backend: `python main.py`

The frontend will automatically update to reflect all tracked wallets!
