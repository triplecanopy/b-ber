export default {
    google() {
        this.driveClient = {
            redirect_uri: 'http://localhost:8080/oauth2callback',
            scope: 'https://www.googleapis.com/auth/drive.readonly',
        }

        this.ensureAuth('google-drive', 'driveClient')
        this.ensureCredentials()
        this.createGoogleClient() // instantiate first, since we can call `setCredentials` below

        this.oauth2Client.setCredentials(this.credentials)
    },
    dropbox() {
        const dropboxSettings = { redirect_uri: 'http://localhost:8080/oauth2callback' } // setup application specific variables
        this.ensureAuth('dropbox', 'dropboxClient') // load auth tokens from file
        this.ensureCredentials() // load credentials into client object
        this.dropboxClient = { ...dropboxSettings, ...this.dropboxClient, ...this.credentials } // set client credentials
        this.createDropboxClient() // instantiate service
    },
}
