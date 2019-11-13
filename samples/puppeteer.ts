import { log4js } from '../src/utils'
const puppeteer = require('puppeteer')

const logger = log4js.getLogger(__filename)

async function main() {
    const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()
  
    // Instructs the blank page to navigate a URL
    await page.goto('https://www.pdflibr.com/')
    
    // Fetches page's title
    const content = await page.content()
    console.info(`The title is: ${content}`)
  
    await browser.close()
}

main().catch( (e) => {
    logger.info(e)
})