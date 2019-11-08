import * as express from 'express'

export enum RESPONSE_CODE {
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    NOT_FOUND = 404,
    INTERNAL_SERVER_ERROR = 500,
    NOT_IMPLEMENTED = 501,
    SERVICE_UNAVAILABLE = 503,
}

export function getResponseKey(value: number) {
    return RESPONSE_CODE[value]
}

export class ErrorHandler {
    public static invalidParam(res: express.Response) {
        const status = 400
        const error = getResponseKey(status)
        const message = `The request was unacceptable, often due to missing a required parameter.`
        res.status(status)
        return res.json({ status, timestamp: Date.now(), error, message })
    }

    public static unauthorized(res: express.Response) {
        const status = 401
        const error = getResponseKey(status)
        const message = 'Authentication was invalid.'
        res.status(status)
        return res.json({ status, timestamp: Date.now(), error, message })
    }

    public static notFound(res: express.Response) {
        const status = 404
        const error = getResponseKey(status)
        const message = `The requested resource doesn't exist.`
        res.status(status)
        return res.json({status, timestamp: Date.now(), error, message})
    }

    public static serviceError(res: express.Response) {
        const status = 503
        const error = getResponseKey(status)
        const message = `Server internal error.`
        res.status(status)
        return res.json({status, timestamp: Date.now(), error, message})
    }
}
