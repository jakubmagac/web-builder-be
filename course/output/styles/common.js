document.addEventListener('DOMContentLoaded', function () {
    initSyntaxHighlighting()
    initSolutionHiding()
})

function initSyntaxHighlighting() {
    var elements = document.querySelectorAll('pre code')
    Array.prototype.forEach.call(elements, function (el) {
        // Remove leading and trailing newlines
        el.innerHTML = el.innerHTML.replace(/^\n+|\n+$/, "")
        // Highlight only blocks with language set
        if (el.className.indexOf('language-') !== -1) {
            hljs.highlightElement(el)
        }
    })
}

function initSolutionHiding() {
    var elements = document.querySelectorAll(
        ".js-show-solution-button, .js-hide-solution-button")
    Array.prototype.forEach.call(elements, function(el) {
        el.addEventListener('click', toggleSolution)
    })
}

function toggleSolution() {
    var elements = this.parentNode.querySelectorAll(
        ".result, .js-show-solution-button, .js-hide-solution-button")
    Array.prototype.forEach.call(elements, function(el) {
        if (el.style.display === 'none') {
            el.style.display = 'block'
        } else {
            el.style.display = 'none'
        }
    })
}
