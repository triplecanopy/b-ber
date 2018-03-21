import Connect from '../connect'

const connect = new Connect({ client: 'dropbox' })

connect.exec(done => {
    const { dropbox } = connect
    dropbox.filesListFolder({ path: '' })
        .then(resp => {
            console.log(resp.entries)
            done()
        })
        .catch(err => {
            console.log(err)
            done()
        })
})
