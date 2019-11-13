import { URL } from 'url'
import { Mailer } from './mailer'
import { Table } from './table'
import { log4js } from './utils'

const { http, https } = require('follow-redirects')
const logger = log4js.getLogger(__filename)

export abstract class BaseCrawler {
    protected mode: number
    protected urlOrigin: URL
    protected taskQ: string[]
    protected visited: string[]
    protected table: Table
    protected mailer: Mailer

    constructor(url) {
        this.urlOrigin = new URL(url)
        this.taskQ = []
        this.visited = []
        this.table = new Table(this.urlOrigin.host.split('.')[1])
        this.mailer = new Mailer()
    }

    public start(mode) {
        this.mode = mode
        this.visited = []
        this.taskQ = []
        this.taskQ.push(this.urlOrigin.href)
        logger.info(`Starting to crawler ${this.urlOrigin.href}`)
        setTimeout(() => {
            this.crawler()
        }, 1000)
    }

    protected abstract async parser(task: string, page: string): Promise<void>

    private async crawler() {
        if (this.taskQ === undefined || this.taskQ.length === 0) {
            logger.info('Finish All Tasks')
        } else {
            try {
                const task = this.taskQ.shift()
                if (this.visited.includes(task)) {
                    logger.debug(`${task} has been visited, jump the task`)
                    await this.crawler()

                } else {
                    logger.debug(`Starting to crawl task: ${task}`)
                    const page = await this.getPAGE(task)
                    logger.debug(`Got page successfully, parsing`)
                    await this.parser(task, page)
                    setTimeout(() => {
                        this.crawler()
                    }, 1000)
                }
            } catch (err) {
                logger.error(`Failed for the task`)
                logger.error(err)
            }
        }
    }

    private getPAGE(urlString: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const urlMore = new URL(urlString)
            const service = urlMore.protocol === 'https:' ? https : http
            try {
                const options = {
                    headers: {
                        'Host': urlMore.host,
                        'User-Agent': 'request',
                    },
                    hostname: urlMore.hostname,
                    path: urlMore.pathname + urlMore.search,
                    port: 443,
                }
                const req = service.get(options, (res) => {
                    let body = ''
                    res.on('data', (chunk) => {
                        body += chunk
                    })
                    res.on('end', () => {
                        logger.info(body)
                        if (res && res.statusCode === 200) {
                            this.visited.push(urlMore.href)
                            resolve(body)
                        } else {
                            if (res) {
                                reject(`response status is not 200 but ${res.statusCode}`)
                            } else {
                                reject(`fail without res object`)
                            }
                        }
                    })
                })
                req.on('error', ( e ) => {
                    reject(e)
                })
            } catch (e) {
                logger.error(e)
                throw e
            }
        })
    }
}
