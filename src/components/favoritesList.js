src/components/favoritesList.js

const COVER_URL = 'https://covers.openlibrary.org/b/id';

/**
 * Returns a safe book title.
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

    const authors = book.author_name
        .filter(
            (author) =>
                typeof author === 'string' &&
                author.trim()
        )
        .map((author) => author.trim());

    return authors.length > 0
        ? authors.join(', ')
        : 'Unknown author';
}

/**
 * Returns a publication year containing only a valid integer.
 *
 * @param {*} value
 * @returns {string}
 */
function getBookYear(value) {
    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ''
    ) {
        return '';
    }

    const numericYear = Number(value);

    if (!Number.isInteger(numericYear)) {
        return '';
    }

    return String(numericYear);
}

/**
 * Checks whether a book has a usable cover identifier.
 *
 * @param {Object} book
 * @returns {boolean}
 */
function hasCover(book) {
    return (
        book.cover_i !== undefined &&
        book.cover_i !== null &&
        String(book.cover_i).trim() !== ''
    );
}

/**
 * Replaces a missing or broken miniature cover with a placeholder.
 *
 * @param {HTMLElement} cover
 * @param {string} title
 */
function showCoverPlaceholder(cover, title) {
    cover.replaceChildren();
    cover.classList.add('favorite-item__cover--placeholder');
    cover.setAttribute(
        'aria-label',
        `Cover for ${title} is unavailable`
    );

    const icon = document.createElement('img');

    icon.className = 'favorite-item__cover-icon';
    icon.src = './assets/icons/book.svg';
    icon.alt = '';
    icon.setAttribute('aria-hidden', 'true');

    cover.append(icon);
}

/**
 * Creates a miniature book cover.
 *
 * @param {Object} book
 * @param {string} title
 * @returns {HTMLElement}
 */
function createFavoriteCover(book, title) {
    const cover = document.createElement('div');

    cover.className = 'favorite-item__cover';
    cover.setAttribute('role', 'img');

    if (!hasCover(book)) {
        showCoverPlaceholder(cover, title);

        return cover;
    }

    cover.setAttribute(
        'aria-label',
        `${title} book cover`
    );

    const image = document.createElement('img');

    image.className = 'favorite-item__cover-image';
    image.src =
        `${COVER_URL}/${encodeURIComponent(book.cover_i)}-S.jpg`;
    image.alt = '';
    image.loading = 'lazy';
    image.decoding = 'async';
    image.setAttribute('aria-hidden', 'true');

    image.addEventListener(
        'error',
        () => {
            showCoverPlaceholder(cover, title);
        },
        { once: true }
    );

    cover.append(image);

    return cover;
}

/**
 * Creates a filled heart used by the remove button.
 *
 * @returns {HTMLElement}
 */
function createFilledHeart() {
    const heart = document.createElement('span');

    heart.className = 'favorite-item__heart';
    heart.textContent = '♥';
    heart.setAttribute('aria-hidden', 'true');

    return heart;
}

/**
 * Creates one row in the favorites panel.
 *
 * @param {Object} book
 * @returns {HTMLLIElement}
 */
function createFavoriteItem(book) {
    const title = getBookTitle(book);
    const authors = getBookAuthors(book);
    const year = getBookYear(book.first_publish_year);

    const item = document.createElement('li');

    item.className = 'favorite-item';
    item.dataset.bookId = book.key;

    const cover = createFavoriteCover(book, title);

    const details = document.createElement('div');

    details.className = 'favorite-item__details';

    const titleElement = document.createElement('h3');

    titleElement.className = 'favorite-item__title';
    titleElement.textContent = title;
    titleElement.title = title;

    const authorElement = document.createElement('p');

    authorElement.className = 'favorite-item__author';
    authorElement.textContent = authors;
    authorElement.title = authors;

    details.append(titleElement, authorElement);

    /*
     * The year element is omitted when the API does not provide
     * a valid numeric publication year.
     */
    if (year) {
        const yearElement = document.createElement('p');

        yearElement.className = 'favorite-item__year';
        yearElement.textContent = year;

        details.append(yearElement);
    }

    const removeButton = document.createElement('button');

    removeButton.className = 'favorite-item__remove';
    removeButton.type = 'button';
    removeButton.dataset.bookId = book.key;
    removeButton.setAttribute(
        'aria-label',
        `Remove ${title} from favorites`
    );

    removeButton.append(createFilledHeart());

    item.append(cover, details, removeButton);

    return item;
}

/**
 * Returns the counter text with the correct singular or plural form.
 *
 * @param {number} count
 * @returns {string}
 */
function getCounterText(count) {
    return count === 1
        ? '1 book saved'
        : `${count} books saved`;
}

/**
 * Renders the complete Favorites panel.
 *
 * @param {Array<Object>} favorites
 */
export function renderFavorites(favorites) {
    const counter = document.querySelector(
        '.favorites-panel__counter'
    );
    const emptyMessage = document.querySelector(
        '.favorites-empty'
    );
    const favoritesList = document.querySelector(
        '.favorites-list'
    );

    if (!counter || !emptyMessage || !favoritesList) {
        throw new Error(
            'Required Favorites panel elements were not found.'
        );
    }

    const safeFavorites = Array.isArray(favorites)
        ? favorites.filter(
            (book) =>
                book &&
                typeof book === 'object' &&
                typeof book.key === 'string' &&
                book.key.trim()
        )
        : [];

    counter.textContent = getCounterText(safeFavorites.length);
    favoritesList.replaceChildren();

    if (safeFavorites.length === 0) {
        emptyMessage.hidden = false;
        favoritesList.hidden = true;

        return;
    }

    const fragment = document.createDocumentFragment();

    safeFavorites.forEach((book) => {
        fragment.append(createFavoriteItem(book));
    });

    favoritesList.append(fragment);
    favoritesList.hidden = false;
    emptyMessage.hidden = true;
}
