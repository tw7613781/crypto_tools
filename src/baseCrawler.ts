import { URL } from 'url'
import { Mailer } from './mailer'
import { Table } from './table'
import { log4js } from './utils'

const puppeteer = require('puppeteer')
const logger = log4js.getLogger(__filename)

export abstract class BaseCrawler {
    protected mode: number
    protected urlOrigin: URL
    protected taskQ: string[]
    protected visited: string[]
    protected table: Table
    protected mailer: Mailer
    protected browser: any
    protected page: any

    constructor(url) {
        this.urlOrigin = new URL(url)
        this.taskQ = []
        this.visited = []
        this.table = new Table(this.urlOrigin.host.split('.')[1])
        this.mailer = new Mailer()
    }

    public async start(mode) {
        this.browser = await puppeteer.launch({
            args: ['--no-sandbox'],
            headless: true,
        })
        this.page = await this.browser.newPage()
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
            await this.browser.close()
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

    private async getPAGE(urlString: string): Promise<string> {
        try {
            await this.page.goto(urlString)
            this.visited.push(urlString)
            return await this.page.content()
        } catch (e) {
            logger.error(e)
            throw e
        }
    }
}
