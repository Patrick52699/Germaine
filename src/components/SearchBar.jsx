
import { useState } from "react";

function SearchBar({ onSearch, onClear, isSearching = false }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery("");
    onClear();
  };

  return (
    <form
      onSubmit={handleSubmit}
      id="movie-search"
      className="my-10 flex flex-col gap-3 sm:flex-row"
    >
      <input
        id="movie-search-input"
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search for a movie..."
        aria-label="Search for a movie"
        disabled={isSearching}
        className="w-full rounded-lg border border-gray-700 bg-[#151515] px-5 py-3 text-white outline-none focus:border-red-600"
      />

      <button
        type="submit"
        disabled={isSearching}
        className="rounded-lg bg-red-600 px-7 py-3 font-bold text-white hover:bg-red-700"
      >
        {isSearching ? "Searching..." : "Search"}
      </button>

      <button
        type="button"
        onClick={handleClear}
        className="rounded-lg border border-gray-600 px-7 py-3 text-white hover:bg-gray-800"
      >
        Clear
      </button>
    </form>
  );
}

export default SearchBar;
