const FAVORITES_STORAGE_KEY = 'libraryFavorites';

/**
 * Reads favorites from localStorage.
 *
 * Invalid JSON, unavailable storage and unexpected data produce
 * an empty array instead of breaking the application.
 *
 * @returns {Array<Object>}
 */
export function getFavorites() {
    try {
        const storedValue = window.localStorage.getItem(
            FAVORITES_STORAGE_KEY
        );

        if (!storedValue) {
            return [];
        }

        const parsedValue = JSON.parse(storedValue);

        if (!Array.isArray(parsedValue)) {
            return [];
        }

        /*
         * Keep only books with a valid Open Library key and remove
         * possible duplicate entries from corrupted storage data.
         */
        const uniqueFavorites = [];
        const usedKeys = new Set();

        parsedValue.forEach((favorite) => {
            if (
                !favorite ||
                typeof favorite !== 'object' ||
                typeof favorite.key !== 'string'
            ) {
                return;
            }

            const key = favorite.key.trim();

            if (!key || usedKeys.has(key)) {
                return;
            }

            usedKeys.add(key);

            uniqueFavorites.push({
                ...favorite,
                key
            });
        });

        return uniqueFavorites;
    } catch (error) {
        console.warn('Could not read favorites from localStorage.', error);

        return [];
    }
}

/**
 * Saves favorites to localStorage.
 *
 * The function returns false when serialization or writing fails,
 * for example when storage is unavailable or its quota is exceeded.
 *
 * @param {Array<Object>} favorites
 * @returns {boolean}
 */
export function saveFavorites(favorites) {
    try {
        const safeFavorites = Array.isArray(favorites)
            ? favorites
            : [];

        const serializedFavorites = JSON.stringify(safeFavorites);

        window.localStorage.setItem(
            FAVORITES_STORAGE_KEY,
            serializedFavorites
        );

        return true;
    } catch (error) {
        console.warn('Could not save favorites to localStorage.', error);

        return false;
    }
}
