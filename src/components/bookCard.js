const COVER_URL = 'https://covers.openlibrary.org/b/id';
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

/**
 * Returns a non-empty book title.
 *
 * @param {Object} book
 * @returns {string}
 */
function getBookTitle(book) {
    if (typeof book.title !== 'string' || !book.title.trim()) {
        return 'Untitled';
    }

    return book.title.trim();
}

/**
 * Returns a formatted author list.
 *
 * @param {Object} book
 * @returns {string}
 */
function getBookAuthors(book) {
    if (!Array.isArray(book.author_name)) {
        return 'Unknown author';
    }

    const authors = book.author_name.filter(
        (author) => typeof author === 'string' && author.trim()
    );

    return authors.length > 0
        ? authors.join(', ')
        : 'Unknown author';
}

/**
 * Creates an inline heart SVG.
 *
 * @returns {SVGElement}
 */
function createHeartIcon() {
    const svg = document.createElementNS(SVG_NAMESPACE, 'svg');
    const path = document.createElementNS(SVG_NAMESPACE, 'path');

    svg.classList.add(
        'book-card__favorite-icon',
        'favorite-btn__icon'
    );

    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '24');
    svg.setAttribute('height', '24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');

    path.setAttribute(
        'd',
        'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06' +
        'a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84' +
        'a5.5 5.5 0 0 0 0-7.78Z'
    );

    svg.append(path);

    return svg;
}

/**
 * Replaces a missing or broken image with a cover placeholder.
 *
 * @param {HTMLElement} cover
 * @param {HTMLImageElement|null} image
 * @param {string} title
 */
function showCoverPlaceholder(cover, image, title) {
    image?.remove();

    if (cover.querySelector('.book-card__cover-placeholder')) {
        return;
    }

    cover.classList.add('book-card__cover--placeholder');
    cover.setAttribute('role', 'img');
    cover.setAttribute(
        'aria-label',
        `Обложка книги «${title}» отсутствует`
    );

    const placeholder = document.createElement('span');

    placeholder.className = 'book-card__cover-placeholder';
    placeholder.textContent = 'No cover';

    cover.prepend(placeholder);
}

/**
 * Creates the book cover and handles image loading errors.
 *
 * @param {Object} book
 * @param {string} title
 * @returns {HTMLElement}
 */
function createBookCover(book, title) {
    const cover = document.createElement('div');

    cover.className = 'book-card__cover';

    if (book.cover_i !== undefined && book.cover_i !== null) {
        const image = document.createElement('img');

        image.className = 'book-card__cover-image';
        image.alt = `Обложка книги «${title}»`;
        image.loading = 'lazy';
        image.decoding = 'async';

        image.addEventListener(
            'error',
            () => {
                showCoverPlaceholder(cover, image, title);
            },
            { once: true }
        );

        image.src = `${COVER_URL}/${encodeURIComponent(book.cover_i)}.jpg`;

        cover.append(image);
    } else {
        showCoverPlaceholder(cover, null, title);
    }

    return cover;
}

/**
 * Creates the favorite button.
 *
 * The button receives both the existing CSS class and the new API class.
 *
 * @param {string} title
 * @returns {HTMLButtonElement}
 */
function createFavoriteButton(title) {
    const button = document.createElement('button');

    button.className = 'book-card__favorite favorite-btn';
    button.type = 'button';
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute(
        'aria-label',
        `Add ${title} to favorites`
    );

    button.append(createHeartIcon());

    return button;
}

/**
 * Creates a book card DOM element.
 *
 * @param {Object} book
 * @param {(book: Object) => void} [onFavoriteToggle]
 * @returns {HTMLElement}
 */
export function createBookCard(book, onFavoriteToggle) {
    const title = getBookTitle(book);
    const authors = getBookAuthors(book);

    const card = document.createElement('article');

    card.className = 'book-card';

    if (typeof book.key === 'string') {
        card.dataset.bookId = book.key;
    }

    const cover = createBookCover(book, title);
    const favoriteButton = createFavoriteButton(title);

    if (typeof onFavoriteToggle === 'function') {
        favoriteButton.addEventListener('click', () => {
            onFavoriteToggle(book);
        });
    }

    cover.append(favoriteButton);

    const content = document.createElement('div');
    content.className = 'book-card__content';

    const titleElement = document.createElement('h3');
    titleElement.className = 'book-card__title';
    titleElement.textContent = title;

    const authorElement = document.createElement('p');
    authorElement.className = 'book-card__author';
    authorElement.textContent = authors;

    content.append(titleElement, authorElement);

    if (
        book.first_publish_year !== undefined &&
        book.first_publish_year !== null &&
        String(book.first_publish_year).trim()
    ) {
        const yearElement = document.createElement('p');

        yearElement.className = 'book-card__year';
        yearElement.textContent = String(book.first_publish_year);

        content.append(yearElement);
    }

    card.append(cover, content);

    return card;
}

