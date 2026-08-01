class Util {
    static forEach(elements, handler) {
        elements = elements || [];
        for (let i = 0; i < elements.length; i++) handler(elements[i]);
    }

    static getScrollTop() {
        return (document.documentElement && document.documentElement.scrollTop) || document.body.scrollTop;
    }

    static isMobile() {
        return window.matchMedia('only screen and (max-width: 680px)').matches;
    }

    static isTocStatic() {
        return window.matchMedia('only screen and (max-width: 1180px)').matches;
    }

    static animateCSS(element, animation, reserved, callback) {
        if (!Array.isArray(animation)) animation = [animation];
        element.classList.add('animate__animated', ...animation);
        const handler = () => {
            element.classList.remove('animate__animated', ...animation);
            element.removeEventListener('animationend', handler);
            if (typeof callback === 'function') callback();
        };
        if (!reserved) element.addEventListener('animationend', handler, false);
    }
}

class Theme {
    constructor() {
        this.config = window.config || {};
        this.data = this.config.data || {};
        this.isDark = document.body.getAttribute('theme') === 'dark';
        this.newScrollTop = Util.getScrollTop();
        this.oldScrollTop = this.newScrollTop;
        this.scrollEventSet = new Set();
        this.resizeEventSet = new Set();
        this.clickMaskEventSet = new Set();
    }

    initRaw() {
        Util.forEach(document.querySelectorAll('[data-raw]'), $raw => {
            $raw.innerHTML = this.data[$raw.id];
        });
    }

    initSVGIcon() {
        Util.forEach(document.querySelectorAll('[data-svg-src]'), $icon => {
            fetch($icon.getAttribute('data-svg-src'))
                .then(response => response.text())
                .then(svg => {
                    const $temp = document.createElement('div');
                    $temp.insertAdjacentHTML('afterbegin', svg);
                    const $svg = $temp.firstChild;
                    $svg.setAttribute('data-svg-src', $icon.getAttribute('data-svg-src'));
                    $svg.classList.add('icon');
                    const $titleElements = $svg.getElementsByTagName('title');
                    if ($titleElements.length) $svg.removeChild($titleElements[0]);
                    $icon.parentElement.replaceChild($svg, $icon);
                })
                .catch(err => { console.error(err); });
        });
    }

    initMenuMobile() {
        const $menuToggleMobile = document.getElementById('menu-toggle-mobile');
        const $menuMobile = document.getElementById('menu-mobile');
        if (!$menuToggleMobile || !$menuMobile) return;
        $menuToggleMobile.addEventListener('click', () => {
            document.body.classList.toggle('blur');
            $menuToggleMobile.classList.toggle('active');
            $menuMobile.classList.toggle('active');
        }, false);
        this._menuMobileOnClickMask = this._menuMobileOnClickMask || (() => {
            $menuToggleMobile.classList.remove('active');
            $menuMobile.classList.remove('active');
        });
        this.clickMaskEventSet.add(this._menuMobileOnClickMask);
    }

    initDetails() {
        Util.forEach(document.getElementsByClassName('details'), $details => {
            const $summary = $details.getElementsByClassName('details-summary')[0];
            if ($summary) {
                $summary.addEventListener('click', () => {
                    $details.classList.toggle('open');
                }, false);
            }
        });
    }

    initHighlight() {
        Util.forEach(document.querySelectorAll('.code-block'), $codeBlock => {
            const $codeTitle = $codeBlock.querySelector('.code-header > .code-title');
            if ($codeTitle) {
                $codeTitle.addEventListener('click', () => {
                    $codeBlock.classList.toggle('open');
                }, false);
            }
            const $ellipses = $codeBlock.querySelector('.code-header .ellipses');
            if ($ellipses) {
                $ellipses.addEventListener('click', () => {
                    $codeBlock.classList.toggle('open');
                }, false);
            }
        });
    }

    initHeaderLink() {
        for (let num = 1; num <= 6; num++) {
            Util.forEach(document.querySelectorAll('.single .content > h' + num), $header => {
                $header.classList.add('headerLink');
                $header.insertAdjacentHTML('afterbegin', `<a href="#${$header.id}" class="header-mark"></a>`);
            });
        }
    }

