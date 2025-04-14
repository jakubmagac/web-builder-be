function fetchStatus(url, onSuccess, onError) {
    const client = new XMLHttpRequest();
    client.onreadystatechange = function () {
        // in case of network errors this might not give reliable results
        if (this.readyState == 4) {
            if (this.status == 200) {
                onSuccess();
            } else {
                onError();
            }
        }
    };
    client.open("HEAD", url);
    client.send();
}

class LanguagePickerHandler {
    constructor() {
        this.defaultLanguage = null;
        this.languages = [];
        this.rootPath = null;
    }

    handle = () => {
        try {
            this._parseLanguages();
            this._resolveRootPath();
        } catch {
            console.log("No language picker was found.");
        }
    };

    _resolveRootPath() {
        // get relative root path from our custom head meta tag
        const metaRoot = document.querySelector("meta[name=\"it4kt-course-root\"]").content;
        // resolve the relative path against the current url and get its pathname part
        let rootPath = new URL(metaRoot, window.location.href).pathname;

        if (this.languages.some(l => rootPath.endsWith(l + "/"))) {
            rootPath = rootPath.slice(0, -1);
            const lastSlashIndex = rootPath.lastIndexOf("/");
            rootPath = rootPath.substring(0, lastSlashIndex + 1);
        }

        this.rootPath = rootPath;
    }

    _getLanguageUrlShortCode = (language) => {
        if (!language || language === this.defaultLanguage) {
            return "";
        }
        return language;
    };

    _parseLanguages = () => {
        const dafaultEl = document.querySelector("[data-lang-default]");
        this.defaultLanguage = dafaultEl.dataset.langDefault;

        // query all options in language select box
        const selectorItems = document.querySelectorAll("[data-lang]");
        for (let item of selectorItems) {
            // get option language
            const itemLang = item.dataset.lang;
            // add language to language list
            this.languages.push(itemLang);
            // set href event for link
            item.onclick = (event) => {
                this._redirectSubUrl(itemLang, item.getAttribute("href"));
                // prevent default href push action
                event.preventDefault();
            };
        }
    };

    _redirectSubUrl = (language, location) => {
        const onSuccess = () => {
            window.location.assign(location);
        };

        const onError = () => {
            const languagedIndexUrl = this.rootPath + this._getLanguageUrlShortCode(language);
            // with no argument returns global index page
            const globalIndexUrl = this.rootPath + this._getLanguageUrlShortCode();

            const onLanguagedIndexError = () => {
                // redirect to course's global index url
                window.location.assign(globalIndexUrl);
            };

            const onLangaugedIndexSuccess = () => {
                // redirect to languaged index url
                window.location.assign(languagedIndexUrl);
            };

            fetchStatus(
                languagedIndexUrl,
                onLangaugedIndexSuccess,
                onLanguagedIndexError
            );
        };
        fetchStatus(location, onSuccess, onError);
    };
}
