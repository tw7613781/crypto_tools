import * as cheerio from 'cheerio'
import { BaseCrawler } from '../baseCrawler'
import { log4js } from '../utils'

const logger = log4js.getLogger(__filename)

export class PdflibrCrawler extends BaseCrawler {
    constructor(url) {
        super(url)
    }

    protected async parser(task: string, page: string): Promise<void> {
        return await new Promise( async (resolve, reject) => {
            try {
                const $ = cheerio.load(page)
                const rets = $('div.phone_number-text').text().trim().split('\n')
                for (const ele of rets) {
                    if ( ele.length === 20 ) {
                        continue
                    } else {
                        const fullPhoneNumber = ele.trim()
                        const countryCode = fullPhoneNumber.substring(0, 3)
                        const phoneNumber = fullPhoneNumber.substring(3)
                        if (countryCode === '+86') {
                            logger.debug(`Found China phone number: ${phoneNumber}`)
                            if (this.mode === 0 ) {
                                await this.table.insert(Date.now(), phoneNumber)
                            } else if ( this.mode === 1) {
                                const exist = await this.table.search(phoneNumber)
                                if (exist) {
                                    logger.debug('Exist in DB')
                                } else {
                                    logger.info(`New phone number ${phoneNumber} found, Notifing`)
                                    const fullURL = task
                                    const subject = `New number: ${phoneNumber}`
                                    this.mailer.sendMail(subject, fullURL)
                                    await this.table.insert(Date.now(), phoneNumber)
                                }
                            } else {
                                // pass
                            }
                        }
                    }
                }
                $('ul.pagination a[href*="page"]').each( (_, ele) => {
                    const taskNext = ele.attribs.href.trim()
                    const taskFull = `${this.urlOrigin.origin}${taskNext}`
                    if (!this.visited.includes(taskFull)) {
                        logger.debug(`Found new task ${taskFull}, push the taskQ`)
                        this.taskQ.push(taskFull)
                    }
                })
                resolve()
            } catch ( e ) {
                logger.error(e)
                reject(e)
            }
        })
    }
}

const params = process.argv[2]

if (params === '-i') {
    const pdflibrCrawler = new PdflibrCrawler('https://www.pdflibr.com/?page=1')
    pdflibrCrawler.start(0)
} else if (params === '-m') {
    const pdflibrCrawler = new PdflibrCrawler('https://www.pdflibr.com/?page=1')
    setImmediate(() => {
        pdflibrCrawler.start(1)
    })
    setInterval(() => {
        pdflibrCrawler.start(1)
    }, 1000 * 60 * 60 * 2)
} else {
    logger.error('Params are incorrect.')
    logger.info('-i: initila database with current data')
    logger.info('-m: monitoring website to find new phone')
}