    onScroll() {
        const $headers = [];
        if (document.body.getAttribute('data-header-desktop') === 'auto') $headers.push(document.getElementById('header-desktop'));
        if (document.body.getAttribute('data-header-mobile') === 'auto') $headers.push(document.getElementById('header-mobile'));
        const $fixedButtons = document.getElementById('fixed-buttons');
        const ACCURACY = 20, MINIMUM = 100;
        window.addEventListener('scroll', () => {
            this.newScrollTop = Util.getScrollTop();
            const scroll = this.newScrollTop - this.oldScrollTop;
            const isMobile = Util.isMobile();
            Util.forEach($headers, $header => {
                if (scroll > ACCURACY) {
                    $header.classList.remove('animate__fadeInDown');
                    Util.animateCSS($header, ['animate__fadeOutUp', 'animate__faster'], true);
                } else if (scroll < - ACCURACY) {
                    $header.classList.remove('animate__fadeOutUp');
                    Util.animateCSS($header, ['animate__fadeInDown', 'animate__faster'], true);
                }
            });
            if (this.newScrollTop > MINIMUM) {
                if (isMobile && scroll > ACCURACY) {
                    $fixedButtons.classList.remove('animate__fadeIn');
                    Util.animateCSS($fixedButtons, ['animate__fadeOut', 'animate__faster'], true);
                } else if (!isMobile || scroll < - ACCURACY) {
                    $fixedButtons.style.display = 'block';
                    $fixedButtons.classList.remove('animate__fadeOut');
                    Util.animateCSS($fixedButtons, ['animate__FadeIn', 'animate__faster'], true);
                }
            } else {
                if (!isMobile) {
                    $fixedButtons.classList.remove('animate__fadeIn');
                    Util.animateCSS($fixedButtons, ['animate__fadeOut', 'animate__faster'], true);
                }
                $fixedButtons.style.display = 'none';
            }
            for (let event of this.scrollEventSet) event();
            this.oldScrollTop = this.newScrollTop;
        }, false);
    }

    onResize() {
        window.addEventListener('resize', () => {
            if (!this._resizeTimeout) {
                this._resizeTimeout = window.setTimeout(() => {
                    this._resizeTimeout = null;
                    for (let event of this.resizeEventSet) event();
                }, 100);
            }
        }, false);
    }

    onClickMask() {
        const $mask = document.getElementById('mask');
        if ($mask) {
            $mask.addEventListener('click', () => {
                for (let event of this.clickMaskEventSet) event();
                document.body.classList.remove('blur');
            }, false);
        }
    }

