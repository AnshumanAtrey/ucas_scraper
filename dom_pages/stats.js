// Modern Stats tab scraper for UCAS university pages
const scrapeStatsTab = async (page) => {
  console.log('📊 Starting Stats tab scraping...');

  // Wait for the main content to load
  await page.waitForSelector('.wrapper--padding', { timeout: 20000 });
  console.log('✅ Stats page loaded');

  // Extract all relevant data
  const data = await page.evaluate(() => {
    const result = {};

    // --- Meta Labels (e.g., Location type) ---
    const metaLabels = Array.from(document.querySelectorAll('.meta-labels li')).map(li => li.textContent.trim());
    if (metaLabels.length) result.metaLabels = metaLabels;

    // --- Main Heading and Description ---
    const heading = document.querySelector('h2.font-mile')?.textContent?.trim() || '';
    const description = document.querySelector('p.font-prose')?.textContent?.trim() || '';
    if (heading) result.heading = heading;
    if (description) result.description = description;

    // --- Student Statistics Section ---
    const studentStats = [];
    const ringCharts = document.querySelectorAll('.ring-chart');
    ringCharts.forEach(chart => {
      // Category name (from hidden h3)
      const category = chart.querySelector('h3')?.textContent?.trim() || '';
      // Each stat item (label and value)
      const items = Array.from(chart.querySelectorAll('li.ring-chart__item')).map(li => {
        const value = li.querySelector('.ring-chart__number')?.textContent?.trim() || '';
        const label = li.querySelector('.ring-chart__text')?.textContent?.trim() || '';
        return { label, value };
      });
      studentStats.push({ category, items });
    });
    if (studentStats.length) result.studentStats = studentStats;

    // --- Source (if present) ---
    const source = Array.from(document.querySelectorAll('p')).map(p => {
      if (p.textContent.toLowerCase().includes('source:')) {
        return p.textContent.trim();
      }
      return null;
    }).filter(Boolean)[0] || '';
    if (source) result.source = source;

    return result;
  });

  console.log('✅ Stats tab scraping completed');
  return data;
};

export default scrapeStatsTab;
