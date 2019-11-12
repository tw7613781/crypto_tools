import * as cheerio from 'cheerio'
import { BaseCrawler } from '../baseCrawler'
import { log4js } from '../utils'

const logger = log4js.getLogger(__filename)

export class YingsiduanxinCrawler extends BaseCrawler {
    constructor(url) {
        super(url)
    }

    protected async parser(task: string, page: string): Promise<void> {
        return await new Promise( async (resolve, reject) => {
            try {
                const $ = cheerio.load(page)
                const rets = $('.layuiadmin-big-font.card-phone .clickA').text().split('+')
                for (const ele of rets) {
                    if (ele === '') {
                        continue
                    } else {
                        const numbers = ele.trim().split(' ')
                        if (numbers[0].trim() === '86') {
                            const num = numbers[1].trim()
                            logger.debug(`Found China phone number: ${num}`)
                            if (this.mode === 0 ) {
                                await this.table.insert(Date.now(), num)
                            } else if ( this.mode === 1) {
                                const exist = await this.table.search(num)
                                if (exist) {
                                    logger.debug('Exist in DB')
                                } else {
                                    logger.info(`New phone number ${num} found, Notifing`)
                                    const fullURL = `${this.urlOrigin.origin}/message/${num}.html`
                                    const subject = `New number: ${num}`
                                    this.mailer.sendMail(subject, fullURL)
                                    await this.table.insert(Date.now(), num)
                                }
                            } else {
                                // pass
                            }
                        }
                    }
                }
                $('ul.pagination a[href*="yinsiduanxin"]').each( (_, ele) => {
                    const taskNext = ele.attribs.href.trim()
                    if (!this.visited.includes(taskNext)) {
                        logger.debug(`Found new task ${taskNext}, push the taskQ`)
                        this.taskQ.push(taskNext)
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
    const yingsiduanxinCrawler = new YingsiduanxinCrawler('https://www.yinsiduanxin.com/dl/1')
    yingsiduanxinCrawler.start(0)
} else if (params === '-m') {
    const yingsiduanxinCrawler = new YingsiduanxinCrawler('https://www.yinsiduanxin.com/dl/1')
    setImmediate(() => {
        yingsiduanxinCrawler.start(1)
    })
    setInterval(() => {
        yingsiduanxinCrawler.start(1)
    }, 1000 * 60 * 60)
} else {
    logger.error('Params are incorrect.')
    logger.info('-i: initila database with current data')
    logger.info('-m: monitoring website to find new phone')
}
