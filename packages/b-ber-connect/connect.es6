/* eslint-disable camelcase, no-multi-spaces */
import fs from 'fs-extra'
import path from 'path'
import google from 'googleapis'
import Dropbox from 'dropbox'
import { remove } from 'lodash'
import opn from 'opn'
import crypto from 'crypto'

import initializers from './initializers'
import authServers from './auth-servers'

class Connect {
    // app
    set client(val)         { this._client = val          }
    set credentials(val)    { this._credentials = val     }
    set authorize(val)      { this._authorize = val       }
    get client()            { return this._client         }
    get credentials()       { return this._credentials    }
    get authorize()         { return this._authorize      }

    // servers
    set server(val)         { this._server = val          }
    set port(val)           { this._port = val            }
    set socket(val)         { this._socket = val          }
    set sockets(val)        { this._sockets = val         }
    set socketIds(val)      { this._socketIds = val       }
    get server()            { return this._server         }
    get port()              { return this._port           }
    get socket()            { return this._socket         }
    get sockets()           { return this._sockets        }
    get socketIds()         { return this._socketIds      }

    // clients
    set driveClient(val)    { this._driveClient = val     }
    set oauth2Client(val)   { this._oauth2Client = val    }
    set drive(val)          { this._drive = val           }
    get driveClient()       { return this._driveClient    }
    get oauth2Client()      { return this._oauth2Client   }
    get drive()             { return this._drive          }

    // instances
    set dropboxClient(val)  { this._dropboxClient = val   }
    set dropbox(val)        { this._dropbox = val         }
    get dropboxClient()     { return this._dropboxClient  }
    get dropbox()           { return this._dropbox        }

    constructor({ client }) {
        if (!client) { throw new Error('[Connect#constructor] requires a client name.') }
        this.socketIds = []
        this.sockets = []
        this.client = client
        this.port = 8080
        this.authorize = this.authFactory(client)
        initializers[client].call(this)
    }

    authFactory(client) {
        return (callback) => {
            authServers[client].call(this, callback)
        }
    }

    //
    // clients
    //
    createGoogleClient() {
        const { client_id, client_secret, redirect_uri } = this.driveClient
        const OAuth2Client = google.auth.OAuth2

        this.drive = google.drive('v3')
        this.oauth2Client = new OAuth2Client(client_id, client_secret, redirect_uri)
    }

    createDropboxClient() {
        const { clientId, accessToken } = this.dropboxClient
        this.dropbox = new Dropbox({ clientId, accessToken })
    }


    //
    // server
    //
    startServer() {
        this.server.listen(this.port, () => {
            console.log(`Server is running at http://localhost:${this.port}/`)
            opn(`http://localhost:${this.port}/`)
        })
    }
    subscribeServer() {
        this.server.on('connection', (socket) => {
            this.addSocket(socket)
            socket.on('close', () => {
                this.removeSocket(socket)
            })
        })
    }
    addSocket(socket) {
        const id = crypto.randomBytes(20).toString('hex')
        this.socketIds.push(id)
        this.sockets.push({ id, socket })
    }
    removeSocket({ id }) {
        remove(this.sockets, _ => _.id === id)
        remove(this.socketIds, _ => _ === id)
    }

    exit(callback) {
        this.sockets.forEach(({ socket }) => socket.destroy())
        return this.server.close(callback)
    }

    //
    // auth
    //
    exec(request) {
        const prop = this.client === 'google'
            ? 'refresh_token'
            : this.client === 'dropbox'
            ? 'accessToken'
            : ''

        if (!prop) { throw new Error(`Invalid client: ${this.client}`) }
        if (!this.credentials[prop]) {
            this.authorize(request)
        } else {
            request()
        }
    }

    ensureCredentials() {
        const credPath = path.join(__dirname, this.client, '.credentials.json')
        this.credentials = { accessToken: '', access_token: '', refresh_token: '' }
        if (fs.existsSync(credPath)) {
            const credentials = JSON.parse(fs.readFileSync(credPath))
            this.credentials = { ...this.credentials, ...credentials }
        } else {
            fs.writeFileSync(credPath, JSON.stringify(this.credentials), 'utf8')
        }
    }

    ensureAuth(clientKey, clientName) {
        const authPath = path.join(process.cwd(), '.auth.json')
        if (fs.existsSync(authPath)) {
            const JSONData = fs.readFileSync(authPath, 'utf8')
            const clientData = JSON.parse(JSONData || {})[clientKey]
            this[clientName] = { ...this[clientName], ...clientData }
        } else {
            throw new Error(`[${authPath}] not found, aborting.`)
        }
    }
}

export default Connect
