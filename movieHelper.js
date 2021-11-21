const { exit } = require('process');
const puppeteer = require('puppeteer');
const readline = require('readline');

const movieGenres = [
  'Action',
  'Animation',
  'Comedy',
  'Documentary',
  'Romance',
  'Western',
];

async function getMovie() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve, reject) => {
      movieGenres.forEach((genre, index) => console.log(`[${index+1}] ${genre}`))
      rl.question('Enter genre index: ', (answer) => {
        rl.close();
        if (isNaN(Number(answer))) {
          reject(new Error('Enter a number!'));
        }
        else if (Number(answer) < 1 || Number(answer) > 6) {
          reject(new Error('Index out of bonds'));
        }
        resolve(movieGenres[Number(answer)-1]);
      });
  }).catch(e => {
     console.log(e);
     exit();
  })
}

(async () => {

  let genre = await getMovie();

  try {
    const headlessBrowser = await puppeteer.launch();
    const rottenTomatoesPage = await headlessBrowser.newPage();
    await rottenTomatoesPage.goto('https://www.rottentomatoes.com/top');
    await rottenTomatoesPage.waitForSelector(`a[href*=${String(genre).toLowerCase()}]`);
    await rottenTomatoesPage.click(`a[href*=${String(genre).toLowerCase()}]`);
    await rottenTomatoesPage.waitForSelector('td a.articleLink');
    let element = await rottenTomatoesPage.$('td a.articleLink');
    let movie = await rottenTomatoesPage.evaluate(el => el.textContent, element);
    await headlessBrowser.close();

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto('https://ebay.com');
    await page.waitForSelector("[aria-label='Search for anything']");
    await page.type("[aria-label='Search for anything']", `${movie.trim()} DVD`);
    await page.keyboard.down("Enter");
    await page.waitForSelector("li[data-view*='iid:1']");
    await page.click("li[data-view*='iid:1'] [data-track*='luid:1']");
    await page.waitForTimeout(3000);

    const pages = await browser.pages();

    const page2 = pages[pages.length - 1]
    await page2.waitForSelector("#isCartBtn_btn");
    await page2.click("#isCartBtn_btn");
    await page2.waitForSelector("[data-test-id='cta-top']");
    await page2.click("[data-test-id='cta-top']");
    await page.waitForTimeout(2000);
    await page2.waitForSelector('#gxo-btn');
    await page2.click('#gxo-btn');
  } catch (e) {
    console.log(e);
  }
})();