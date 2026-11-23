
export const TMDB_API_KEY =
  import.meta.env.VITE_TMDB_API_KEY || "add30a353d69221a0b48915a8fac6a27";

const BASE_URL = "https://api.themoviedb.org/3";

export const searchMovies = async (query) => {
  if (!query.trim()) {
    return [];
  }

  const response = await fetch(
    `${BASE_URL}/search/movie?query=${encodeURIComponent(query.trim())}&language=en-US&page=1&api_key=${TMDB_API_KEY}`
  );

  if (!response.ok) {
    throw new Error(`TMDB search failed: ${response.status}`);
  }

  const data = await response.json();

  return data.results || [];
};
