import puppeteer from 'puppeteer-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import dotenv from 'dotenv';
import ytdl from 'ytdl-core';
import fs from 'fs';
import readline from 'readline';
import sanitize from 'sanitize-filename';

puppeteer.use(stealthPlugin());
dotenv.config();

(async () => {
  const browser = await puppeteer.launch({
    defaultViewport: null,
    args: [
      '--start-maximized', 
      '--window-size=1920,1080',
    ],
    headless: true,
  });

  const page = await browser.newPage();
  await page.goto('https://youtube.com');
  
  async function waitForProgressBar() {
    return page.waitForSelector('[aria-busy="true"]', {hidden: true});
  }

  const youtubeSignInButton = await page.waitForSelector('tp-yt-paper-button[aria-label="Sign in"]');
  await youtubeSignInButton.click();

  const emailInput = await page.waitForSelector('#identifierId');
  await emailInput.type(process.env.EMAIL);
  await page.click('#identifierNext');
  await waitForProgressBar();

  if (await page.waitForXPath("//div[contains(text(), 'An account owned by')]"), {timeout: 3000}) {
    const workspaceAccountButton = await page.waitForXPath("//div[contains(text(), 'An account owned by')]");
    await page.waitForTimeout(2000);
    await workspaceAccountButton.click();
    await waitForProgressBar();
  }

  const passwordInput = await page.waitForSelector('#password');
  await passwordInput.type(process.env.PASSWORD);
  await page.click('#passwordNext');
  await page.waitForNavigation({waitUntil: 'networkidle0'});

  console.log('Please, login on your mobile device!');
  await page.waitForTimeout(10000);
  await waitForProgressBar();

  const watchLaterButton = await page.waitForSelector('a[href="/playlist?list=WL"');
  await watchLaterButton.click();
  await page.waitForSelector('#playlist-thumbnails');
  const links = await page.$$eval('#thumbnail > a[id="thumbnail"]',
      (list) => list.map((elm) => elm.href.split('&list=WL&index=')[0]));

  await browser.close();

  const currentDir = './downloads/' + new Date().toISOString().split('T')[0];
  if (!fs.existsSync(currentDir)) {
    fs.mkdirSync(currentDir);
  }

  console.log('Start downloading videos');
  for (let i = 0; i < links.length; i++) {
    const video = ytdl(links[i]);
    const info = await ytdl.getInfo(links[i]);
    const output = `${currentDir}/${sanitize(info.videoDetails.title)}.mp4`;

    await new Promise((resolve, reject) => {
      video.pipe(fs.createWriteStream(output));
      video.once('response', () => {
        startTime = Date.now();
      });
      video.on('progress', (chunkLength, downloaded, total) => {
        const percent = downloaded / total;
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(`Downloading video #${i+1}: ${info.videoDetails.title}. ${(percent * 100).toFixed(2)}% downloaded `);
      });
      video.on('end', () => resolve(process.stdout.write('\n')));
      video.on('error', reject);
    });
  }
})();
