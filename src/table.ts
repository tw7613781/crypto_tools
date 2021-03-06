const sqlite3 = require('sqlite3').verbose()
const { log4js } = require('./utils')

const logger = log4js.getLogger(__filename)

export class Table {

    private table: string
    private db: any

    constructor(tableName) {
        this.table = tableName
        this.db = new sqlite3.Database('data.db', ( err ) => {
            if (err) {
                logger.error(err)
            } else {
                logger.info('Connected with DB file')
            }
        })
        this.db.serialize(() => {
            this.db.run(`CREATE TABLE IF NOT EXISTS ${this.table}(
                timestamp text NOT NULL,
                phoneNumber text NOT NULL)`, ( err ) => {
                if (err) {
                    logger.error(err)
                } else {
                    logger.info(`Use table ${this.table}`)
                }
            })
            this.db.run(`CREATE INDEX IF NOT EXISTS IXphoneNumber ON ${this.table}(phoneNumber)`, ( err ) => {
                if (err) {
                    logger.error(err)
                }
            })
        })
    }

    public insert(timestamp, phoneNumber) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO ${this.table} (timestamp, phoneNumber) VALUES (?,?)`
            const params = [timestamp, phoneNumber]
            this.db.run(sql, params, (e) => {
                if (e) {
                    logger.error(`insert table ${this.table} error`)
                    resolve(e)
                } else {
                    logger.debug(`${phoneNumber} saved`)
                    resolve()
                }
            })
        })
    }

    public search(phoneNumber) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT timestamp, phoneNumber FROM ${this.table} WHERE phoneNumber = $phoneNumber`
            const params = {
                $phoneNumber: phoneNumber,
            }
            this.db.all(sql, params, (e, rows) => {
                if (e) {
                    resolve(false)
                    return
                }
                if (rows.length === 0) {
                    logger.debug(`Cannot found the number ${phoneNumber}`)
                    resolve(false)
                } else {
                    logger.debug(`Found the number ${phoneNumber}`)
                    resolve(true)
                }
            })
        })
    }
}
