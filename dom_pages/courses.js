// Modern Courses tab scraper for UCAS university pages
const scrapeCoursesTab = async (page, browser) => {
  console.log('📚 Starting Courses tab scraping...');

  // Wait for the main content to load
  await page.waitForSelector('.wrapper--padding', { timeout: 30000 });
  console.log('✅ Courses page loaded');

  // Extract meta labels, heading, and prose
  const baseData = await page.evaluate(() => {
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

  // Extract study options grouped by undergrad/postgrad
  const studyOptionsByLevel = await page.evaluate(() => {
    const result = { undergrad: [], postgrad: [] };
    // Find all h3.font-yard and their following .content-grid
    const h3s = Array.from(document.querySelectorAll('h3.font-yard'));
    h3s.forEach(h3 => {
      const levelText = h3.textContent.trim().toLowerCase();
      let level = null;
      if (levelText.includes('undergrad')) level = 'undergrad';
      if (levelText.includes('postgrad')) level = 'postgrad';
      if (!level) return;
      // Find the next .content-grid sibling
      let grid = h3.nextElementSibling;
      while (grid && !grid.classList.contains('content-grid')) {
        grid = grid.nextElementSibling;
      }
      if (!grid) return;
      // Extract study options from cards
      Array.from(grid.querySelectorAll('.card')).forEach(card => {
        const mode = card.querySelector('.card-font-yard')?.textContent?.trim() || '';
        const count = card.querySelector('h2.card-font-rod')?.textContent?.trim() || '';
        const link = card.querySelector('a.link-container__link')?.href || '';
        result[level].push({ mode, count, link });
      });
    });
    return result;
  });

  // Build a mapping from link to all study options that reference it, grouped by level
  const linkToOptionsByLevel = { undergrad: {}, postgrad: {} };
  for (const level of ['undergrad', 'postgrad']) {
    (studyOptionsByLevel[level] || []).forEach(opt => {
      if (!opt.link) return;
      if (!linkToOptionsByLevel[level][opt.link]) linkToOptionsByLevel[level][opt.link] = [];
      linkToOptionsByLevel[level][opt.link].push({ mode: opt.mode, count: opt.count });
    });
  }

  // Scrape each unique link only once per level, always output a group (with error if failed)
  const courseGroupsByLevel = { undergrad: [], postgrad: [] };
  for (const level of ['undergrad', 'postgrad']) {
    for (const link of Object.keys(linkToOptionsByLevel[level])) {
      if (!link) continue;
      let group = {
        link,
        studyOptions: linkToOptionsByLevel[level][link],
        courses: [],
      };
      try {
        console.log(`Visiting course list [${level}]:`, link);
        const coursePage = await browser.newPage();
        await coursePage.goto(link, { waitUntil: 'networkidle2' });
        await coursePage.waitForSelector('.grid--equal-height, .grid.grid--max-h4', { timeout: 30000 });
        let hasNext = true;
        const visitedPages = new Set();
        while (hasNext) {
          // Avoid infinite loops
          const url = coursePage.url();
          if (visitedPages.has(url)) break;
          visitedPages.add(url);
          // Scrape all course cards on this page
          let coursesOnPage = await coursePage.evaluate(() => {
            const courses = [];
            document.querySelectorAll('.card--course-details').forEach(card => {
              const title = card.querySelector('.course-title')?.textContent?.trim() || '';
              const qualification = Array.from(card.querySelectorAll('.qualification dd')).map(dd => dd.textContent.trim()).join(', ');
              const duration = Array.from(card.querySelectorAll('.duration dd')).map(dd => dd.textContent.trim()).join(', ');
              const studyMode = Array.from(card.querySelectorAll('.study-mode dd')).map(dd => dd.textContent.trim()).join(', ');
              const startDate = Array.from(card.querySelectorAll('.start-date dd')).map(dd => dd.textContent.trim()).join(', ');
              const ucasPoints = Array.from(card.querySelectorAll('.ucas-points dd')).map(dd => dd.textContent.trim()).join(', ');
              const provider = card.querySelector('.provider a')?.textContent?.trim() || '';
              const location = card.querySelector('.location')?.textContent?.trim() || '';
              const detailLink = card.querySelector('a.link-container__link')?.href || '';
              courses.push({ title, qualification, duration, studyMode, startDate, ucasPoints, provider, location, detailLink });
            });
            return courses;
          });
          // For each course, visit its detail page and scrape all entry requirements
          for (let i = 0; i < coursesOnPage.length; i++) {
            const course = coursesOnPage[i];
            if (!course.detailLink) continue;
            try {
              const detailPage = await browser.newPage();
              await detailPage.goto(course.detailLink, { waitUntil: 'networkidle2' });
              // Wait for the entry requirements modal or section to be present
              await detailPage.waitForSelector('.course-details-list, .modal__content', { timeout: 15000 });
              // Scrape entry requirements from the detail page
              const entryRequirements = await detailPage.evaluate(() => {
                const reqs = {};
                // UCAS Tariff Points
                const ucas = document.querySelector('.ucas-points dd')?.textContent?.trim();
                if (ucas) reqs.ucasTariff = ucas;
                // A Levels
                const alevels = Array.from(document.querySelectorAll('label[for$="ALevel_radio"] .qualification-value')).map(e => e.textContent.trim()).join(', ');
                if (alevels) reqs.aLevels = alevels;
                // BTEC
                const btec = Array.from(document.querySelectorAll('label[for$="BtecLevel3NationalExtendedDiploma_radio"] .qualification-value')).map(e => e.textContent.trim()).join(', ');
                if (btec) reqs.btec = btec;
                // Scottish Higher
                const sh = Array.from(document.querySelectorAll('label[for$="ScottishHigher_radio"] .qualification-value')).map(e => e.textContent.trim()).join(', ');
                if (sh) reqs.scottishHigher = sh;
                // Scottish Advanced Higher
                const sah = Array.from(document.querySelectorAll('label[for$="ScottishAdvancedHigher_radio"] .qualification-value')).map(e => e.textContent.trim()).join(', ');
                if (sah) reqs.scottishAdvancedHigher = sah;
                // Also check for any visible .course-details-list (sometimes requirements are in a visible list)
                document.querySelectorAll('.course-details-list > div').forEach(div => {
                  const dt = div.querySelector('dt')?.textContent?.trim();
                  const dd = div.querySelector('dd')?.textContent?.trim();
                  if (dt && dd) {
                    if (/UCAS Tariff/i.test(dt)) reqs.ucasTariff = dd;
                    if (/A Levels?/i.test(dt)) reqs.aLevels = dd;
                    if (/BTEC/i.test(dt)) reqs.btec = dd;
                    if (/Scottish Higher/i.test(dt)) reqs.scottishHigher = dd;
                    if (/Scottish Advanced Higher/i.test(dt)) reqs.scottishAdvancedHigher = dd;
                  }
                });
                return reqs;
              });
              if (Object.keys(entryRequirements).length > 0) {
                course.entryRequirements = entryRequirements;
              }
              await detailPage.close();
            } catch (err) {
              console.warn('Failed to scrape entry requirements for course:', course.title, err.message);
            }
          }
          group.courses.push(...coursesOnPage);
          // Check for next page in pagination
          const nextPageHref = await coursePage.evaluate(() => {
            const nextBtn = document.querySelector('.pagination__link--next');
            return nextBtn ? nextBtn.href : null;
          });
          if (nextPageHref && !visitedPages.has(nextPageHref)) {
            console.log('Going to next page:', nextPageHref);
            await coursePage.goto(nextPageHref, { waitUntil: 'networkidle2' });
            await coursePage.waitForSelector('.grid--equal-height, .grid.grid--max-h4', { timeout: 30000 });
          } else {
            hasNext = false;
          }
        }
        await coursePage.close();
      } catch (err) {
        console.warn(`Failed to scrape course list [${level}] link: ${link} - ${err.message}`);
        group.error = err.message;
      }
      courseGroupsByLevel[level].push(group);
    }
  }

  const result = {
    ...baseData,
    undergrad: {
      studyOptions: studyOptionsByLevel.undergrad,
      courseGroups: courseGroupsByLevel.undergrad
    },
    postgrad: {
      studyOptions: studyOptionsByLevel.postgrad,
      courseGroups: courseGroupsByLevel.postgrad
    }
  };
  console.log('✅ Courses tab scraping completed');
  return result;
};

export default scrapeCoursesTab;
