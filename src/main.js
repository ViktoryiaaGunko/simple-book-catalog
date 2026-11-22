import { searchBooks } from './api/booksApi.js';
import { createBookCard } from './components/bookCard.js';
import {
    renderFavorites
} from './components/favoritesList.js';
import { debounce } from './utils/debounce.js';
import {
    getFavorites,
    saveFavorites
} from './utils/storage.js';

const INITIAL_QUERY = 'classic';

const searchForm = document.querySelector('.search-form');
const searchInput = document.querySelector('#book-search');
const booksGrid = document.querySelector('.books-grid');
const favoritesList = document.querySelector('.favorites-list');

if (
    !searchForm ||
    !searchInput ||
    !booksGrid ||
    !favoritesList
) {
    throw new Error(
        'Required application interface elements were not found.'
    );
}

/*
 * Create the status region dynamically so the existing page markup
 * does not need additional structural changes.
 */
const statusRegion = document.createElement('div');
const statusMessage = document.createElement('p');

statusRegion.className = 'status-region';
statusRegion.setAttribute('aria-live', 'polite');
statusRegion.setAttribute('aria-atomic', 'true');

statusMessage.className = 'status-message';
statusMessage.setAttribute('role', 'status');
statusMessage.hidden = true;

statusRegion.append(statusMessage);
booksGrid.before(statusRegion);

/*
 * Each search receives an identifier. This prevents an older, slower
 * response from replacing the results of a newer search.
 */
let activeRequestId = 0;

/*
 * The map contains normalized data for books currently displayed
 * in the search results. It allows a complete book object to be
 * added to favorites after a card button is clicked.
 */
const displayedBooks = new Map();

/*
 * Restore saved favorites before the first API request is performed.
 */
let favorites = getFavorites();

/**
 * Returns a valid Open Library book key.
 *
 * @param {Object} book
 * @returns {string}
 */
function getBookKey(book) {
    if (
        !book ||
        typeof book.key !== 'string' ||
        !book.key.trim()
    ) {
        return '';
    }

    return book.key.trim();
}

/**
 * Converts API book data into a small JSON-safe object suitable
 * for localStorage.
 *
 * @param {Object} book
 * @returns {Object|null}
 */
function createStoredFavorite(book) {
    const key = getBookKey(book);

    if (!key) {
        return null;
    }

    const title =
        typeof book.title === 'string' && book.title.trim()
            ? book.title.trim()
            : 'Untitled';

    const authorNames = Array.isArray(book.author_name)
        ? book.author_name
            .filter(
                (author) =>
                    typeof author === 'string' &&
                    author.trim()
            )
            .map((author) => author.trim())
        : [];

    const storedBook = {
        key,
        title,
        author_name: authorNames
    };

    if (
        book.cover_i !== undefined &&
        book.cover_i !== null &&
        String(book.cover_i).trim()
    ) {
        storedBook.cover_i = book.cover_i;
    }

    if (
        book.first_publish_year !== undefined &&
        book.first_publish_year !== null &&
        String(book.first_publish_year).trim()
    ) {
        const numericYear = Number(book.first_publish_year);

        if (Number.isInteger(numericYear)) {
            storedBook.first_publish_year = numericYear;
        }
    }

    return storedBook;
}

/**
 * Checks whether a book is currently saved.
 *
 * @param {string} bookId
 * @returns {boolean}
 */
function isBookFavorite(bookId) {
    return favorites.some(
        (favorite) => favorite.key === bookId
    );
}

/**
 * Returns the title displayed inside a book card.
 *
 * @param {HTMLElement|null} card
 * @returns {string}
 */
function getCardTitle(card) {
    const title = card
        ?.querySelector('.book-card__title')
        ?.textContent
        ?.trim();

    return title || 'this book';
}

/**
 * Updates the visual and accessible state of a card heart button.
 *
 * @param {HTMLButtonElement} button
 * @param {boolean} isFavorite
 * @param {string} title
 */
function setFavoriteButtonState(
    button,
    isFavorite,
    title
) {
    button.classList.toggle('is-favorite', isFavorite);
    button.setAttribute(
        'aria-pressed',
        String(isFavorite)
    );
    button.setAttribute(
        'aria-label',
        isFavorite
            ? `Remove ${title} from favorites`
            : `Add ${title} to favorites`
    );
}

/**
 * Synchronizes heart buttons with the current favorites array.
 *
 * When bookId is provided, only matching visible cards are updated.
 *
 * @param {string|null} bookId
 */
function syncFavoriteButtons(bookId = null) {
    const favoriteButtons = booksGrid.querySelectorAll(
        '.favorite-btn'
    );

    favoriteButtons.forEach((button) => {
        const card = button.closest('.book-card');
        const currentBookId = card?.dataset.bookId;

        if (!currentBookId) {
            return;
        }

        if (bookId !== null && currentBookId !== bookId) {
            return;
        }

        setFavoriteButtonState(
            button,
            isBookFavorite(currentBookId),
            getCardTitle(card)
        );
    });
}

/**
 * Saves and renders the current Favorites state.
 */
function commitFavorites() {
    saveFavorites(favorites);
    renderFavorites(favorites);
}

/**
 * Displays a status message or hides the status region.
 *
 * @param {string|null} message
 * @param {{ isError?: boolean }} options
 */
