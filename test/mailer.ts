import { Mailer } from '../src/mailer'

const mailer = new Mailer()

const info = `Got a message from pdflibr, phone number is :43efewrfew, page number: 3`
const subject = `New phone number: 43efewrfew`

mailer.sendMail(subject, info)
