const SEARCH_URL = 'https://openlibrary.org/search.json';

/**
 * Searches for books using the Open Library API.
 *
 * @param {string} query
 * @returns {Promise<Array>}
 */
export async function searchBooks(query) {
    const encodedQuery = encodeURIComponent(query.trim());
    const url = `${SEARCH_URL}?q=${encodedQuery}&limit=10`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(
                `Open Library request failed with status ${response.status}`
            );
        }

        const data = await response.json();

        return Array.isArray(data.docs) ? data.docs : [];
    } catch (error) {
        console.error('Unable to fetch books from Open Library:', error);
        throw error;
    }
}

