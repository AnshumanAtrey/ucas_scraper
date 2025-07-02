 # UCAS University Scraper

This project scrapes detailed data from the UCAS website for all UK universities, modularly extracting information from each available tab (About, Stats, Student Life, Courses, Apprenticeships, International, Student Support).

## 🚀 Quick Start

### 1. Clone the Repository
```
git clone <repo-url>
cd ucas
```

### 2. Install Dependencies
```
npm install
```

### 3. Prepare Input Files
- **links.json**: List of UCAS university URLs to scrape (already provided)
- **useragents.csv**: List of user agents for rotation (already provided)

### 4. Run the Scraper
```
node scrape.js
```
- Output files will be saved in the `output/` directory as `UK0001.json`, `UK0002.json`, etc.
- Each file contains all scraped data for one university.

## 🛠️ How It Works
- The scraper uses Puppeteer to automate Chrome and extract data.
- For each university link in `links.json`, it:
  - Rotates user agents to avoid blocks
  - Detects which tabs are present (About, Stats, etc.)
  - Runs a modular scraper for each tab, extracting all relevant data
  - Handles pagination and deduplication for courses
  - Handles missing tabs/fields gracefully
  - Stops immediately if a network or security error is detected (e.g., WiFi disconnect, page blocked)
- Output is a clean, importable JSON file per university, with a single top-level `scrapedAt` timestamp.

## 📦 What We Scrape
- **About**: Overview, mission, and general info
- **Stats**: Key statistics, numbers, and facts
- **Student Life**: Campus life, societies, facilities
- **Courses**: All available courses, with pagination and deduplication
- **Apprenticeships**: Apprenticeship opportunities
- **International**: Info for international students
- **Student Support**: Support services and resources

Each tab is scraped only if present for that university.

---

Built by [atrey.dev](https://atrey.dev)
