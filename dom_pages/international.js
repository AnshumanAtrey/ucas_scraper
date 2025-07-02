// Modern International tab scraper for UCAS university pages
const scrapeInternationalTab = async (page) => {
  console.log('🌍 Starting International tab scraping...');

  // Wait for the main content to load
  await page.waitForSelector('.wrapper--padding', { timeout: 20000 });
  console.log('✅ International page loaded');

  // Extract all relevant data
  const data = await page.evaluate(() => {
    const result = {};
    // Meta labels
    const metaLabels = Array.from(document.querySelectorAll('.meta-labels li')).map(li => li.textContent.trim());
    if (metaLabels.length) result.metaLabels = metaLabels;
    // Main heading
    const heading = document.querySelector('h2.font-mile')?.textContent?.trim();
    if (heading) result.heading = heading;
    // All paragraphs
    const proseDiv = document.querySelector('.font-prose.prose');
    if (proseDiv) {
      const paragraphs = Array.from(proseDiv.querySelectorAll('p')).map(p => p.textContent.trim()).filter(Boolean);
      if (paragraphs.length) result.paragraphs = paragraphs;
      // All list items (e.g., benefits, support, funding)
      const lists = Array.from(proseDiv.querySelectorAll('ul')).map(ul =>
        Array.from(ul.querySelectorAll('li')).map(li => li.textContent.trim()).filter(Boolean)
      ).filter(arr => arr.length);
      if (lists.length) result.lists = lists;
    }
    return result;
  });

  console.log('✅ International tab scraping completed');
  return data;
};

export default scrapeInternationalTab;
