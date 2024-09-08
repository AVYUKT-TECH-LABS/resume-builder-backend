import puppeteer from 'puppeteer';

let browser = null;

export default async function _puppeteer() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--window-size=11920,1080',
        '--hide-scrollbars',
      ],
      executablePath: puppeteer.executablePath(),
    });
  }

  return browser;
}
