// All user defined functions should be wrapped in a 'domReady' call - or by using a third-party lib like jQuery - for compatibility in reader, web, and e-reader versions.
// Use the global `window.bber.env` variable to limit scripts to particular envionments. See example below
//
// Examples:
//  domReady(fn)
//  domReady(function() {})
//  domReady(fn, context)
//  domReady(function(context) {}, ctx)
//
// https://stackoverflow.com/questions/9899372/pure-javascript-equivalent-of-jquerys-ready-how-to-call-a-function-when-t
;(function(funcName, baseObj) {
    // The public function name defaults to window.domReady
    // but you can pass in your own object and own function name and those will be used
    // if you want to put them in a different namespace
    funcName = funcName || 'domReady';
    baseObj = baseObj || window;
    var readyList = [];
    var readyFired = false;
    var readyEventHandlersInstalled = false;

    // call this when the document is ready
    // this function protects itself against being called more than once
    function ready() {
        if (!readyFired) {
            // this must be set to true before we start calling callbacks
            readyFired = true;
            for (var i = 0; i < readyList.length; i++) {
                // if a callback here happens to add new ready handlers,
                // the domReady() function will see that it already fired
                // and will schedule the callback to run right after
                // this event loop finishes so all handlers will still execute
                // in order and no new ones will be added to the readyList
                // while we are processing the list
                readyList[i].fn.call(window, readyList[i].ctx);
            }
            // allow any closures held by these functions to free
            readyList = [];
        }
    }

    function readyStateChange() {
        if ( document.readyState === 'complete' ) {
            ready();
        }
    }

    // This is the one public interface
    // domReady(fn, context);
    // the context argument is optional - if present, it will be passed
    // as an argument to the callback
    baseObj[funcName] = function(callback, context) {
        if (typeof callback !== 'function') {
            throw new TypeError('callback for domReady(fn) must be a function');
        }
        // if ready has already fired, then just schedule the callback
        // to fire asynchronously, but right away
        if (readyFired) {
            setTimeout(function() {callback(context);}, 1);
            return;
        } else {
            // add the function and context to the list
            readyList.push({fn: callback, ctx: context});
        }
        // if document already ready to go, schedule the ready function to run
        if (document.readyState === 'complete') {
            setTimeout(ready, 1);
        } else if (!readyEventHandlersInstalled) {
            // otherwise if we don't have event handlers installed, install them
            if (document.addEventListener) {
                // first choice is DOMContentLoaded event
                document.addEventListener('DOMContentLoaded', ready, false);
                // backup is window load event
                window.addEventListener('load', ready, false);
            } else {
                // must be IE
                document.attachEvent('onreadystatechange', readyStateChange);
                window.attachEvent('onload', ready);
            }
            readyEventHandlersInstalled = true;
        }
    }
})('domReady', window);

function clicked(e) {
    window.location.href = this.getAttribute('href');
    return false;
}

function main() {
    if (window.bber.env === 'reader') return;
    // Normalize link behaviour on iBooks, without interfering with footnotes
    var links = document.getElementsByTagName('a');
    links = Array.prototype.slice.call(links, 0);
    links = links.filter(function(l) {
        return l.classList.contains('footnote-ref') === false;
    });

    for (var i = 0; i < links.length; i++) {
        links[i].onclick = clicked;
    }
}

domReady(main);
