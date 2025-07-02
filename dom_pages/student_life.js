// Modern Student Life tab scraper for UCAS university pages
const scrapeStudentLifeTab = async (page) => {
  console.log('🎓 Starting Student Life tab scraping...');

  // Wait for the main content to load
  await page.waitForSelector('.wrapper--padding', { timeout: 20000 });
  console.log('✅ Student Life page loaded');

  // Extract all relevant data
  const data = await page.evaluate(() => {
    const result = {};

    // --- Meta Labels (e.g., Location type) ---
    const metaLabels = Array.from(document.querySelectorAll('.meta-labels li')).map(li => li.textContent.trim());
    if (metaLabels.length) result.metaLabels = metaLabels;

    // --- Main Heading ---
    const heading = document.querySelector('h2.font-mile')?.textContent?.trim();
    if (heading) result.heading = heading;

    // --- Student Life Paragraphs ---
    const proseDiv = document.querySelector('.font-prose.prose');
    if (proseDiv) {
      const paragraphs = Array.from(proseDiv.querySelectorAll('p')).map(p => p.textContent.trim()).filter(Boolean);
      if (paragraphs.length) result.studentLifeParagraphs = paragraphs;
    }

    // --- Region/City Guides (with images, headings, text, and links) ---
    const regionGuides = [];
    document.querySelectorAll('.grid .content-block').forEach(block => {
      const img = block.querySelector('img')?.src || '';
      const heading = block.querySelector('h3')?.textContent?.replace(/\s+/g, ' ').trim() || '';
      const paragraphs = Array.from(block.querySelectorAll('div > p')).map(p => p.textContent.trim()).filter(Boolean);
      const link = block.querySelector('a.button')?.href || '';
      regionGuides.push({
        image: img,
        heading,
        paragraphs,
        link
      });
    });
    if (regionGuides.length) result.regionGuides = regionGuides;

    // --- Campus and Facilities ---
    const campusHeading = Array.from(document.querySelectorAll('h2.font-mile')).find(h2 => h2.textContent.includes('Campus'))?.textContent?.trim();
    if (campusHeading) result.campusHeading = campusHeading;
    const campusProseDiv = Array.from(document.querySelectorAll('h2.font-mile')).find(h2 => h2.textContent.includes('Campus'))?.nextElementSibling;
    if (campusProseDiv && campusProseDiv.classList.contains('font-prose')) {
      const campusParagraphs = Array.from(campusProseDiv.querySelectorAll('p')).map(p => p.textContent.trim()).filter(Boolean);
      if (campusParagraphs.length) result.campusParagraphs = campusParagraphs;
    }

    // --- Course Locations ---
    const courseLocations = [];
    document.querySelectorAll('.content-grid .card').forEach(card => {
      const title = card.querySelector('h2')?.textContent?.trim() || '';
      const address = card.querySelector('.card__section:last-child')?.textContent?.trim() || '';
      if (title || address) courseLocations.push({ title, address });
    });
    if (courseLocations.length) result.courseLocations = courseLocations;

    return result;
  });

  console.log('✅ Student Life tab scraping completed');
  return data;
};

export default scrapeStudentLifeTab;
