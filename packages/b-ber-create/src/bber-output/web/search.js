/* eslint-disable */

//
// This file is written as-is to `project-web` on `bber build --web`.
// It initializes the WebWorker and manages search results.
//

var searchInput = null;
var searchButton = null;
var publicationContents = null;
var clonedContents = null;

function closeSearchBar() {
    if (!searchInput || !searchButtonClose) { return; }
    searchInput.classList.remove('publication__search__input--expanded');
    searchButtonClose.classList.remove('publication__search__button--close--visible');
    searchInput.value = '';
}
function openSearchBar() {
    if (!searchInput || !searchButtonClose) { return; }
    searchInput.classList.add('publication__search__input--expanded');
    searchButtonClose.classList.add('publication__search__button--close--visible');
    searchInput.focus();
}
function toggleSearchBar() {
    if (!searchInput || !searchButtonClose) { return; }
    if (searchInput.classList.contains('publication__search__input--expanded')) {
        closeSearchBar();
    } else {
        openSearchBar();
    }
}

function bindEventHandlers() {
    searchInput = document.querySelector('.publication__search__input');
    searchButtonOpen = document.querySelector('.publication__search__button--open');
    searchButtonClose = document.querySelector('.publication__search__button--close');
    publicationContents = document.querySelector('.publication__contents');
    clonedContents = publicationContents.cloneNode(true);

    if (window.Worker) {
        initializeWebWorker();
    }

    // grow/shrink input on click
    searchButtonOpen.addEventListener('click', openSearchBar, false);
    searchButtonClose.addEventListener('click', closeSearchBar, false);
    publicationContents.addEventListener('click', closeSearchBar, false);

     // keyboard events
     document.addEventListener('keyup', function(e) {
        if (e && e.which) {
            if (e.which === 27/* ESC */) {
                closeSearchBar();
            }
        }
    }, false);
}

function initializeWebWorker() {
    var worker = new Worker('%BASE_URL%' + 'worker.js'); // BASE_URL added dynamically on build
    var timer;
    var debounceSpeed = 30;

    if (!searchInput || !publicationContents) { return; }

    function parseSearchResults(results) {
        return results.reduce(function(acc, curr) {
            return acc.concat(' \
                <div class="search__result"> \
                    <a class="search__result__link" href="' + curr.url + '"> \
                        ' + (curr.title ? '<h1 class="search__result__title">' + curr.title + '</h1>' : '') + ' \
                        ' + (curr.body ? '<div class="search__result__body">' + curr.body + '</div>' : '') + ' \
                    </a> \
                </div> \
            ')
        }, '<section class="search__results">') + '</section>';
    }

    // TODO: better just to show/hide the contents rather than resetting each time
    function resetContents() {
        publicationContents.innerHTML = clonedContents.innerHTML;
    }

    function debounceSearch() {
        clearTimeout(timer);
        setTimeout(function() {
            var term = searchInput.value.trim();
            if (!term) {
                resetContents();
                return;
            }

            // TODO: escape search tokens below, find some settings that work well here
            worker.postMessage({ term: term });
        }, debounceSpeed);
    }

    worker.addEventListener('message', function(e) {
        if (!e.data) { return; }
        if (e.data.readyState && e.data.readyState > 3) {
            searchInput.removeAttribute('disabled');
        }
        if (e.data.results) {
            publicationContents.innerHTML = parseSearchResults(e.data.results);
        }
    });

    searchInput.addEventListener('keyup', debounceSearch);
};

// bootstrap
window.addEventListener('load', bindEventHandlers, false);
