import puppeteer from 'puppeteer';

let browser = null;

export default async function _puppeteer() {
  if (!browser) {
    // browser = await puppeteer.launch({
    //   headless: true,
    //   args: [
    //     '--no-sandbox',
    //     '--disable-setuid-sandbox',
    //     '--disable-gpu',
    //     '--window-size=1920,1080',
    //     '--hide-scrollbars',
    //   ],
    //   executablePath: puppeteer.executablePath(),
    // });
    try {
      browser = await puppeteer.connect({
        browserWSEndpoint: process.env.PUPPETEER_ENDPOINT,
      });
    } catch (error) {
      throw error;
    }
  }

  return browser;
}
