import * as cheerio from 'cheerio'
import { URL } from 'url'
import { Table } from './table'
import { log4js } from './utils'

const request = require('request')
const logger = log4js.getLogger(__filename)

interface Ioptions {phoneNumberSelector: string, linkSelctor: string}
export class HTMLCrawler {

    private taskQ: string[]
    private visited: string[]
    private mode: number
    private table: Table
    private urlOrigin: URL
    private options: Ioptions

    constructor(url, mode, options) {
        this.urlOrigin = new URL(url)
        this.taskQ = []
        this.visited = []
        this.mode = mode
        this.table = new Table(this.urlOrigin.host.split('.')[1])
        this.options = options
    }

    public start() {
        this.visited = []
        this.taskQ = []
        this.taskQ.push(this.urlOrigin.href)
        setTimeout(() => {
            this.crawler()
        }, 1000)
    }

    private async crawler() {
        if (this.taskQ === undefined || this.taskQ.length === 0) {
            logger.warn('Finish All Tasks')
        } else {
            try {
                const task = this.taskQ.shift()
                if (this.visited.includes(task)) {
                    logger.info(`${task} has been visited, jump the task`)
                    await this.crawler()
                } else {
                    logger.info(`Starting to crawl task: ${task}`)
                    const page = await this.getPAGE(task)
                    logger.info(`Got page successfully, parsing`)
                    await this.parser(page)
                    await this.crawler()
                }
            } catch (err) {
                logger.info(`Failed for the task`)
                logger.error(err)
            }
        }
    }

    private getPAGE(urlString: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const urlMore = new URL(urlString)
            const options = {
                headers: {
                    'Host': urlMore.host,
                    'User-Agent': 'request',
                },
                url: urlMore.href,
            }
            request(options, (err, res, body) => {
                if (err) {
                    reject(err)
                }
                if (res && res.statusCode === 200) {
                    this.visited.push(urlMore.href)
                    resolve(body)
                } else {
                    reject(`response status is not 200 and res is ${res}`)
                }
            })
        })
    }

    private async parser(page: string) {
        try {
            const $ = cheerio.load(page)
            const rets = $(this.options.phoneNumberSelector).text().split('+')
            for (const ele of rets) {
                if (ele === '') {
                    continue
                } else {
                    const numbers = ele.trim().split(' ')
                    if (numbers[0].trim() === '86') {
                        const num = numbers[1].trim()
                        logger.info(`Found China phone number: ${num}`)
                        if (this.mode === 0 ) {
                            await this.table.insert(Date.now(), num)
                        } else if ( this.mode === 1) {
                            const exist = await this.table.search(num)
                            if (exist) {
                                logger.info('Exist in DB')
                            } else {
                                logger.info('New phone number found, notifing')
                                // this.notify(num)
                            }
                        } else {
                            continue
                        }
                    }
                }
            }
            await new Promise((resolve, _) => {
                $(this.options.linkSelctor).each( (_, ele) => {
                    const taskNext = ele.attribs.href.trim()
                    if (!this.visited.includes(taskNext)) {
                        logger.info(`Found new task ${taskNext}, push the taskQ`)
                        this.taskQ.push(taskNext)
                    }
                })
                resolve()
            })
        } catch ( e ) {
            logger.error(e)
        }
    }
}

const htmlCrawler = new HTMLCrawler('https://www.yinsiduanxin.com/dl/1', 0, {
    linkSelctor: 'ul.pagination a[href*="yinsiduanxin"]',
    phoneNumberSelector: '.layuiadmin-big-font.card-phone .clickA',
})
htmlCrawler.start()
