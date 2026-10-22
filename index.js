const languages = [...document.querySelectorAll('[data-language]')];
const languageSections = [...document.querySelectorAll('.language-panel')];
const searchInput = document.getElementById('pageSearch');
const resultCount = document.getElementById('resultCount');
let activeCategory = 'all';

// Normalize text so searches are insensitive to case, accents and punctuation.
const normalize = (value) => value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

languageSections.forEach((section) => {
    const categoryList = section.querySelector('.category-filter-list');
    if (!categoryList) return;

    categoryList.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            activeCategory = link.dataset.category;
            searchInput.value = '';
            history.replaceState(null, '', link.getAttribute('href'));
            filterPages();
        });
    });
});

function filterPages() {
    const query = normalize(searchInput.value);
    const searchTerms = query.split(' ').filter(Boolean);
    const current = document.querySelector('.language-active');
    const categories = [...current.querySelectorAll(':scope > .category-section')];
    let visibleLinks = 0;

    categories.forEach((category) => {
        const categorySelected = activeCategory === 'all' || activeCategory === category.id;
        const links = [...category.querySelectorAll('.sub-menu a')];
        links.forEach((link) => {
            const groupName = link.closest('.version-group')?.querySelector('.version-group-name')?.textContent || '';
            const searchableText = normalize(`${groupName} ${link.textContent} ${link.href}`);
            const matches = categorySelected && searchTerms.every((term) => searchableText.includes(term));
            link.hidden = !matches;
            if (matches) visibleLinks += 1;
        });

        category.querySelectorAll('.version-group').forEach((group) => {
            group.hidden = ![...group.querySelectorAll('a')].some((link) => !link.hidden);
        });

        category.querySelectorAll('.sub-menu').forEach((group) => {
            group.hidden = ![...group.querySelectorAll('a')].some((link) => !link.hidden);
        });

        category.hidden = links.length === 0 || !categorySelected || (query && !links.some((link) => !link.hidden));
    });

    current.querySelectorAll('.category-nav [data-category]').forEach((button) => {
        button.classList.toggle('active', button.dataset.category === activeCategory);
    });

    resultCount.textContent = query
        ? `${visibleLinks} résultat${visibleLinks > 1 ? 's' : ''}`
        : `${visibleLinks} pages disponibles`;

    const emptyState = current.querySelector('.no-results');
    emptyState.hidden = !(query && visibleLinks === 0);
}

function selectLanguage(code, updateHash = true) {
    languageSections.forEach((section) => {
        section.classList.toggle('language-active', section.id === code);
    });
    languages.forEach((link) => {
        const selected = link.dataset.language === code;
        link.classList.toggle('active', selected);
        link.setAttribute('aria-current', selected ? 'page' : 'false');
    });
    searchInput.value = '';
    activeCategory = 'all';
    if (updateHash) history.replaceState(null, '', `#${code}`);
    filterPages();
}

languages.forEach((link) => {
    link.addEventListener('click', (event) => {
        event.preventDefault();
        selectLanguage(link.dataset.language);
    });
});

searchInput.addEventListener('input', filterPages);

function applyUrlFilter() {
    // Restore the language and category filters from the URL hash.
    const hash = location.hash.slice(1);
    const requestedCategory = document.getElementById(hash);
    const language = ['fr', 'en', 'de'].includes(hash)
        ? hash
        : ['fr', 'en', 'de'].find((code) => hash.startsWith(`${code}-`)) || 'fr';

    selectLanguage(language, false);
    const isCategory = hash.includes('-')
        && requestedCategory?.tagName === 'SECTION'
        && requestedCategory.parentElement?.id === language;
    activeCategory = isCategory ? hash : 'all';
    filterPages();
}

applyUrlFilter();
window.addEventListener('hashchange', () => {
    if (location.hash !== '#page-top') applyUrlFilter();
});

const backToTopButton = document.getElementById('backToTop');
// Show the shortcut once the user has started scrolling down the page.
window.addEventListener('scroll', () => {
    backToTopButton.hidden = window.scrollY <= 20;
});
