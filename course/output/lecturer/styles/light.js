'use strict';

function initMenuToggle() {
    const page = document.getElementById('page');
    const menuToggle = document.getElementById('menu-toggle');
    menuToggle.addEventListener('click', (ev) => {
        page.classList.toggle('page--menu-displayed');
        ev.preventDefault();
    });
}

document.addEventListener('DOMContentLoaded', function () {
    initMenuToggle();
    new LanguagePickerHandler().handle();
    new ObjectivesConnector().connect();
});

window.addEventListener('load', function () {
    const allImages = Array.from(document.querySelectorAll('figure img'));
    const largeImages = allImages.filter(img => img.naturalWidth > img.width);
    mediumZoom(largeImages);
});
