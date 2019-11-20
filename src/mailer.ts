const nodemailer = require('nodemailer')
const config = require('./config')
import { log4js } from './utils'

const logger = log4js.getLogger(__filename)
export class Mailer {

    private transporter: any
    private count: number

    constructor() {
        this.transporter = nodemailer.createTransport({
            auth: {
                pass: config.mailer.mailer_pass, // generated ethereal password
                user: config.mailer.mailer_user, // generated ethereal user
            },
            host: config.mailer.mailer_host,
            port: config.mailer.mailer_port,
            secure: false, // true for 465, false for other ports
        })
        this.count = 0
    }

    public async sendMail(subject, body) {
        try {

            const htmlBody = `
            <html>
                <head>
                <meta http-equiv="content-type" content="text/html; charset=us-ascii">
                </head>
                <body dir="auto" style="margin: 0;">
                    <blockquote type="cite" style="-webkit-margin-before: 0em; -webkit-margin-after: 0em; -webkit-margin-start: 0px; -webkit-margin-end: 0px;">
                        <div style="max-width: 560px; margin: 0 auto; padding: 15px;">
                            <div style="position: relative; height: auto; overflow: hidden; margin: 0 auto; padding: 20px; border: 1px solid #b0bdbe;">
                                <p style="color: #27417f; font-size: 26px; text-align: center; margin-top: 35px; margin-bottom: 35px; letter-spacing: -0.3px;">大哥</p>
                                <p style="color: #5b5b5b; font-size: 16px; line-height: 1.7; margin-top: 12px;">
                                    又有新号码啦，速度去看看！
                                </p>
                                <p style="color: #5b5b5b; font-size: 16px; line-height: 1.7;">
                                    ${body}
                                </p>
                                <p style="color: #5b5b5b; font-size: 16px; line-height: 1.7;">
                                以上
                                </p>
                            </div>
                        </div>
                    </blockquote>
                </body>
            </html>
            `

            // send mail with defined transport object
            const info = await this.transporter.sendMail({
                from: `"Phone Number Updates Notification" <${config.mailer.mailer_from}>`, // sender address
                html: htmlBody, // html body
                subject, // Subject line
                to: config.mailer.mailer_to, // list of receivers
            })

            logger.info(`Message ${subject} sent: ${info.messageId}`)
            this.count = 0
            // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
        } catch (e) {
            logger.error(e)
            this.count += 1
            if (this.count === 10) {
                logger.error(`Failed ${this.count} times, stop sending`)
            } else {
                const time =  new Date(Date.now()).getSeconds()
                logger.error(`The ${this.count} resending will happen ${time} seconds late`)
                await new Promise( (resolve, reject) => {
                    setTimeout(async () => {
                        await this.sendMail(subject, body + '-----' + Date.now().toString())
                        resolve()
                    }, 1000 * time)
                })
            }
        }
    }
}
