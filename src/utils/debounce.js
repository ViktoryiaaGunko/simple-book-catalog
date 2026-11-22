/**
 * Returns a debounced version of the provided callback.
 *
 * The callback runs only after no new calls have been made
 * during the specified delay.
 *
 * @param {Function} callback
 * @param {number} delay
 * @returns {Function}
 */
export function debounce(callback, delay = 500) {
    let timeoutId = null;

    function debounced(...args) {
        const context = this;

        clearTimeout(timeoutId);

        timeoutId = setTimeout(() => {
            timeoutId = null;
            callback.apply(context, args);
        }, delay);
    }

    /*
     * Allow pending calls to be cancelled when a form search
     * needs to run immediately.
     */
    debounced.cancel = () => {
        clearTimeout(timeoutId);
        timeoutId = null;
    };

    return debounced;
}
