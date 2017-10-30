/* eslint-disable */

//
// This file is written as-is to `project-web` on `bber build --web`.
// It initializes the WebWorker and manages search results.
//


function initializeWebWorker() {
    var worker = new Worker('/worker.js');
    var timer;
    var debounceSpeed = 30;
    var searchInput = document.querySelector('.publication__search__input');
    var searchButton = document.querySelector('.publication__search__button');
    var publicationContents = document.querySelector('.publication__contents');
    var clonedContents = publicationContents.cloneNode(true);

    if (!searchInput || !searchButton || !publicationContents) { return; }

    // disable button by default since we hook into the 'onchange' event
    searchButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
    });

    function parseSearchResults(results) {
        return results.reduce(function(acc, curr) {
            var text = '';
            text += '<div class="search__result">';
            text += '<a class="search__result__link" href="' + curr.url + '">';
            if (curr.title) {
                text += '<h1 class="search__result__title">' + curr.title + '</h1>';
            }
            if (curr.body) {
                text += '<div class="search__result__body">' + curr.body + '</div>';
            }
            text += '</a>';
            text += '</div>';
            return acc.concat(text);
        }, '<div class="search__results">') + '</div>';
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

    // TODO: better just to show/hide the contents rather than resetting each time
    function resetContents() {
        publicationContents.innerHTML = clonedContents.innerHTML;
    }

    function debounceSearch() {
        clearTimeout(timer)
        setTimeout(function() {
            var query = searchInput.value.trim();
            if (!query) {
                resetContents();
                return;
            }
            worker.postMessage({ query: query });
        }, debounceSpeed)

    }

    searchInput.addEventListener('keyup', debounceSearch);
};

if (window.Worker) {
    initializeWebWorker();
}
