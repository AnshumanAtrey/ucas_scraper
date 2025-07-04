import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load links
const linksPath = path.join(__dirname, 'links.json');
const userAgentsPath = path.join(__dirname, 'useragents.csv');
const aboutScraperPath = path.join(__dirname, 'dom_pages', 'about.js');
const statsScraperPath = path.join(__dirname, 'dom_pages', 'stats.js');
const studentLifeScraperPath = path.join(__dirname, 'dom_pages', 'student_life.js');
const coursesScraperPath = path.join(__dirname, 'dom_pages', 'courses.js');
const apprenticeshipsScraperPath = path.join(__dirname, 'dom_pages', 'apprenticeships.js');
const internationalScraperPath = path.join(__dirname, 'dom_pages', 'international.js');
const studentSupportScraperPath = path.join(__dirname, 'dom_pages', 'student_support.js');
const outputDir = path.join(__dirname, 'output');

// Import about.js, stats.js, student_life.js, courses.js, apprenticeships.js, international.js, and student_support.js scraping logic (fix for Windows: use file URL)
let scrapeAbout, scrapeStats, scrapeStudentLife, scrapeCourses, scrapeApprenticeships, scrapeInternational, scrapeStudentSupport;
try {
  const aboutScraperUrl = pathToFileURL(aboutScraperPath).href;
  scrapeAbout = (await import(aboutScraperUrl)).default;
  console.log('Loaded about.js scraper');
} catch (e) {
  console.log('Failed to load about.js, using dummy function', e);
  scrapeAbout = async (page) => ({ note: 'about.js not implemented yet' });
}
try {
  const statsScraperUrl = pathToFileURL(statsScraperPath).href;
  scrapeStats = (await import(statsScraperUrl)).default;
  console.log('Loaded stats.js scraper');
} catch (e) {
  console.log('Failed to load stats.js, using dummy function', e);
  scrapeStats = async (page) => ({ note: 'stats.js not implemented yet' });
}
try {
  const studentLifeScraperUrl = pathToFileURL(studentLifeScraperPath).href;
  scrapeStudentLife = (await import(studentLifeScraperUrl)).default;
  console.log('Loaded student_life.js scraper');
} catch (e) {
  console.log('Failed to load student_life.js, using dummy function', e);
  scrapeStudentLife = async (page) => ({ note: 'student_life.js not implemented yet' });
}
try {
  const coursesScraperUrl = pathToFileURL(coursesScraperPath).href;
  scrapeCourses = (await import(coursesScraperUrl)).default;
  console.log('Loaded courses.js scraper');
} catch (e) {
  console.log('Failed to load courses.js, using dummy function', e);
  scrapeCourses = async (page, browser) => ({ note: 'courses.js not implemented yet' });
}
try {
  const apprenticeshipsScraperUrl = pathToFileURL(apprenticeshipsScraperPath).href;
  scrapeApprenticeships = (await import(apprenticeshipsScraperUrl)).default;
  console.log('Loaded apprenticeships.js scraper');
} catch (e) {
  console.log('Failed to load apprenticeships.js, using dummy function', e);
  scrapeApprenticeships = async (page) => ({ note: 'apprenticeships.js not implemented yet' });
}
try {
  const internationalScraperUrl = pathToFileURL(internationalScraperPath).href;
  scrapeInternational = (await import(internationalScraperUrl)).default;
  console.log('Loaded international.js scraper');
} catch (e) {
  console.log('Failed to load international.js, using dummy function', e);
  scrapeInternational = async (page) => ({ note: 'international.js not implemented yet' });
}
try {
  const studentSupportScraperUrl = pathToFileURL(studentSupportScraperPath).href;
  scrapeStudentSupport = (await import(studentSupportScraperUrl)).default;
  console.log('Loaded student_support.js scraper');
} catch (e) {
  console.log('Failed to load student_support.js, using dummy function', e);
  scrapeStudentSupport = async (page) => ({ note: 'student_support.js not implemented yet' });
}

