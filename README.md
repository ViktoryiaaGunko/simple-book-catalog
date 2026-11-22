# The Library — Simple Book Catalog

**Live Demo:** [Open the live site](https://simple-book-catalog-leq9lq2b7-vika-2879.vercel.app/)

## Task

The Library is a simple web application for finding books. It uses the Open Library API to search for books and display their titles, authors, covers, and publication years.

A user can search with the Search button, press Enter, or wait for the automatic search while typing. Books can also be added to a Favorites list. The Favorites list is saved in the browser with `localStorage`.

**Task document:** [Open the task document](https://drive.google.com/file/d/1RBRcuH-_oAvtjem5Xs0c4NXZ8I38aYyH/view)

## How to run the app

Make sure that Node.js and npm are installed on your computer.

1. Clone or download the project.
2. Open the project folder in a terminal.
3. Install the project dependencies:

   ```bash
   npm install
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open the local URL shown in the terminal. It is usually:

   `http://localhost:5173`

6. To create a production build, run:

   ```bash
   npm run build
   ```

The production files are created in the `dist/` folder. The build contains `index.html`, a bundled JavaScript file, and an `assets/` folder with the files needed by the application.

## Project Structure

- **`public/assets/`** — Contains static files such as images, icons, and fonts. Vite copies these files to the production build without changing them.
- **`src/api/`** — Contains the code that works with the Open Library API (`booksApi.js`). It sends search requests and returns book data to the application.
- **`src/components/`** — Contains functions that create and render interface elements. This includes book cards (`bookCard.js`) and the Favorites list (`favoritesList.js`).
- **`src/utils/`** — Contains small helper functions used in different parts of the project. The storage utility (`storage.js`) reads and saves favorite books with `localStorage`. The debounce utility (`debounce.js`) adds a short delay before the automatic search starts.
- **`src/styles/`** — Contains the CSS files (`style.css`) used to style the page, book cards, search form, Favorites list, messages, and responsive layout.
- **`src/main.js`** — This is the main application file. It connects the interface, API, components, storage, Favorites logic, form search, and automatic debounced search.
