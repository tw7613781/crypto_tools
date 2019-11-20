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
    protected count: number

    constructor(url) {
        this.urlOrigin = new URL(url)
        this.taskQ = []
        this.visited = []
        this.table = new Table(this.urlOrigin.host.split('.')[1])
        this.mailer = new Mailer()
        this.count = 0
    }

    public async start(mode) {
        this.count = 0
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
            const task = this.taskQ.shift()
            try {
                if (this.visited.includes(task)) {
                    logger.debug(`${task} has been visited, jump the task`)
                    await this.crawler()
                } else {
                    logger.info(`Starting to crawl task: ${task}`)
                    const page = await this.getPAGE(task)
                    logger.debug(`Got page successfully, parsing`)
                    await this.parser(task, page)
                    this.count = 0
                    const time =  new Date(Date.now()).getSeconds() / 2
                    logger.info(`Next crawl will happen at ${time} seconds late`)
                    setTimeout(() => {
                        this.crawler()
                    }, 1000 * time)
                }
            } catch (err) {
                this.count += 1
                logger.error(err)
                if (this.count === 10) {
                    logger.error(`Failed ${this.count} times, stop the task`)
                } else {
                    const time =  new Date(Date.now()).getSeconds() / 2
                    logger.error(`Retry ${this.count} times will happend ${time} seconds late`)
                    await new Promise( (resolve, reject) => {
                        setTimeout(async () => {
                            this.taskQ.push(task)
                            await this.crawler()
                            resolve()
                        }, 1000 * time)
                    })
                }
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
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Encoding': 'gzip, deflate',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Connection': 'keep-alive',
                    'Host': this.urlOrigin.hostname,
                    'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:39.0) Gecko/20100101 Firefox/39.0',
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
                        logger.info(`Found redirection ${location}`)
                        const newPage = this.urlOrigin.hostname + location
                        logger.info(`Found full path of redirection ${newPage}`)
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
