/* eslint-disable camelcase */
import fs from 'fs-extra'
import path from 'path'
import express from 'express'
import bodyParser from 'body-parser'
import http from 'http'

export default {
    google(callback) {
        const app = express()

        app.use(bodyParser.json())
        .get('/', (req, res) => {
            const { client_id, redirect_uri, scope } = this.driveClient
            const authURL = this.oauth2Client.generateAuthUrl({
                client_id,
                redirect_uri,
                scope,
                access_type: 'offline',
                response_type: 'code',
                prompt: 'consent', // TODO: refresh_token should update automatically
            })
            res.redirect(authURL)
        })
        .get('/oauth2callback', (req, res) => {
            this.oauth2Client.getToken(req.query.code, (err0, tokens) => {
                if (err0) { throw err0 }
                this.credentials = { ...this.credentials, ...tokens }
                this.oauth2Client.setCredentials(this.credentials)

                const credPath = path.join(__dirname, this.client, '.credentials.json')
                fs.writeFile(credPath, JSON.stringify(this.credentials), 'utf8', err1 => {
                    if (err1) { throw err1 }
                    res.send({ status: 'OK' })
                    this.exit(callback)
                })
            })
        })

        this.server = http.createServer(app)
        this.subscribeServer()
        this.startServer()
    },
    dropbox(callback) {
        const app = express()

        app.use(bodyParser.urlencoded({ extended: true }))
        .get('/', (req, res) => {
            const { redirect_uri } = this.dropboxClient
            const authURL = this.dropbox.getAuthenticationUrl(redirect_uri)
            res.redirect(authURL)
        })
        .post('/oauthResponseFragment', (req, res) => {
            const { access_token, token_type, uid, account_id } = req.body
            const response = { accessToken: access_token, token_type, uid, account_id }

            this.credentials = { ...this.credentials, ...response }
            this.dropbox.accessToken = access_token

            const credPath = path.join(__dirname, this.client, '.credentials.json')
            fs.writeFile(credPath, JSON.stringify(this.credentials), 'utf8', err1 => {
                if (err1) { throw err1 }
                res.send({ status: 'OK' })
                this.exit(callback)
            })
        })
        .get('/oauth2callback', (req, res) => {
            const clientScript = `
            function sendFragment() {
                var xhr = new XMLHttpRequest()
                xhr.open('POST', '/oauthResponseFragment', true)
                xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
                xhr.send(window.location.hash.slice(1))
            }
            window.onload = sendFragment`
            res.send(`<html><body><script>${clientScript}</script></body>`)
        })

        this.server = http.createServer(app)
        this.subscribeServer()
        this.startServer()
    },
}
