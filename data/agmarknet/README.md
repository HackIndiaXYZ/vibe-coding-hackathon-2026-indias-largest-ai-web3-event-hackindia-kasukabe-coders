# AGMARKNET Data Directory

This directory contains CSV price data from the AGMARKNET portal (agmarknet.gov.in).

## File Structure

```
data/agmarknet/
  onion_2024.csv      ← Onion — Lasalgaon, Pimpalgaon, Kurnool
  tomato_2024.csv     ← Tomato — Kolar, Bangalore APMC, Pune APMC
  potato_2024.csv     ← Potato — Agra, Kanpur, Patna
  garlic_2024.csv     ← Garlic — Neemuch, Indore, Kota
```

## CSV Format

```
Date,Commodity,Mandi,State,ArrivalQty,ModalPrice
01/01/2024,Onion,Lasalgaon,Maharashtra,44800,1860
```

| Column       | Format            | Description                                |
|-------------|-------------------|--------------------------------------------|
| Date         | DD/MM/YYYY        | Market date (also accepts YYYY-MM-DD)      |
| Commodity    | String            | Commodity name (auto-normalized, see below)|
| Mandi        | String            | Market/APMC name                           |
| State        | String            | Indian state name                          |
| ArrivalQty   | Number (quintals) | Total arrivals for that day                |
| ModalPrice   | Number (₹/q)      | Modal (most frequent) transaction price    |

## Adding Real AGMARKNET Data

1. Download CSVs from https://agmarknet.gov.in (Reports → Price & Arrivals)
2. Drop files into this directory (any filename ending in `.csv`)
3. No restart needed — the API auto-discovers new files within 5 minutes (cache TTL)
4. To force refresh, hit `POST /api/market-data/refresh` (if implemented)

## Commodity Normalization

The parser automatically maps regional/variant spellings to canonical names:

| Canonical | Also recognized as                        |
|-----------|-------------------------------------------|
| Onion     | Pyaz, Kanda, Big Onion, Vengayam          |
| Tomato    | Tamatar, Thakkali, Tomato (local)         |
| Potato    | Aloo, Batata, Urulaikizhangu              |
| Garlic    | Lahsun, Poondu, Dry Garlic                |
| Wheat     | Gehun, Wheat (107), Wheat (Dara)          |
| Rice      | Paddy, Chawal, Paddy (Non-Basmati)        |
| Mustard   | Sarson, Rape Seed, Black Mustard          |
| Chilli    | Dry Chilly, Red Chilli, Green Chilli      |

## API Usage

```
GET /api/market-data
  ?commodity=Onion          # Partial match, case-insensitive
  &mandi=Lasalgaon          # Partial match
  &state=Maharashtra        # Partial match
  &startDate=2024-01-01     # ISO date, inclusive
  &endDate=2024-06-30       # ISO date, inclusive
  &raw=true                 # Include raw records array
  &limit=100                # Max raw records (default 500)
  &meta=true                # Return only commodities/mandis/states
```

### Response Shape
```json
{
  "summary": { "count", "avgPrice", "minPrice", "maxPrice", "totalVolume", "commodities", "states", "dateRange" },
  "monthly": [{ "month", "year", "monthKey", "avgPrice", "minPrice", "maxPrice", "totalVolume", "recordCount" }],
  "mandis":  [{ "mandi", "state", "commodity", "avgPrice", "totalVolume", "latestPrice", "latestDate", "recordCount" }],
  "records": [...]  // only when raw=true
}
```
