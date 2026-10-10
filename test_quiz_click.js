
const puppeteer = require('puppeteer-core');
(async () => {
  try {
    const browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1050 });
    await page.goto('http://localhost:8800/?tab=countries&country_quiz=1', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    
    // Click the correct answer
    await page.evaluate(() => {
      const q = window.app.currentCountryQuiz;
      if (q) {
        window.app.checkCountryQuiz(q.answer);
      }
    });

    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: 'C:/Users/Admin/Desktop/정은찬/test_quiz_answered.png' });
    await browser.close();
    console.log('Quiz answered screenshot taken successfully!');
  } catch(e) {
    console.log('Puppeteer error:', e);
  }
})();
