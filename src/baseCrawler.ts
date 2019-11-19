import * as request from 'request'
import { URL } from 'url'
import { Mailer } from './mailer'
import { Table } from './table'
import { log4js } from './utils'

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

    public async start(mode) {
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
                    logger.info(`Starting to crawl task: ${task}`)
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

    private async getPAGE(urlString: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const options = {
                encoding: null,
                followRedirect: true,
                forever: true,
                gzip: true,
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                },
                url: urlString,
            }
            request.get(options, (err, res, body) => {
                if (err) {
                    return reject(err)
                } else {
                    if (res && res.statusCode === 200) {
                        this.visited.push(urlString)
                        return resolve(body)
                    }
                    if (res && res.statusCode >= 300 && res.statusCode < 400) {
                        const location = res.headers.location
                        logger.info(location)
                        const newPage = this.urlOrigin.hostname + location
                        logger.info(newPage)
                        if (!this.visited.includes(newPage)) {
                            logger.debug(`Found new task ${newPage}, push the taskQ`)
                            this.taskQ.push(newPage)
                        }
                        return resolve('')
                    } else {
                        reject(`Cannot process the response: ${res}`)
                    }
                }
            })
        })
    }
}
