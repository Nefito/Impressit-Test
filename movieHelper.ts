import { exit } from 'process'
import puppeteer from 'puppeteer'
import readline from 'readline'

import { movieGenres, baseGenreUrl } from './consts'

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

    //go to RottenTomatoes to find the top movie and get its title

    const headlessBrowser = await puppeteer.launch()
    const rottenTomatoesPage = await headlessBrowser.newPage()
    await rottenTomatoesPage.goto('https://www.rottentomatoes.com/top', { waitUntil: 'load' })
      .catch(() => {
      console.log('Failed to load the page')
      exit()
    })
    //wait for and then click on the genre the user has selected
    await rottenTomatoesPage.waitForSelector(`a[href*='${baseGenreUrl}${genreUrl}/']`)
      .catch(() => {
        rottenTomatoesPage.reload({ waitUntil: 'load' })
      }).catch(() => {
        console.log('Could not find the selected genre')
        exit()
      })
    await rottenTomatoesPage.click(`a[href*='${baseGenreUrl}${genreUrl}/']`)
    await rottenTomatoesPage.waitForSelector('td a.articleLink')
    //get our movie title from its html element
    const element = await rottenTomatoesPage.$('td a.articleLink')
    const movie: string = await rottenTomatoesPage.evaluate(el => el.textContent, element)
    await headlessBrowser.close()

    //go to ebay to find and buy the DVD of the movie we saved

    const browser = await puppeteer.launch({ headless: false })
    const ebayPage = await browser.newPage()
    await ebayPage.goto('https://ebay.com')
      .catch(() => {
        console.log('Failed to load the page')
        exit()
      })
    //search for item
    await ebayPage.waitForSelector("[aria-label='Search for anything']")
    await ebayPage.type("[aria-label='Search for anything']", `${movie.trim()} DVD`)
    await ebayPage.keyboard.down("Enter")
    //open the first items page
    await ebayPage.waitForSelector("li[data-view*='iid:1']").catch(() => ebayPage.reload({ waitUntil: 'load' }))
    .catch(() => {
      console.log('There are no items or they have not loaded properly')
      exit()
    })
    const movieLink = await ebayPage.$("li[data-view*='iid:1'] a") 
    //here I stop the link from opening in a new tab
    await ebayPage.evaluateHandle((el) => { el.target = '_self' }, movieLink)
    movieLink?.click()
    //add item to cart
    await ebayPage.waitForSelector("#isCartBtn_btn").catch(() => ebayPage.reload({ waitUntil: 'load' }))
    .catch(() => {
      console.log("There seems to be a problem with the add to cart button")
      exit()
    })
    await ebayPage.click("#isCartBtn_btn")
    //go to checkout page
    await ebayPage.waitForSelector("[data-test-id='cta-top']").catch(() => ebayPage.reload({ waitUntil: 'load' }))
    .catch(() => {
      console.log("There seems to be a problem with the checkout button")
      exit()
    })
    await ebayPage.click("[data-test-id='cta-top']")
    //click 'continue as guest' on a prompt that appears before letting us go to the checkout page 
    await ebayPage.waitForTimeout(2000)
    await ebayPage.waitForSelector('#gxo-btn')
    await ebayPage.click('#gxo-btn')

    //ask the user to complete a captcha is there is one
    if (await ebayPage.waitForSelector('.target-icaptcha-slot')) {
      console.log('Oops! We encountered a captcha! Please fill in the captcha to continue to checkout page.')
    }
  } catch (e) {
    let error = e as Error
    console.log(`${error.name}: ${error.message}`)
  }
})()