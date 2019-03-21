/* eslint-disable */

//
// This file is written as-is before the closing `body` elements on the pages
// generated by `bber build --web`.
//

function navigate(dir) {
    var link = document.querySelector('.publication__nav__' + dir + ' a.publication__nav__link')
    if (!link) return

    var href = link.getAttribute('href')
    if (href) {
        window.location.href = href
    }
}

function navigateNext() {
    navigate('next')
}

function navigatePrev() {
    navigate('prev')
}

var editableElementTagNames = ['INPUT', 'TEXTAREA']
function isEditing(e) {
    return (
        e.altKey ||
        e.ctrlKey ||
        e.shiftKey ||
        (document.activeElement && editableElementTagNames.indexOf(document.activeElement.tagName) > -1)
    )
}

function registerNavEvents() {
    // sliding panels
    var tocButton = document.querySelector('.header__item__toggle--toc button')
    var infoButton = document.querySelector('.header__item__toggle--info button')
    var publicationContent = document.querySelector('.publication__contents')

    // slide handlers
    tocButton.addEventListener(
        'click',
        function() {
            document.body.classList.remove('info--visible')
            document.body.classList.toggle('toc--visible')
        },
        false,
    )

    infoButton.addEventListener(
        'click',
        function() {
            document.body.classList.remove('toc--visible')
            document.body.classList.toggle('info--visible')
        },
        false,
    )

    publicationContent.addEventListener(
        'click',
        function() {
            document.body.classList.remove('toc--visible')
            document.body.classList.remove('info--visible')
            searchInput.classList.remove('publication__search__input--expanded')
        },
        false,
    )

    // keyboard navigation
    document.addEventListener(
        'keydown',
        function(e) {
            if (isEditing(e)) return
            if (e && e.which) {
                if (e.which === 39 /* arrow right */) {
                    navigateNext()
                }
                if (e.which === 37 /* arrow left */) {
                    navigatePrev()
                }
            }
        },
        false,
    )
}

function showContent(lastHeight) {
    var lastHeight = lastHeight || 0
    setTimeout(function() {
        var body = document.body
        var height = document.body.offsetHeight
        if (lastHeight !== height) return showContent(height)

        setTimeout(function() {
            body.classList.add('ready')
        }, 0)
    }, 60)
}

window.addEventListener('load', registerNavEvents, false)
window.addEventListener('load', showContent, false)
