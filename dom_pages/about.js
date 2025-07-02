// Modern About tab scraper for UCAS university pages
const scrapeAboutTab = async (page) => {
  console.log('🏫 Starting About tab scraping...');

  // Wait for the main content to load
  await page.waitForSelector('.explore-main, #main', { timeout: 20000 });
  console.log('✅ About page loaded');

  // Extract all relevant data
  const data = await page.evaluate(() => {
    const result = {};

    // --- University Name & Location ---
    const name = document.querySelector('.header__heading')?.textContent?.trim() || '';
    const location = document.querySelector('.header__subheading')?.textContent?.trim() || '';
    result.name = name;
    result.location = location;

    // --- Main Banner Image ---
    let bannerImg = '';
    const header = document.querySelector('header.header');
    if (header) {
      // Try to get from style attribute
      const style = header.getAttribute('style');
      if (style) {
        const match = style.match(/--background-image-[^:]+:url\(([^)]+)\)/);
        if (match) bannerImg = match[1].replace(/['"]/g, '');
      }
      // Fallback: look for img in header
      if (!bannerImg) {
        const img = header.querySelector('img');
        if (img) bannerImg = img.src;
      }
    }
    result.bannerImage = bannerImg;

    // --- About Us Section ---
    let aboutText = '';
    const aboutSection = Array.from(document.querySelectorAll('h2, h3')).find(h => h.textContent?.toLowerCase().includes('about us'));
    if (aboutSection) {
      let node = aboutSection.nextElementSibling;
      let aboutParas = [];
      while (node && (node.tagName === 'DIV' || node.tagName === 'P')) {
        if (node.tagName === 'DIV') {
          aboutParas.push(...Array.from(node.querySelectorAll('p')).map(p => p.textContent.trim()));
        } else if (node.tagName === 'P') {
          aboutParas.push(node.textContent.trim());
        }
        node = node.nextElementSibling;
      }
      aboutText = aboutParas.filter(Boolean).join('\n');
    }
    result.about = aboutText;

    // --- What Makes Us Different ---
    let differentText = '';
    let differentList = [];
    const diffSection = Array.from(document.querySelectorAll('h2, h3')).find(h => h.textContent?.toLowerCase().includes('what makes us different'));
    if (diffSection) {
      let node = diffSection.nextElementSibling;
      let diffParas = [];
      while (node && (node.tagName === 'DIV' || node.tagName === 'UL' || node.tagName === 'P')) {
        if (node.tagName === 'DIV') {
          diffParas.push(...Array.from(node.querySelectorAll('p')).map(p => p.textContent.trim()));
          // Also look for <ul> in this div
          const ul = node.querySelector('ul');
          if (ul) {
            differentList = Array.from(ul.querySelectorAll('li')).map(li => li.textContent.trim());
          }
        } else if (node.tagName === 'UL') {
          differentList = Array.from(node.querySelectorAll('li')).map(li => li.textContent.trim());
        } else if (node.tagName === 'P') {
          diffParas.push(node.textContent.trim());
        }
        node = node.nextElementSibling;
      }
      differentText = diffParas.filter(Boolean).join('\n');
    }
    result.whatMakesUsDifferent = differentText;
    if (differentList.length) result.differenceList = differentList;

    // --- Gallery Images ---
    const galleryImgs = Array.from(document.querySelectorAll('.gallery .swiper-slide')).map(div => {
      const style = div.getAttribute('style') || '';
      const match = style.match(/background-image: url\(([^)]+)\)/);
      return match ? match[1].replace(/['"]/g, '') : null;
    }).filter(Boolean);
    if (galleryImgs.length) result.galleryImages = galleryImgs;

    // --- Contact Info & Website ---
    let website = '';
    let email = '';
    let phone = '';
    const contactSection = Array.from(document.querySelectorAll('footer, .content-block__text')).find(el => el.textContent?.toLowerCase().includes('contact'));
    if (contactSection) {
      // Website
      const websiteA = contactSection.querySelector('a[href^="http"]');
      if (websiteA) website = websiteA.href;
      // Email
      const emailA = contactSection.querySelector('a[href^="mailto:"]');
      if (emailA) email = emailA.textContent.trim();
      // Phone
      const phoneA = contactSection.querySelector('a[href^="tel:"]');
      if (phoneA) phone = phoneA.textContent.trim();
    }
    // Fallback for website: look for Visit website button
    if (!website) {
      const websiteBtn = Array.from(document.querySelectorAll('a')).find(a => a.textContent?.toLowerCase().includes('visit website'));
      if (websiteBtn) website = websiteBtn.href;
    }
    result.website = website;
    result.email = email;
    result.phone = phone;

    // --- Meta Labels (e.g., Location type) ---
    const metaLabels = Array.from(document.querySelectorAll('.meta-labels li')).map(li => li.textContent.trim());
    if (metaLabels.length) result.metaLabels = metaLabels;

    // --- Course Locations ---
    const courseLocations = Array.from(document.querySelectorAll('.content-grid .card')).map(card => {
      const title = card.querySelector('h2')?.textContent?.trim() || '';
      const address = card.querySelector('.card__section:last-child')?.textContent?.trim() || '';
      return { title, address };
    }).filter(loc => loc.title || loc.address);
    if (courseLocations.length) result.courseLocations = courseLocations;

    // --- Open Days (Events) ---
    const openDays = Array.from(document.querySelectorAll('.carousel-inner .carousel-slide')).map(slide => {
      const title = slide.querySelector('.header__text')?.textContent?.trim() || '';
      const date = slide.querySelector('.event-display__date')?.textContent?.trim() || '';
      const location = slide.querySelector('.event-display__location')?.textContent?.trim() || '';
      return { title, date, location };
    }).filter(ev => ev.title || ev.date || ev.location);
    if (openDays.length) result.openDays = openDays;

    return result;
  });

  console.log('✅ About tab scraping completed');
  return data;
};

export default scrapeAboutTab;
