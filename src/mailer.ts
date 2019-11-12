const nodemailer = require('nodemailer')
const config = require('./config')
import { log4js } from './utils'

const logger = log4js.getLogger(__filename)
export class Mailer {

    private transporter: any

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
    }

    public async sendMail(subject, body) {
        try {
        // send mail with defined transport object
        const info = await this.transporter.sendMail({
            from: `"Phone Number Updates Notification" <${config.mailer.mailer_from}>`, // sender address
            html: body, // html body
            subject, // Subject line
            to: config.mailer.mailer_to, // list of receivers
        })

        logger.info(`Message ${subject} sent: ${info.messageId}`)
        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
        } catch (e) {
            logger.error(e)
        }
    }
}
