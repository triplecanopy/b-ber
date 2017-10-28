function clicked(e) {
    window.location.href = this.getAttribute('href');
    return false;
}

function main() {
    // Normalize link behaviour on iBooks, without interfering with footnotes
    var links = document.getElementsByTagName('a')
    links = Array.prototype.slice.call(links, 0);
    links = links.filter(function(l) {
        return l.classList.contains('footnote-ref') === false;
    });

    for (var i = 0; i < links.length; i++) {
        links[i].onclick = clicked;
    }
}

window.addEventListener('load', main, false);