function setStatus(message, { isError = false } = {}) {
    if (!message) {
        statusMessage.hidden = true;
        statusMessage.textContent = '';
        statusMessage.classList.remove(
            'status-message--error'
        );
        statusMessage.setAttribute('role', 'status');

        return;
    }

    statusMessage.textContent = message;
    statusMessage.hidden = false;
    statusMessage.classList.toggle(
        'status-message--error',
        isError
    );
    statusMessage.setAttribute(
        'role',
        isError ? 'alert' : 'status'
    );
}

/**
 * Clears visible cards and their associated book data.
 */
function clearBooks() {
    displayedBooks.clear();
    booksGrid.replaceChildren();
}

/**
 * Renders books inside the existing grid.
 *
 * @param {Array<Object>} books
 */
function renderBooks(books) {
    const fragment = document.createDocumentFragment();

    displayedBooks.clear();

    books.forEach((book) => {
        const storedBook = createStoredFavorite(book);

        const card = createBookCard(
            book,
            storedBook
                ? () => {
                    toggleFavorite(storedBook.key);
                }
                : undefined
        );

        const favoriteButton = card.querySelector(
            '.favorite-btn'
        );

        if (storedBook) {
            /*
             * Store the normalized key on the card to guarantee
             * that card and localStorage identifiers match.
             */
            card.dataset.bookId = storedBook.key;
            displayedBooks.set(storedBook.key, storedBook);

            if (favoriteButton) {
                setFavoriteButtonState(
                    favoriteButton,
                    isBookFavorite(storedBook.key),
                    getCardTitle(card)
                );
            }
        } else if (favoriteButton) {
            /*
             * Favorites require book.key as a stable identifier,
             * so books without it cannot be saved.
             */
            favoriteButton.disabled = true;
            favoriteButton.setAttribute(
                'aria-label',
                'This book cannot be added to favorites'
            );
        }

        fragment.append(card);
    });

    booksGrid.replaceChildren(fragment);
}

/**
 * Executes a search and handles every interface state.
 *
 * @param {string} query
 */
async function performSearch(query) {
    const normalizedQuery = query.trim();
    const requestId = ++activeRequestId;

    if (!normalizedQuery) {
        clearBooks();
        booksGrid.setAttribute('aria-busy', 'false');
        setStatus('Enter a search term');
        searchInput.focus();

        return;
    }

    clearBooks();
    booksGrid.setAttribute('aria-busy', 'true');
    setStatus('Loading...');

    try {
        const books = await searchBooks(normalizedQuery);

        /*
         * Ignore the response when another search has already started.
         */
        if (requestId !== activeRequestId) {
            return;
        }

        booksGrid.setAttribute('aria-busy', 'false');

        if (books.length === 0) {
            setStatus('No books found');

            return;
        }

        setStatus(null);
        renderBooks(books);
    } catch (error) {
        if (requestId !== activeRequestId) {
            return;
        }

        booksGrid.setAttribute('aria-busy', 'false');
        clearBooks();
        setStatus('Network error', { isError: true });
    }
}

/**
 * Adds or removes a visible book from Favorites.
 *
 * @param {string} bookId
 */
function toggleFavorite(bookId) {
    const favoriteIndex = favorites.findIndex(
        (favorite) => favorite.key === bookId
    );

    if (favoriteIndex >= 0) {
        favorites = favorites.filter(
            (favorite) => favorite.key !== bookId
        );
    } else {
        const displayedBook = displayedBooks.get(bookId);

        if (!displayedBook) {
            return;
        }

        favorites = [
            ...favorites,
            displayedBook
        ];
    }

    commitFavorites();
    syncFavoriteButtons(bookId);
}

/**
 * Removes a book from Favorites by its Open Library key.
 *
 * @param {string} bookId
 */
function removeFavorite(bookId) {
    const nextFavorites = favorites.filter(
        (favorite) => favorite.key !== bookId
    );

    if (nextFavorites.length === favorites.length) {
        return;
    }

    favorites = nextFavorites;

    commitFavorites();
    syncFavoriteButtons(bookId);
}

/*
 * Run an automatic search after the user stops typing.
 * Empty values are ignored because empty-input messages should
 * only appear after an explicit form submission.
 */
const debouncedSearch = debounce((query) => {
    if (!query.trim()) {
        return;
    }

    performSearch(query);
}, 500);

/*
 * Search works both with the Search button and the Enter key.
 * Cancel the pending automatic search to avoid duplicate requests.
 */
searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    debouncedSearch.cancel();
    performSearch(searchInput.value);
});

/*
 * Start a debounced search when the user types a non-empty query.
 */
searchInput.addEventListener('input', () => {
    const query = searchInput.value;

    if (!query.trim()) {
        debouncedSearch.cancel();

        /*
         * Invalidate an active request so results from an older query
         * are not displayed after the input has been cleared.
         */
        activeRequestId += 1;
        clearBooks();
        booksGrid.setAttribute('aria-busy', 'false');
        setStatus(null);

        return;
    }

    debouncedSearch(query);
});

/*
 * Event delegation keeps removal working after every panel rerender.
 */
favoritesList.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) {
        return;
    }

    const removeButton = event.target.closest(
        '.favorite-item__remove'
    );

    if (
        !removeButton ||
        !favoritesList.contains(removeButton)
    ) {
        return;
    }

    const bookId = removeButton.dataset.bookId;

    if (!bookId) {
        return;
    }

    removeFavorite(bookId);
});

/*
 * Render restored favorites before loading the initial search results.
 */
renderFavorites(favorites);

/*
 * Load initial results immediately after the page is ready.
 */
searchInput.value = INITIAL_QUERY;
performSearch(INITIAL_QUERY);
