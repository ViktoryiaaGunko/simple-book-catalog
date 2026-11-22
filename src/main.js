import { searchBooks } from './api/booksApi.js';
import { createBookCard } from './components/bookCard.js';

const INITIAL_QUERY = 'classic';

const searchForm = document.querySelector('.search-form');
const searchInput = document.querySelector('#book-search');
const booksGrid = document.querySelector('.books-grid');

if (!searchForm || !searchInput || !booksGrid) {
    throw new Error('Required search interface elements were not found.');
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
        statusMessage.classList.remove('status-message--error');
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
 * Renders books inside the existing grid.
 *
 * @param {Array} books
 */
function renderBooks(books) {
    const fragment = document.createDocumentFragment();

    books.forEach((book) => {
        fragment.append(createBookCard(book));
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
        booksGrid.replaceChildren();
        booksGrid.setAttribute('aria-busy', 'false');
        setStatus('Введите запрос');
        searchInput.focus();
        return;
    }

    booksGrid.replaceChildren();
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
            setStatus('Ничего не найдено');
            return;
        }

        setStatus(null);
        renderBooks(books);
    } catch (error) {
        if (requestId !== activeRequestId) {
            return;
        }

        booksGrid.setAttribute('aria-busy', 'false');
        booksGrid.replaceChildren();
        setStatus('Ошибка сети', { isError: true });
    }
}

/*
 * Search works both with the Search button and the Enter key.
 */
searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    performSearch(searchInput.value);
});

/*
 * Favorite state is kept only in memory at this stage.
 * Event delegation also supports cards rendered after API requests.
 */
booksGrid.addEventListener('click', (event) => {
    const favoriteButton = event.target.closest('.favorite-btn');

    if (!favoriteButton || !booksGrid.contains(favoriteButton)) {
        return;
    }

    const card = favoriteButton.closest('.book-card');
    const title =
        card?.querySelector('.book-card__title')?.textContent ??
        'this book';

    const isFavorite =
        favoriteButton.classList.toggle('is-favorite');

    favoriteButton.setAttribute(
        'aria-pressed',
        String(isFavorite)
    );

    favoriteButton.setAttribute(
        'aria-label',
        isFavorite
            ? `Remove ${title} from favorites`
            : `Add ${title} to favorites`
    );
});

/*
 * Load initial results immediately after the page is ready.
 */
searchInput.value = INITIAL_QUERY;
performSearch(INITIAL_QUERY);

