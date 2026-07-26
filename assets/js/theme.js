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
        return window.matchMedia('only screen and (max-width: 960px)').matches;
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

    initToc() {
        const $tocCore = document.getElementById('TableOfContents');
        if ($tocCore === null) return;
        if (document.getElementById('toc-static').getAttribute('data-kept') || Util.isTocStatic()) {
            const $tocContentStatic = document.getElementById('toc-content-static');
            if ($tocCore.parentElement !== $tocContentStatic) {
                $tocCore.parentElement.removeChild($tocCore);
                $tocContentStatic.appendChild($tocCore);
            }
            if (this._tocOnScroll) this.scrollEventSet.delete(this._tocOnScroll);
        } else {
            const $tocContentAuto = document.getElementById('toc-content-auto');
            if ($tocCore.parentElement !== $tocContentAuto) {
                $tocCore.parentElement.removeChild($tocCore);
                $tocContentAuto.appendChild($tocCore);
            }
            const $toc = document.getElementById('toc-auto');
            const $page = document.getElementsByClassName('page')[0];
            if (!$toc || !$page) return;
            const rect = $page.getBoundingClientRect();
            $toc.style.left = `${rect.left + rect.width + 20}px`;
            $toc.style.maxWidth = `${$page.getBoundingClientRect().left - 20}px`;
            $toc.style.visibility = 'visible';
            const $tocLinkElements = $tocCore.querySelectorAll('a:first-child');
            const $tocLiElements = $tocCore.getElementsByTagName('li');
            const $headerLinkElements = document.getElementsByClassName('headerLink');
            const headerIsFixed = document.body.getAttribute('data-header-desktop') !== 'normal';
            const headerHeight = document.getElementById('header-desktop').offsetHeight;
            const TOP_SPACING = 20 + (headerIsFixed ? headerHeight : 0);
            const minTocTop = $toc.offsetTop;
            const minScrollTop = minTocTop - TOP_SPACING + (headerIsFixed ? 0 : headerHeight);
            this._tocOnScroll = this._tocOnScroll || (() => {
                const footerTop = document.getElementById('post-footer').offsetTop;
                const maxTocTop = footerTop - $toc.getBoundingClientRect().height;
                const maxScrollTop = maxTocTop - TOP_SPACING + (headerIsFixed ? 0 : headerHeight);
                if (this.newScrollTop < minScrollTop) {
                    $toc.style.position = 'absolute';
                    $toc.style.top = `${minTocTop}px`;
                } else if (this.newScrollTop > maxScrollTop) {
                    $toc.style.position = 'absolute';
                    $toc.style.top = `${maxTocTop}px`;
                } else {
                    $toc.style.position = 'fixed';
                    $toc.style.top = `${TOP_SPACING}px`;
                }
                Util.forEach($tocLinkElements, $tocLink => { $tocLink.classList.remove('active'); });
                Util.forEach($tocLiElements, $tocLi => { $tocLi.classList.remove('has-active'); });
                const INDEX_SPACING = 20 + (headerIsFixed ? headerHeight : 0);
                let activeTocIndex = $headerLinkElements.length - 1;
                for (let i = 0; i < $headerLinkElements.length - 1; i++) {
                    const thisTop = $headerLinkElements[i].getBoundingClientRect().top;
                    const nextTop = $headerLinkElements[i + 1].getBoundingClientRect().top;
                    if ((i === 0 && thisTop > INDEX_SPACING) || (thisTop <= INDEX_SPACING && nextTop > INDEX_SPACING)) {
                        activeTocIndex = i;
                        break;
                    }
                }
                if (activeTocIndex !== -1) {
                    $tocLinkElements[activeTocIndex].classList.add('active');
                    let $parent = $tocLinkElements[activeTocIndex].parentElement;
                    while ($parent !== $tocCore) {
                        $parent.classList.add('has-active');
                        $parent = $parent.parentElement.parentElement;
                    }
                }
            });
            this._tocOnScroll();
            this.scrollEventSet.add(this._tocOnScroll);
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
                    this.initToc();
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
            this.initToc();
            this.onScroll();
            this.onResize();
            this.onClickMask();
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