async function loadLinks() {
  const data = await fs.readFile(linksPath, 'utf8');
  return JSON.parse(data);
}

async function loadUserAgents() {
  const data = await fs.readFile(userAgentsPath, 'utf8');
  // Skip header, get second column
  return data.split('\n').slice(1).map(line => line.split(',')[1]?.trim()).filter(Boolean);
}

async function ensureOutputDir() {
  await fs.mkdir(outputDir, { recursive: true });
  console.log('Ensured output directory exists');
}

async function scrollToBottom(page) {
  await page.evaluate(async () => {
    await new Promise(resolve => {
      let totalHeight = 0;
      const distance = 500;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

// Move scraping logic into a function that takes url, userAgent, outputFileName, and browser
async function scrapeUniversity({ url, userAgent, outputFileName, browser, index, total }) {
  const page = await browser.newPage();
  try {
    await page.setUserAgent(userAgent);
    console.log(`\n[${index + 1}/${total}] Visiting: ${url}`);
    let aboutData = null;
    let statsData = null;
    let studentLifeData = null;
    let coursesData = null;
    let apprenticeshipsData = null;
    let internationalData = null;
    let studentSupportData = null;
    let foundTabs = [];
    // About tab (always present as landing page)
    console.log('Going to page...');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    // Detect available tabs from navigation
    foundTabs = await page.evaluate(() => {
      const tabMap = {
        'About us': 'About',
        'Stats': 'Stats',
        'Student life': 'StudentLife',
        'Courses': 'Courses',
        'Apprenticeships': 'Apprenticeships',
        'International': 'International',
        'Student support': 'StudentSupport',
      };
      const tabs = [];
      document.querySelectorAll('.header-navigation__list-item a').forEach(a => {
        const text = a.textContent.trim();
        if (tabMap[text]) tabs.push(tabMap[text]);
      });
      return tabs;
    });
    console.log('Tabs found:', foundTabs);
    console.log('Page loaded, scrolling to bottom...');
    await scrollToBottom(page);
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (foundTabs.includes('About')) {
      console.log('Calling about.js scraper...');
      aboutData = await scrapeAbout(page);
    }
    if (foundTabs.includes('Stats')) {
      const statsUrl = url.endsWith('/') ? url + 'stats' : url + '/stats';
      console.log('Navigating to stats page:', statsUrl);
      await page.goto(statsUrl, { waitUntil: 'networkidle2', timeout: 45000 });
      await scrollToBottom(page);
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Calling stats.js scraper...');
      statsData = await scrapeStats(page);
    }
    if (foundTabs.includes('StudentLife')) {
      const studentLifeUrl = url.endsWith('/') ? url + 'student-life' : url + '/student-life';
      console.log('Navigating to student life page:', studentLifeUrl);
      await page.goto(studentLifeUrl, { waitUntil: 'networkidle2', timeout: 45000 });
      await scrollToBottom(page);
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Calling student_life.js scraper...');
      studentLifeData = await scrapeStudentLife(page);
    }
    if (foundTabs.includes('Courses')) {
      const coursesUrl = url.endsWith('/') ? url + 'courses' : url + '/courses';
      console.log('Navigating to courses page:', coursesUrl);
      await page.goto(coursesUrl, { waitUntil: 'networkidle2', timeout: 45000 });
      await scrollToBottom(page);
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Calling courses.js scraper...');
      try {
        coursesData = await scrapeCourses(page, browser);
      } catch (err) {
        console.log('Courses tab not available or failed to scrape:', err.message);
      }
    }
    if (foundTabs.includes('Apprenticeships')) {
      const apprenticeshipsUrl = url.endsWith('/') ? url + 'apprenticeships' : url + '/apprenticeships';
      console.log('Navigating to apprenticeships page:', apprenticeshipsUrl);
      await page.goto(apprenticeshipsUrl, { waitUntil: 'networkidle2', timeout: 45000 });
      await scrollToBottom(page);
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Calling apprenticeships.js scraper...');
      apprenticeshipsData = await scrapeApprenticeships(page);
    }
    if (foundTabs.includes('International')) {
      const internationalUrl = url.endsWith('/') ? url + 'international' : url + '/international';
      console.log('Navigating to international page:', internationalUrl);
      await page.goto(internationalUrl, { waitUntil: 'networkidle2', timeout: 45000 });
      await scrollToBottom(page);
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Calling international.js scraper...');
      internationalData = await scrapeInternational(page);
    }
    if (foundTabs.includes('StudentSupport')) {
      const studentSupportUrl = url.endsWith('/') ? url + 'outreach' : url + '/outreach';
      console.log('Navigating to student support page:', studentSupportUrl);
      await page.goto(studentSupportUrl, { waitUntil: 'networkidle2', timeout: 45000 });
      await scrollToBottom(page);
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Calling student_support.js scraper...');
      studentSupportData = await scrapeStudentSupport(page);
    }
    // Build output in the US-style format
    const id = outputFileName.replace(/\.json$/, '');
    const slug = url.split('/').filter(Boolean).pop();
    const scrapedAt = new Date().toISOString();
    const output = {
      id,
      slug,
      scrapedAt,
      foundTabs,
      pages: {
        ...(aboutData && { About: aboutData }),
        ...(statsData && { Stats: statsData }),
        ...(studentLifeData && { StudentLife: studentLifeData }),
        ...(coursesData && { Courses: coursesData }),
        ...(apprenticeshipsData && { Apprenticeships: apprenticeshipsData }),
        ...(internationalData && { International: internationalData }),
        ...(studentSupportData && { StudentSupport: studentSupportData })
      }
    };
    const filePath = path.join(outputDir, outputFileName);
    await fs.writeFile(filePath, JSON.stringify(output, null, 2), 'utf8');
    console.log(`Saved: ${filePath}`);
    await page.close();
    return true;
  } catch (err) {
    await page.close();
    // Detect network or security errors
    if (
      err.message.includes('net::ERR_INTERNET_DISCONNECTED') ||
      err.message.includes('net::ERR_NAME_NOT_RESOLVED') ||
      err.message.includes('net::ERR_CONNECTION_TIMED_OUT') ||
      err.message.includes('net::ERR_FAILED') ||
      err.message.includes('Navigation timeout') ||
      err.message.includes('blocked') ||
      err.message.includes('403') ||
      err.message.includes('security')
    ) {
      console.error(`\nCRITICAL ERROR: Network or security issue detected while scraping ${url}. Stopping all further scraping.\nError: ${err.message}`);
      return false; // Signal to stop all
    } else {
      console.error(`Error scraping ${url}:`, err.message);
      return true; // Non-critical error, continue
    }
  }
}

// Main loop for all links
async function scrapeAll() {
  try {
    console.log('Starting scrapeAll');
    const links = await loadLinks();
    const userAgents = await loadUserAgents();
    await ensureOutputDir();
    const browser = await puppeteer.launch({ headless: true });
    // Set the starting index here
    const START_INDEX = 0; // Change this to resume from a specific university (e.g., 12 for UK0013.json)
    for (let i = START_INDEX; i < links.length; i++) {
      const url = links[i];
      const userAgent = userAgents[i % userAgents.length];
      const outputFileName = `UK${(i+1).toString().padStart(4, '0')}.json`;
      const ok = await scrapeUniversity({ url, userAgent, outputFileName, browser, index: i, total: links.length });
      if (!ok) {
        await browser.close();
        console.log('Stopped scraping due to critical error.');
        process.exit(1);
      }
    }
    await browser.close();
    console.log('All done!');
  } catch (err) {
    console.error('Fatal error in scrapeAll:', err);
    process.exit(1);
  }
}

// Always run the scraper when this script is executed
scrapeAll();
