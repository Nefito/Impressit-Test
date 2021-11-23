import { exit } from 'process'
import puppeteer from 'puppeteer'
import readline from 'readline'

const baseGenreUrl = '/top/bestofrt/top_100_'

const movieGenres: { name: string, url: string }[] = [
  {
    name: 'Action & Adventures',
    url: 'action__adventure_movies',
  },
  {
    name: 'Animation',
    url: 'animation_movies',
  },
  {
    name: 'Classics',
    url: 'classics_movies',
  },
  {
    name: 'Comedy',
    url: 'comedy_movies',
  },
  {
    name: 'Documentary',
    url: 'documentary_movies',
  },
  {
    name: 'Drama',
    url: 'drama_movies',
  },
  {
    name: 'Kids & Family',
    url: 'kids__family_movies',
  },
  {
    name: 'Musical & Performing Arts',
    url: 'musical__performing_arts_movies',
  },
  {
    name: 'Mystery & Suspense',
    url: 'mystery__suspense_movies',
  },
  {
    name: 'Romance',
    url: 'romance_movies',
  },
  {
    name: 'Science Fiction & Fantasy',
    url: 'science_fiction__fantasy_movies',
  },
  {
    name: 'Special Interest',
    url: 'special_interest_movies',
  },
  {
    name: 'Sport & Fitness',
    url: 'sports__fitness_movies',
  },
  {
    name: 'Television',
    url: 'television_movies',
  },
  {
    name: 'Western',
    url: 'western_movies',
  },

]

async function getMovie(): Promise<string> {
  const readlineInstance = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise<string>((resolve, reject) => {
      movieGenres.forEach((genre, index) => console.log(`[${index+1}] ${genre.name}`))
      readlineInstance.question('Enter genre index: ', (answer) => {
        readlineInstance.close()
        if (isNaN(Number(answer))) {
          reject(new Error('Enter a number!'))
        }
        else if (Number(answer) < 1 || Number(answer) > movieGenres.length) {
          reject(new Error('Index out of bonds'))
        }
        resolve(movieGenres[Number(answer) - 1].url)
      })
  }).catch((e: Error) => {
     console.log(`${e.name}: ${e.message}`)
     exit()
  })
}

(async () => {

  let genreUrl = await getMovie()

  try {
    const headlessBrowser = await puppeteer.launch()
    const rottenTomatoesPage = await headlessBrowser.newPage()
    await rottenTomatoesPage.goto('https://www.rottentomatoes.com/top')
    await rottenTomatoesPage.waitForSelector(`a[href*='${baseGenreUrl}${genreUrl}/']`)
    await rottenTomatoesPage.click(`a[href*='${baseGenreUrl}${genreUrl}/']`)
    await rottenTomatoesPage.waitForSelector('td a.articleLink')
    let element = await rottenTomatoesPage.$('td a.articleLink')
    let movie: string = await rottenTomatoesPage.evaluate(el => el.textContent, element)
    await headlessBrowser.close()

    const browser = await puppeteer.launch({ headless: false })
    const ebayPage = await browser.newPage()
    await ebayPage.goto('https://ebay.com')
    await ebayPage.waitForSelector("[aria-label='Search for anything']")
    await ebayPage.type("[aria-label='Search for anything']", `${movie.trim()} DVD`)
    await ebayPage.keyboard.down("Enter")
    await ebayPage.waitForSelector("li[data-view*='iid:1']")
    const movieLink = await ebayPage.$("li[data-view*='iid:1'] a") 
    await ebayPage.evaluateHandle((el) => { el.target = '_self' }, movieLink)
    movieLink?.click()
    await ebayPage.waitForSelector("#isCartBtn_btn")
    await ebayPage.click("#isCartBtn_btn")
    await ebayPage.waitForSelector("[data-test-id='cta-top']")
    await ebayPage.click("[data-test-id='cta-top']")
    await ebayPage.waitForTimeout(2000)
    await ebayPage.waitForSelector('#gxo-btn')
    await ebayPage.click('#gxo-btn')
  } catch (e) {
    console.log(e)
  }
})()