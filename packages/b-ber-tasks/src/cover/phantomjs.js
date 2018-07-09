/* globals document, phantom */
/* eslint-disable import/no-unresolved */
const system = require('system')
const page = require('webpage').create()

const args = system.args
const outFile = args[2]

page.content = args[1]
page.viewportSize = {width: 1600, height: 2400}

page.settings.resourceTimeout = 1
page.settings.javascriptEnabled = false
page.settings.loadImages = false
page.settings.webSecurityEnabled = false

page.evaluate(() => {
    const body = document.body
    const spans = document.getElementsByTagName('span')

    body.style.backgroundColor = '#5050C5'
    body.style.margin = '100px'
    body.style.fontFamily = 'Helvetica'
    body.style.fontSize = '45px'
    body.style.color = '#FFFFFF'

    for (let i = 0; i < spans.length; i++) {
        spans[i].style.display = 'block'
        spans[i].style.paddingBottom = '5px'
    }
})

page.render(outFile)
phantom.exit(0)
