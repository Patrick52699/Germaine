import { useEffect, useRef, useState } from "react";
import SearchBar from "./components/SearchBar";
import { searchMovies, TMDB_API_KEY } from "./services/tmdb";

const API_KEY = TMDB_API_KEY;
const IMAGE_URL = "https://image.tmdb.org/t/p/";

function MovieSection({ id, title, subtitle, movieList, onPlay }) {
  return (
    <section id={id} className="py-10">
      <div className="mb-5">
        <h2 className="text-2xl font-black uppercase tracking-tight md:text-3xl">
          {title}
        </h2>
        <p className="mt-1 text-sm text-gray-400">{subtitle}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {movieList.map((movie) => (
          <article key={movie.id} className="group min-w-0">
            <button
              type="button"
              onClick={() => onPlay(movie)}
              aria-label={`Play ${movie.title || movie.name}`}
              className="relative block w-full overflow-hidden rounded-lg bg-white/5 text-left"
            >
              {movie.poster_path ? (
                <img
                  src={`${IMAGE_URL}w500${movie.poster_path}`}
                  alt={movie.title || movie.name}
                  loading="lazy"
                  className="aspect-2/3 w-full object-cover transition duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex aspect-2/3 items-center justify-center p-4 text-center text-sm text-gray-400">
                  Poster unavailable
                </div>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-4xl opacity-0 transition group-hover:bg-black/50 group-hover:opacity-100">
                ▶️
              </span>
            </button>
            <h3 className="mt-3 truncate font-semibold">
              {movie.title || movie.name}
            </h3>
            <p className="mt-1 text-xs text-gray-400">
              {movie.release_date?.slice(0, 4) || "—"} · ★ {movie.vote_average?.toFixed(1) || "N/A"}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}


function App() {
  const [movies, setMovies] = useState({
    trending: [],
    nowPlaying: [],
    popular: [],
    topRated: [],
    upcoming: [],
  });

  const [heroIndex, setHeroIndex] = useState(0);
  const [activeTrailer, setActiveTrailer] = useState(null);
  const [trailerLoading, setTrailerLoading] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const searchRequestId = useRef(0);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    if (!profileOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setProfileOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [profileOpen]);

  const handleSearch = async (query) => {
    const requestId = ++searchRequestId.current;
    setSearchQuery(query);
    setSearchResults([]);
    setSearchError("");
    setSearchLoading(true);

    try {
      const results = await searchMovies(query);
      if (requestId === searchRequestId.current) {
        setSearchResults(results);
      }
    } catch (error) {
      if (requestId !== searchRequestId.current) return;
      console.error("Movie search error:", error);
      setSearchError("Could not search movies right now. Please try again.");
    } finally {
      if (requestId === searchRequestId.current) {
        setSearchLoading(false);
      }
    }
  };

  const clearSearch = () => {
    searchRequestId.current += 1;
    setSearchQuery("");
    setSearchResults(null);
    setSearchError("");
    setSearchLoading(false);
  };

  const focusMovieSearch = () => {
    const searchInput = document.getElementById("movie-search-input");
    searchInput?.scrollIntoView({ behavior: "smooth", block: "center" });
    searchInput?.focus({ preventScroll: true });
  };

  // FETCH MOVIES FROM TMDB
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const endpoints = [
          "trending/movie/week",
          "movie/now_playing",
          "movie/popular",
          "movie/top_rated",
          "movie/upcoming",
        ];

        const responses = await Promise.all(
          endpoints.map((endpoint) =>
            fetch(
              `https://api.themoviedb.org/3/${endpoint}?language=en-US&page=1&api_key=${API_KEY}`
            )
          )
        );

        const data = await Promise.all(
          responses.map((response) => {
            if (!response.ok) {
              throw new Error("Failed to fetch movies");
            }

            return response.json();
          })
        );

        setMovies({
          trending: data[0].results || [],
          nowPlaying: data[1].results || [],
          popular: data[2].results || [],
          topRated: data[3].results || [],
          upcoming: data[4].results || [],
        });
      } catch (error) {
        console.error("Movie fetching error:", error);
      }
    };

    fetchMovies();
  }, []);

  // AUTOMATICALLY CHANGE HERO MOVIE
  useEffect(() => {
    if (movies.trending.length === 0) return;

    const interval = setInterval(() => {
      setHeroIndex((current) => (current + 1) % movies.trending.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [movies.trending]);

  // GET AND PLAY MOVIE TRAILER
  const handlePlay = async (movie) => {
    const trailerDetails = {
      title: movie.title || movie.name,
      overview: movie.overview,
      movieId: movie.id,
      year: movie.release_date?.slice(0, 4),
    };

    setTrailerLoading(true);
    setActiveTrailer({
      loading: true,
      ...trailerDetails,
    });

    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${movie.id}/videos?language=en-US&api_key=${API_KEY}`
      );

      if (!response.ok) {
        throw new Error("Could not fetch trailer");
      }

      const data = await response.json();

      const trailer =
        data.results?.find(
          (video) =>
            video.site === "YouTube" &&
            video.type === "Trailer" &&
            video.official
        ) ||
        data.results?.find(
          (video) =>
            video.site === "YouTube" && video.type === "Trailer"
        ) ||
        data.results?.find(
          (video) => video.site === "YouTube" && video.type === "Teaser"
        );

      if (trailer) {
        setActiveTrailer({
          loading: false,
          ...trailerDetails,
          key: trailer.key,
        });
      } else {
        setActiveTrailer({
          loading: false,
          ...trailerDetails,
          error: "TMDB has no trailer video for this movie.",
        });
      }
    } catch (error) {
      console.error("Trailer error:", error);

      setActiveTrailer({
        loading: false,
        ...trailerDetails,
        error: "Unable to load this trailer. Please try again.",
      });
    } finally {
      setTrailerLoading(false);
    }
  };

  const currentHero = movies.trending[heroIndex];

  const nextHero = () => {
    setHeroIndex((current) => (current + 1) % movies.trending.length);
  };

  const previousHero = () => {
    setHeroIndex(
      (current) =>
        (current - 1 + movies.trending.length) % movies.trending.length
    );
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#080808] text-white">

      {/* HERO AND HEADER */}
      <section className="relative min-h-162.5 overflow-hidden bg-black md:min-h-180">

        {/* ANIMATED HERO BACKGROUND */}
        {currentHero?.backdrop_path && (
          <img
            key={currentHero.id}
            src={`${IMAGE_URL}original${currentHero.backdrop_path}`}
            alt=""
            aria-hidden="true"
            className="hero-background absolute inset-0 h-full w-full object-cover object-center"
          />
        )}

        {/* BACKGROUND OVERLAYS */}
        <div className="absolute inset-0 bg-linear-to-r from-black via-black/75 to-black/20" />
        <div className="absolute inset-0 bg-linear-to-t from-[#080808] via-transparent to-black/60" />

        {/* HEADER */}
        <header className="relative z-30 flex items-center justify-between px-5 py-5 md:px-12">
          <div className="inline-flex items-center gap-2 shrink-0">
  {/* Logo container */}
  <div className="w-12 h-12 shrink-0 flex items-center justify-center overflow-hidden">
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full block"
      fill="none"
      stroke="white"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="30" cy="27" r="23" />
      <circle cx="30" cy="27" r="17" />
      <circle cx="30" cy="27" r="5" />

      <path d="M30 10 L35 21 L30 27 L25 21 Z" />
      <path d="M47 27 L36 31 L30 27 L36 23 Z" />
      <path d="M30 44 L25 33 L30 27 L35 33 Z" />
      <path d="M13 27 L24 23 L30 27 L24 31 Z" />

      <path d="M9 51 H51 V57 H9 Z" />
      <path d="M16 51 V57 M23 51 V57 M30 51 V57 M37 51 V57 M44 51 V57" />
    </svg>
  </div>

  {/* Keep your existing text exactly as it is */}
  <div className="shrink-0">
    {/* Your existing logo text goes here */}
    <a href="/" className="text-xl font-black uppercase tracking-tight text-red-600 md:text-2xl">
            MOVIES BAZER
          </a>
  </div>
</div>
{/* DESKTOP NAVIGATION */}
          <nav className="hidden items-center gap-7 text-sm text-gray-300 md:flex">
            <a href="/" className="text-white transition hover:text-red-500">
              Home
            </a>

            <a href="#trending" className="transition hover:text-red-500">
              Explore
            </a>

            <a href="#popular" className="transition hover:text-red-500">
              Popular
            </a>

            <a href="#now-playing" className="transition hover:text-red-500">
              Now Playing
            </a>

            <a href="#upcoming" className="transition hover:text-red-500">
              Upcoming
            </a>
          </nav>

          {/* HEADER ICONS */}
          <div className="flex items-center gap-5">
            <button
              aria-label="Search movies"
              onClick={focusMovieSearch}
              className="hidden text-gray-300 transition hover:text-red-500 md:inline-flex"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m16 16 4 4" />
              </svg>
            </button>

            <a
              href="#upcoming"
              aria-label="Upcoming movies"
              className="hidden text-gray-300 transition hover:text-red-500 md:inline-flex"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M10 21h4" />
              </svg>
            </a>

            <div ref={profileMenuRef} className="relative">
              <button
                type="button"
                aria-label="Account menu"
                aria-expanded={profileOpen}
                aria-controls="profile-menu"
                onClick={() => setProfileOpen((open) => !open)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
                </svg>
              </button>
              {profileOpen && (
                <div
                  id="profile-menu"
                  className="absolute right-0 top-full z-50 mt-3 w-72 rounded-xl border border-white/10 bg-[#151515] p-4 shadow-2xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600/20 text-red-400">
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="8" r="4" />
                        <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
                      </svg>
                    </span>
                    <div>
                      <p className="font-semibold">Guest</p>
                      <p className="text-xs text-gray-400">Browsing without an account</p>
                    </div>
                  </div>
                  <div className="mt-4 border-t border-white/10 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        focusMovieSearch();
                      }}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-200 transition hover:bg-white/10"
                    >
                      Search movies
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        document.getElementById("trending")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-200 transition hover:bg-white/10"
                    >
                      Explore trending movies
                    </button>
                  </div>
                  <p className="mt-3 border-t border-white/10 pt-3 text-xs leading-5 text-gray-500">
                    Browse movies and trailers without signing in.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="text-white md:hidden"
            aria-label="Toggle navigation"
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileMenu ? (
                <path d="m6 6 12 12M18 6 6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>

          {/* MOBILE NAVIGATION */}
          {mobileMenu && (
            <nav className="absolute left-0 right-0 top-full flex flex-col gap-5 border-t border-white/10 bg-black/95 p-6 text-sm md:hidden">
              {[
                ["Home", "/"],
                ["Explore", "#trending"],
                ["Popular", "#popular"],
                ["Now Playing", "#now-playing"],
                ["Upcoming", "#upcoming"],
              ].map(([label, link]) => (
                <a
                  key={label}
                  href={link}
                  onClick={() => setMobileMenu(false)}
                  className="text-gray-300 transition hover:text-red-500"
                >
                  {label}
                </a>
              ))}
            </nav>
          )}
        </header>

        {/* HERO MOVIE DETAILS */}
        <div className="relative z-10 mx-auto flex min-h-135 max-w-7xl items-end px-5 pb-20 pt-20 md:px-12 md:pb-12">

          <div className="max-w-2xl">
            {currentHero ? (
              <>
                <div className="mb-4 flex items-center gap-3 text-xs text-gray-300">
                  <span className="rounded bg-red-600 px-2 py-1 text-[10px] font-bold uppercase">
                    Movie
                  </span>
                  <span>
                    {currentHero.release_date?.slice(0, 4) || "2026"}
                  </span>

                  <span className="text-yellow-400">
                    ★ {currentHero.vote_average?.toFixed(1) || "N/A"}
                  </span>
                </div>

                <h1
                  key={currentHero.id}
                  className="hero-title text-4xl font-black uppercase leading-none tracking-tight md:text-6xl lg:text-7xl"
                >
                  {currentHero.title || currentHero.name}
                </h1>

                <p className="mt-5 max-w-xl text-sm leading-6 text-gray-300 md:text-base">
                  {currentHero.overview
                    ? currentHero.overview.length > 200
                      ? `${currentHero.overview.slice(0, 200)}...`
                      : currentHero.overview
                    : "Discover this movie and explore more entertainment on Movies Bazer."}
                </p>

                {/* HERO BUTTONS */}
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => handlePlay(currentHero)}
                    className="flex items-center gap-3 rounded-lg bg-white px-7 py-3 text-sm font-bold text-black transition hover:bg-red-600 hover:text-white"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                      <path d="M7 4.5v15l12-7.5-12-7.5Z" />
                    </svg>
                    Play
                  </button>

                  <a
                    href={`https://www.themoviedb.org/movie/${currentHero.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-lg bg-white/20 px-7 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-red-600"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 11v5M12 7h.01" />
                    </svg>
                    More Info
                  </a>
                </div>
              </>
            ) : (
              <div>
                <p className="text-sm text-gray-400">Loading movies...</p>
                <h1 className="mt-3 text-5xl font-black uppercase">
                  Movies Bazer
                </h1>
              </div>
            )}
          </div>
        </div>

        {/* HERO CONTROLS */}
        {movies.trending.length > 1 && (
          <div className="absolute bottom-8 right-6 z-20 flex items-center gap-3 md:right-12">
            <div className="mr-3 flex gap-2">
              {movies.trending.slice(0, 6).map((movie, index) => (
                <button
                  key={movie.id}
                  onClick={() => setHeroIndex(index)}
                  aria-label={`Show ${movie.title}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    heroIndex === index ? "w-8 bg-red-600" : "w-3 bg-white/40"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={previousHero}
              aria-label="Previous movie"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/30 transition hover:bg-red-600"
            >
              ←
            </button>

            <button
              onClick={nextHero}
              aria-label="Next movie"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/30 transition hover:bg-red-600"
            >
              →
            </button>
          </div>
        )}
      </section>

      {/* MOVIE COLLECTIONS */}
      <main className="mx-auto max-w-7xl px-5 md:px-12">
        <SearchBar
          onSearch={handleSearch}
          onClear={clearSearch}
          isSearching={searchLoading}
        />

        {searchQuery && (
          searchLoading ? (
            <section id="search-results" className="py-6" aria-live="polite">
              <h2 className="text-2xl font-black uppercase tracking-tight md:text-3xl">
                Searching for “{searchQuery}”
              </h2>
              <p className="mt-2 text-sm text-gray-400">Loading movie results...</p>
            </section>
          ) : searchError ? (
            <section id="search-results" className="py-6" role="alert">
              <h2 className="text-2xl font-black uppercase tracking-tight md:text-3xl">
                Search failed
              </h2>
              <p className="mt-2 text-sm text-red-400">{searchError}</p>
            </section>
          ) : searchResults?.length ? (
            <MovieSection
              id="search-results"
              title={`Results for “${searchQuery}”`}
              subtitle={`${searchResults.length} movies found`}
              movieList={searchResults}
              onPlay={handlePlay}
            />
          ) : (
            <section id="search-results" className="py-6">
              <h2 className="text-2xl font-black uppercase tracking-tight md:text-3xl">
                No results for “{searchQuery}”
              </h2>
              <p className="mt-2 text-sm text-gray-400">
                Try another movie title.
              </p>
            </section>
          )
        )}

        <MovieSection
          id="trending"
          title="Trending Movies"
          subtitle="Popular This Week"
          movieList={movies.trending}
          onPlay={handlePlay}
        />

        <MovieSection
          id="now-playing"
          title="Now Playing"
          subtitle="Watch What's New"
          movieList={movies.nowPlaying}
          onPlay={handlePlay}
        />

        <MovieSection
          id="popular"
          title="Popular Movies"
          subtitle="Audience Favorites"
          movieList={movies.popular}
          onPlay={handlePlay}
        />

        <MovieSection
          id="top-rated"
          title="Top Rated Movies"
          subtitle="Highest Rated"
          movieList={movies.topRated}
          onPlay={handlePlay}
        />

        <MovieSection
          id="upcoming"
          title="Upcoming Movies"
          subtitle="Coming Soon"
          movieList={movies.upcoming}
          onPlay={handlePlay}
        />

      </main>

      {/* TRAILER MODAL */}
      {activeTrailer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm"
          onClick={() => setActiveTrailer(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-[#111]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <h2 className="truncate pr-4 font-bold text-white">
                {activeTrailer.title}
              </h2>

              <button
                onClick={() => setActiveTrailer(null)}
                aria-label="Close trailer"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xl transition hover:bg-red-600"
              >
                ×
              </button>
            </div>

            <div className="relative aspect-video w-full">
              {activeTrailer.loading || trailerLoading ? (
                <div className="flex h-full items-center justify-center text-gray-300">
                  Loading trailer...
                </div>
              ) : activeTrailer.key ? (
                <iframe
                  src={`https://www.youtube.com/embed/${activeTrailer.key}?autoplay=1&rel=0`}
                  title={`${activeTrailer.title} trailer`}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-5 px-6 text-center text-gray-300">
                  <p>{activeTrailer.error}</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${activeTrailer.title} ${activeTrailer.year || ""} trailer`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"
                    >
                      Search YouTube
                    </a>
                    <a
                      href={`https://www.themoviedb.org/movie/${activeTrailer.movieId}/videos`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      Check TMDB videos
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5">
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-red-500">
                About this movie
              </h3>
              <p className="text-sm leading-6 text-gray-300">
                {activeTrailer.overview ||
                  "No description is available for this movie."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="mt-16 border-t border-white/10 bg-black px-6 py-12 text-center">
        <h2 className="text-2xl font-black uppercase text-red-600">
          Movies Bazer
        </h2>

        <p className="mt-3 text-sm text-gray-400">
          Your world of movies and entertainment.
        </p>

        <p className="mt-6 text-xs text-gray-600">
          © 2026 Movies Bazer. All rights reserved.
        </p>
        <p>Mr PATTY IP <strong>Developer</strong></p>
        <p><marquee behavior="scroll" direction="left">Patrick UWURUKUNDO </marquee></p>
      </footer>

      {/* ANIMATIONS */}
      <style>{`
        @keyframes heroFade {
          from {
            opacity: 0;
            transform: scale(1.08);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
          @keyframes titleFade {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .hero-background {
          animation: heroFade 1.5s ease both;
        }

        .hero-title {
          animation: titleFade 0.7s ease both;
        }

        html {
          scroll-behavior: smooth;
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </div>
  );
}

export default App;