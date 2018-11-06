var fontBase
var lineBase
var timer

function newLine(posTop) {
    var elem = document.createElement('div');
    elem.className = 'line';
    elem.style.top = posTop + 'px';
    return elem;
}

function drawLines() {
    if (document.getElementsByClassName('line').length) return;
    var body = document.body,
        html = document.documentElement;

    var height = Math.max(body.scrollHeight, body.offsetHeight,
                          html.clientHeight, html.scrollHeight, html.offsetHeight);


    var lines = height / lineBase;
    for (var i = 1; i < lines; i++) {
        document.body.appendChild(newLine(lineBase * i));
    }
}

function onLoad() {
    var debug = window.getComputedStyle(document.getElementById('debug-grid'));
    if (debug.fontFamily) {
        fontBase = parseInt(debug.fontSize, 10);
        lineBase = parseInt(debug.lineHeight, 10);
        drawLines();
    }
}

function removeLines(callback) {
    var lines = document.getElementsByClassName('line');
    while (lines[0]) {
        document.body.removeChild(lines[0]);
    }

    callback();
}

function onResize() {
    window.clearTimeout(timer);
    timer = setTimeout(function() {
        removeLines(drawLines)
    }, 200);
}

window.addEventListener('load', onLoad, false);
window.addEventListener('resize', onResize, false);
