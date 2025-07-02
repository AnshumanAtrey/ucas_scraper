// Modern Apprenticeships tab scraper for UCAS university pages
const scrapeApprenticeshipsTab = async (page) => {
  console.log('🛠️ Starting Apprenticeships tab scraping...');

  // Wait for the main content to load
  await page.waitForSelector('.wrapper--padding', { timeout: 20000 });
  console.log('✅ Apprenticeships page loaded');

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
    }
    return result;
  });

  console.log('✅ Apprenticeships tab scraping completed');
  return data;
};

export default scrapeApprenticeshipsTab;
