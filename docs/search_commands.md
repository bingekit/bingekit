# Dashboard Search & Formatting Commands

The BingeKit dashboard's primary search bar is more than just a text input. It supports command-like formatting and custom flags, allowing you to instantly refine search queries passed to background SmartFetch engines.

## 1. Deep Scanning (Episode Match)
If you format your search correctly, BingeKit will automatically filter the scraped results looking for specific Seasons and Episodes.

**Format:**
`Title s[Season]e[Episode]` or `Title s[Season]`

**Examples:**
- `The Matrix s01` (Only searches for items matching The Matrix, and automatically looks for Season 1 components)
- `Stranger Things s02e04` (Will deeply scan index pages trying to find Season 2 Episode 4 links natively)

## 2. Subtitle Extractor
Some streaming sites bundle subtitles uniquely. You can forcibly pass a subtitle query component to the scraper for sites that require exact sub matching.

**Format:**
`Title - Subtitle`

**Examples:**
- `Attack on Titan - Final Season`
- `Naruto - Shippuden`

## 3. Cost & Pricing Commands
BingeKit supports identifying metadata about pricing on items (if the Site Plugin has a configured `costSel`, `rentBuySel`, or `priceExtractJs` value). You can use CLI-style flags right in the search bar.

### Filter by Rent / Buy
You can force the dashboard to only show results that are explicitly labelled for Rent or explicit labelled for Purchase.
- **`--rent`** (e.g. `Inception --rent`)
- **`--buy`** (e.g. `Blade Runner 2049 --buy`)

### Filter by Maximum Price Limits
You can append a dollar amount using the `$<amount>` syntax. The system will convert your query, scrape the items, evaluate real-time pricing from the page elements, and automatically drop any items that cost more than your defined limit.
- **`$<amount>`** (e.g. `Interstellar $5.99` - Only shows copies of Interstellar that cost $5.99 or less).

> [!TIP]
> You can combine these flags for extremely specific queries!
> Example: `The Office s02 --buy $12.50` (Show Season 2 of The Office, filtered to options to Buy under $12.50).