    initScrollReveal() {
        if (!window.IntersectionObserver) return;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, i) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.08,
            rootMargin: '0px 0px -40px 0px'
        });
        document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    }

    initProgressBar() {
        const bar = document.getElementById('reading-progress');
        if (!bar) return;
        const onScroll = () => {
            const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            if (scrollHeight > 0) {
                bar.style.width = `${(scrollTop / scrollHeight) * 100}%`;
            }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    initSearch() {
        const searchConfig = this.config.search;
        if (!searchConfig || searchConfig.type !== 'fuse') return;
        const $searchInput = document.getElementById('search-input');
        const $searchLoading = document.getElementById('search-loading');
        const $searchClear = document.getElementById('search-clear');
        const $searchDropdown = document.getElementById('search-dropdown');
        if (!$searchInput || !$searchLoading || !$searchClear || !$searchDropdown) return;

        const maxResultLength = searchConfig.maxResultLength || 10;
        const snippetLength = searchConfig.snippetLength || 50;
        const highlightTag = searchConfig.highlightTag || 'em';

        const escapeHtml = (value) => String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');

        let activeIndex = -1;
        let currentItems = [];

        const searchDropdown = {
            render(results) {
                activeIndex = results.length ? 0 : -1;
                currentItems = results;
                let html = '<div class="dropdown-menu"><div class="suggestions">';
                if (!results.length) {
                    html += `<div class="search-empty">${searchConfig.noResultsFound}: <span class="search-query">"${escapeHtml($searchInput.value)}"</span></div>`;
                } else {
                    results.forEach((item, index) => {
                        html += `<a class="suggestion${index === 0 ? ' cursor' : ''}" href="${escapeHtml(item.uri)}">`
                            + `<div><span class="suggestion-title">${item.title}</span><span class="suggestion-date">${item.date}</span></div>`
                            + `<div class="suggestion-context">${item.context}</div></a>`;
                    });
                }
                html += '</div><div class="search-footer">Search by Fuse.js</div></div>';
                $searchDropdown.innerHTML = html;
                $searchDropdown.style.display = 'block';
            },
            close() {
                $searchDropdown.innerHTML = '';
                $searchDropdown.style.display = 'none';
                activeIndex = -1;
                currentItems = [];
            },
            move(direction) {
                if (!currentItems.length) return;
                activeIndex = Math.min(Math.max(activeIndex + direction, 0), currentItems.length - 1);
                const $suggestions = $searchDropdown.querySelectorAll('.suggestion');
                $suggestions.forEach(($el, index) => {
                    $el.classList.toggle('cursor', index === activeIndex);
                });
                $suggestions[activeIndex].scrollIntoView({ block: 'nearest' });
            },
            select() {
                const item = currentItems[activeIndex];
                if (item) window.location.assign(item.uri);
            },
        };
        this._search = searchDropdown;

        $searchInput.addEventListener('input', () => {
            const query = $searchInput.value.trim();
            $searchClear.style.display = query === '' ? 'none' : 'inline';
            if (query === '') {
                searchDropdown.close();
                return;
            }
            $searchLoading.style.display = 'inline';
            $searchClear.style.display = 'none';
            const finish = (results) => {
                $searchLoading.style.display = 'none';
                $searchClear.style.display = 'inline';
                searchDropdown.render(results);
            };
            const search = () => {
                const results = {};
                this._fuse.search(query).forEach(({ item, matches }) => {
                    let { uri, title, content: context, date } = item;
                    if (results[uri]) return;
                    let position = 0;
                    if (matches) {
                        for (const match of matches) {
                            if (match.key === 'content' && match.indices.length > 0) {
                                position = match.indices[0][0];
                                break;
                            }
                        }
                    }
                    position -= snippetLength / 5;
                    if (position > 0) {
                        position += context.slice(position, position + 20).lastIndexOf(' ') + 1;
                        context = '...' + context.slice(position, position + snippetLength);
                    } else {
                        context = context.slice(0, snippetLength);
                    }
                    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    title = title.replace(new RegExp(`(${escapedQuery})`, 'gi'), `<${highlightTag}>$1</${highlightTag}>`);
                    context = context.replace(new RegExp(`(${escapedQuery})`, 'gi'), `<${highlightTag}>$1</${highlightTag}>`);
                    results[uri] = { uri, title, date, context };
                });
                return Object.values(results).slice(0, maxResultLength);
            };
            if (!this._fuse) {
                fetch(searchConfig.fuseIndexURL)
                    .then(response => response.json())
                    .then(data => {
                        const fuseOpts = Object.assign({
                            isCaseSensitive: false,
                            findAllMatches: false,
                            minMatchCharLength: 2,
                            location: 0,
                            threshold: 0.3,
                            distance: 100,
                            ignoreLocation: false,
                            includeMatches: true,
                            keys: [
                                { name: 'title', weight: 5 },
                                { name: 'tags', weight: 2 },
                                { name: 'categories', weight: 2 },
                                { name: 'content', weight: 1 },
                            ],
                        }, searchConfig.fuseOpts || {}, { includeMatches: true });
                        this._fuse = new Fuse(data, fuseOpts);
                        finish(search());
                    }).catch(err => {
                        console.error(err);
                        finish([]);
                    });
            } else finish(search());
        }, false);
        $searchClear.addEventListener('click', () => {
            $searchInput.value = '';
            $searchClear.style.display = 'none';
            this._search.close();
            $searchInput.focus();
        }, false);
        $searchDropdown.addEventListener('click', (event) => {
            const $anchor = event.target.closest('a.suggestion');
            if ($anchor) window.location.assign($anchor.getAttribute('href'));
        }, false);
        const searchQuery = new URLSearchParams(window.location.search).get('q');
        if (searchQuery && searchQuery.trim() && $searchInput.value === '') {
            $searchInput.value = searchQuery.trim();
            $searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        document.getElementById('mask').addEventListener('click', () => {
            this._search.close();
        }, false);
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this._search.close();
                return;
            }
            if (!currentItems.length) return;
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                this._search.move(1);
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                this._search.move(-1);
            } else if (event.key === 'Enter') {
                event.preventDefault();
                this._search.select();
            }
        }, false);
    }

    init() {
        try {
            this.initRaw();
            this.initSVGIcon();
            this.initMenuMobile();
            this.initDetails();
            this.initHighlight();
            this.initHeaderLink();
        } catch (err) {
            console.error(err);
        }

        window.setTimeout(() => {
            this.onScroll();
            this.onResize();
            this.onClickMask();
            this.initScrollReveal();
            this.initProgressBar();
            this.initSearch();
        }, 100);
    }
}

const themeInit = () => {
    const theme = new Theme();
    theme.init();
};

if (document.readyState !== 'loading') {
    themeInit();
} else {
    document.addEventListener('DOMContentLoaded', themeInit, false);
}
