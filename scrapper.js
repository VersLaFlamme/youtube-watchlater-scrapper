import puppeteer from 'puppeteer-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import youtubeDl from 'youtube-dl';
import fs from 'fs';
import dotenv from 'dotenv';

puppeteer.use(stealthPlugin());
dotenv.config();

(async () => {
  const browser = await puppeteer.launch({
    defaultViewport: null,
    args: ['--start-maximized', '--window-size=1920,1080'],
    headless: true,
  });

  const page = await browser.newPage();
  await page.goto('https://youtube.com');

  const youtubeSignInButton = await page.waitForSelector('tp-yt-paper-button[aria-label="Sign in"]');
  await youtubeSignInButton.click();

  const emailInput = await page.waitForSelector('#identifierId');
  await emailInput.type(process.env.EMAIL);
  await page.click('#identifierNext');
  await page.waitForSelector('[aria-busy="true"]', {hidden: true});
  const passwordInput = await page.waitForSelector('#password');
  await passwordInput.type(process.env.PASSWORD);
  await page.click('#passwordNext');
  await page.waitForNavigation({waitUntil: 'networkidle0'});

  await page.click('a[href="/playlist?list=WL"');
  await page.waitForSelector('#playlist-thumbnails');
  const links = await page.$$eval('#thumbnail > a[id="thumbnail"]',
      (list) => list.map((elm) => elm.href.split('&list=WL&index=')[0]));

  await browser.close();

  downloadVideos(links);
})();

// eslint-disable-next-line require-jsdoc
function downloadVideos(links) {
  console.log('Downloading watch later list');
  const currentDir = './downloads/' + new Date().toISOString().split('T')[0];
  if (!fs.existsSync(currentDir)) {
    fs.mkdirSync(currentDir);
  }
  for (let i = 0; i < links.length; i++) {
    const video = youtubeDl(
        links[i],
        ['--format=18'],
        {cwd: './downloads'},
    );

    video.on('info', function(info) {
      console.log(`Downloading video #${i+1}: ` + info.title + '. Size: ' + info.size);
      video.pipe(fs.createWriteStream(`${currentDir}/${i+1}. ${info.title}.mp4`));
    });

    video.on('end', function() {
      console.log(`Video #${i+1} downloaded`);
    });
  }
}
