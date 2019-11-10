import { URL } from 'url'
import { log4js } from './utils'
const cheerio = require('cheerio')
const request = require('request')
const logger = log4js.getLogger(__filename)

interface IJob { url: string, html: string}

export class HTMLCrawler {

    private taskQ: string[] = []
    private visited: string[] = []
    private target: string
    private baseURL: string

    constructor() {

    }

    // task is a url string
    public addTask(task: string) {
        this.taskQ.push(task)
    }

    private crawler() {
        if (this.taskQ === undefined || this.taskQ.length === 0) {
            logger.warn('Finish All Tasks')
        } else {
            try {
                const task = this.taskQ.shift()
                logger.info(`Starting to crawl task: ${task}`)
                const options = {
                    headers: {
                        'Host': 'www.pdflibr.com',
                        'User-Agent': 'request',
                    },
                    url: task,
                }
                request(options, (err, res, body: string) => {
                    if (err) {
                        return logger.error(err)
                    }
                    if (res && res.statusCode === 200) {
                        this.visited.push(task)
                        this.jobQ.push({url: task, html: body})
                        logger.info(body)
                    } else {
                        logger.error(`Cannot get HTML page, return code is ${res.statusCode}`)
                    }
                })
            } catch (err) {
                logger.error(err)
            }
        }
    }

    private getPAGE(urlString:string) {
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
                    reject(`response status is ${res.statusCode}`)
                }
            })
        })
    }

    private parser() {
        if (this.jobQ === undefined || this.jobQ.length === 0) {
            logger.warn('No job in jobQ')
        } else {
            try {
                const {url, html} = this.jobQ.shift()
                const $ = cheerio.load(html)
                logger.log(url)
                logger.log($.html())
            } catch (err) {
                logger.error(err)
            }
        }
    }
}

// test

const htmlCrawler = new HTMLCrawler()
htmlCrawler.addTask('https://www.pdflibr.com/')
