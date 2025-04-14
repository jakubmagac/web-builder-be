document.addEventListener("DOMContentLoaded", function () {
    const connector = new CollapsibleConnector();
    connector.connect();
});

class CollapsibleConnector {
    connect() {
        this.createCollapsibles();
    }

    createCollapsibles() {
        const solutions = document.getElementsByClassName("solution--hideable");

        for (const solution of solutions) {
            solution.addEventListener("click", function () {
                solution.classList.toggle("visible");
                const content = solution.getElementsByClassName(
                    "solution__content"
                )[0];
                if (content.style.maxHeight) {
                    content.style.maxHeight = null;
                } else {
                    content.style.maxHeight = content.scrollHeight + "px";
                }
                content.addEventListener("click", function (e) {
                    e.stopPropagation();
                });
            });
        }
    }
}
