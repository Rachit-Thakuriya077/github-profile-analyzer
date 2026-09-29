// ==========================================================================
// DevScope - GitHub Profile & Repository Analyzer
// Built with React 18
// ==========================================================================

const { useState, useEffect, useMemo } = React;

// Popular language color mappings (GitHub standard)
const LANGUAGE_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Go: '#00ADD8',
  Rust: '#dea584',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Shell: '#89e051',
  Vue: '#41b883',
  R: '#198CE7',
  Lua: '#000080',
  Default: '#6366f1'
};

const getLanguageColor = (lang) => LANGUAGE_COLORS[lang] || LANGUAGE_COLORS.Default;

// Helper to format ISO dates to readable string
const formatDate = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// Helper to extract clean GitHub username from URL, @mention, or raw text
const extractUsername = (input) => {
  if (!input) return '';
  let cleaned = input.trim();
  
  // Remove leading @ if user typed @username
  if (cleaned.startsWith('@')) {
    cleaned = cleaned.substring(1);
  }
  
  // If user pasted a full GitHub URL (e.g. https://github.com/username)
  try {
    if (cleaned.includes('github.com')) {
      if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
        cleaned = 'https://' + cleaned;
      }
      const url = new URL(cleaned);
      const segments = url.pathname.split('/').filter(Boolean);
      if (segments.length > 0) {
        cleaned = segments[0];
      }
    }
  } catch (e) {
    const match = cleaned.match(/(?:github\.com\/)?([a-zA-Z0-9-_]+)/i);
    if (match && match[1]) {
      cleaned = match[1];
    }
  }
  
  // Strip any trailing slashes, queries, or hashes
  cleaned = cleaned.replace(/^\/+|\/+$/g, '').split('?')[0].split('#')[0].trim();
  return cleaned;
};

// Helper to format compact numbers (e.g., 1.2k)
const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
};

function App() {
  const [searchInput, setSearchInput] = useState('');
  const [currentUsername, setCurrentUsername] = useState('Rachit-Thakuriya077');
  const [profile, setProfile] = useState(null);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('devscope-theme') || 'dark');
  const [copied, setCopied] = useState(false);

  // Repositories filtering & sorting states
  const [repoQuery, setRepoQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [sortBy, setSortBy] = useState('stars');

  // Sync theme attribute to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('devscope-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Demo Fallback Data in case rate limit is hit
  const loadDemoData = () => {
    setError(null);
    setIsRateLimited(false);
    setProfile({
      login: 'Rachit-Thakuriya077',
      name: 'Rachit Thakuriya',
      avatar_url: 'https://avatars.githubusercontent.com/u/10000000?v=4',
      bio: 'Full Stack Web Developer & Problem Solver | Coding Ninjas 10X SRM',
      public_repos: 3,
      followers: 12,
      following: 8,
      public_gists: 2,
      company: 'SRM Institute of Science and Technology',
      location: 'Chennai, India',
      blog: 'https://rachit-thakuriya.dev',
      twitter_username: '',
      created_at: '2023-08-15T10:00:00Z',
      hireable: true,
      html_url: 'https://github.com/Rachit-Thakuriya077'
    });
    setRepos([
      {
        id: 1,
        name: 'github-profile-analyzer',
        html_url: 'https://github.com/Rachit-Thakuriya077/github-profile-analyzer',
        description: 'Interactive React dashboard to analyze GitHub profiles, language distributions, and repository metrics.',
        language: 'JavaScript',
        stargazers_count: 5,
        forks_count: 2,
        updated_at: new Date().toISOString(),
        visibility: 'public',
        topics: ['react', 'github-api', 'dashboard', 'coding-ninjas']
      },
      {
        id: 2,
        name: 'web-game-portal',
        html_url: 'https://github.com/Rachit-Thakuriya077/web-game-portal',
        description: 'Multi-game arcade portal featuring browser games built with modern JavaScript and HTML5 Canvas.',
        language: 'HTML',
        stargazers_count: 3,
        forks_count: 1,
        updated_at: '2026-09-24T12:00:00Z',
        visibility: 'public',
        topics: ['game-dev', 'javascript', 'html5-canvas']
      },
      {
        id: 3,
        name: 'smart-expense-manager',
        html_url: 'https://github.com/Rachit-Thakuriya077/smart-expense-manager',
        description: 'Budgeting and expense splitter web application with dynamic balance calculations.',
        language: 'TypeScript',
        stargazers_count: 4,
        forks_count: 0,
        updated_at: '2026-09-10T14:30:00Z',
        visibility: 'public',
        topics: ['typescript', 'react', 'finance']
      }
    ]);
  };

  // Fetch GitHub User & Repositories
  const fetchGitHubData = async (rawInput) => {
    const username = extractUsername(rawInput);
    if (!username) {
      setError('Please enter a valid GitHub username or profile URL.');
      return;
    }

    setLoading(true);
    setError(null);
    setIsRateLimited(false);
    setRepoQuery('');
    setSelectedLanguage('all');

    try {
      // 1. Fetch User Profile (Tries secure backend proxy first, falls back to direct API)
      let userRes = null;
      try {
        const proxyRes = await fetch(`/api/github?username=${encodeURIComponent(username)}`);
        if (proxyRes.ok) userRes = proxyRes;
      } catch (e) {
        // Local dev without serverless runtime
      }

      if (!userRes) {
        userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`);
      }
      
      if (userRes.status === 404) {
        throw new Error(`User "${username}" was not found on GitHub. Please check the spelling.`);
      }
      if (userRes.status === 403) {
        setIsRateLimited(true);
        throw new Error("GitHub API rate limit reached. Please wait a moment or load the demo profile below.");
      }
      if (!userRes.ok) {
        throw new Error(`Failed to load profile (Status: ${userRes.status}).`);
      }

      const userData = await userRes.json();
      setProfile(userData);

      // 2. Fetch User Repositories
      let reposRes = null;
      try {
        const proxyRepos = await fetch(`/api/github?username=${encodeURIComponent(username)}&endpoint=repos`);
        if (proxyRepos.ok) reposRes = proxyRepos;
      } catch (e) {
        // Fallback
      }

      if (!reposRes) {
        reposRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`);
      }

      if (reposRes.ok) {
        const reposData = await reposRes.json();
        setRepos(Array.isArray(reposData) ? reposData : []);
      } else {
        setRepos([]);
      }
      
      setCurrentUsername(username);
      setSearchInput(username);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred while fetching GitHub data.');
      setProfile(null);
      setRepos([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchGitHubData(currentUsername);
  }, []);

  // Handle Form Submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      fetchGitHubData(searchInput);
    }
  };

  // Quick Preset Click
  const handleQuickTagClick = (name) => {
    setSearchInput(name);
    fetchGitHubData(name);
  };

  // Copy Profile Link
  const handleCopyLink = () => {
    if (profile?.html_url) {
      navigator.clipboard.writeText(profile.html_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Derive Unique Languages from Repos
  const availableLanguages = useMemo(() => {
    const langs = new Set();
    repos.forEach(repo => {
      if (repo.language) langs.add(repo.language);
    });
    return Array.from(langs).sort();
  }, [repos]);

  // Derive Language Statistics Breakdown
  const languageStats = useMemo(() => {
    if (!repos.length) return [];
    const counts = {};
    let totalWithLanguage = 0;

    repos.forEach(repo => {
      if (repo.language) {
        counts[repo.language] = (counts[repo.language] || 0) + 1;
        totalWithLanguage++;
      }
    });

    if (totalWithLanguage === 0) return [];

    return Object.entries(counts)
      .map(([lang, count]) => ({
        name: lang,
        count,
        percentage: ((count / totalWithLanguage) * 100).toFixed(1),
        color: getLanguageColor(lang)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);
  }, [repos]);

  // Filter & Sort Repositories
  const filteredAndSortedRepos = useMemo(() => {
    return repos
      .filter(repo => {
        const matchesQuery = repo.name.toLowerCase().includes(repoQuery.toLowerCase()) ||
          (repo.description && repo.description.toLowerCase().includes(repoQuery.toLowerCase()));
        const matchesLanguage = selectedLanguage === 'all' || repo.language === selectedLanguage;
        return matchesQuery && matchesLanguage;
      })
      .sort((a, b) => {
        if (sortBy === 'stars') return b.stargazers_count - a.stargazers_count;
        if (sortBy === 'forks') return b.forks_count - a.forks_count;
        if (sortBy === 'updated') return new Date(b.updated_at) - new Date(a.updated_at);
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [repos, repoQuery, selectedLanguage, sortBy]);

  return (
    <div className="app-wrapper">
      {/* Navigation Header */}
      <header className="header-nav">
        <div className="brand">
          <div className="brand-icon">
            <i className="fa-brands fa-github"></i>
          </div>
          <div className="brand-text">
            <h1>DevScope</h1>
            <p>GitHub Profile & Repository Analyzer</p>
          </div>
        </div>

        <div className="header-actions">
          <button 
            className="theme-toggle-btn" 
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            <i className={theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon'}></i>
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </header>

      {/* Hero & Search Section */}
      <section className="hero-search-section">
        <h2 className="hero-title">
          Explore Any GitHub Developer's <span>Public Portfolio</span>
        </h2>
        <p className="hero-subtitle">
          Instantly inspect developer stats, popular repositories, tech stack distribution, and activity in one clean dashboard.
        </p>

        <div className="search-form-container">
          <form className="search-form" onSubmit={handleSearchSubmit}>
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Enter GitHub username (e.g. torvalds, gaearon, shadcn)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="GitHub username search"
              required
            />
            {searchInput && (
              <button 
                type="button" 
                className="clear-search-btn" 
                onClick={() => setSearchInput('')}
                title="Clear input"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
            <button 
              type="submit" 
              className="search-submit-btn"
              disabled={loading || !searchInput.trim()}
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin"></i>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-arrow-right"></i>
                  <span>Analyze</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Quick Click Suggestions */}
        <div className="quick-tags">
          <span className="quick-tags-label">Quick Try:</span>
          {['Rachit-Thakuriya077', 'torvalds', 'shadcn', 'gaearon', 'sindresorhus'].map(user => (
            <button 
              key={user}
              className="tag-btn"
              onClick={() => handleQuickTagClick(user)}
            >
              @{user}
            </button>
          ))}
        </div>
      </section>

      {/* Error State Banner */}
      {error && (
        <div className="error-banner">
          <i className="fa-solid fa-triangle-exclamation"></i>
          <div className="error-content" style={{ width: '100%' }}>
            <h3>Unable to fetch profile</h3>
            <p>{error}</p>
            {isRateLimited && (
              <div style={{ marginTop: '0.9rem' }}>
                <button 
                  className="search-submit-btn" 
                  style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                  onClick={loadDemoData}
                >
                  <i className="fa-solid fa-bolt"></i>
                  <span>Load Demo Profile</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="dashboard-container">
          <div className="profile-card">
            <div className="skeleton skeleton-avatar"></div>
            <div style={{ flex: 1 }}>
              <div className="skeleton skeleton-text title"></div>
              <div className="skeleton skeleton-text subtitle"></div>
              <div className="skeleton skeleton-text paragraph" style={{ marginTop: '1rem' }}></div>
            </div>
          </div>
          <div className="stats-grid">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="stat-card">
                <div className="skeleton" style={{ width: 52, height: 52, borderRadius: 12 }}></div>
                <div style={{ flex: 1 }}>
                  <div className="skeleton skeleton-text" style={{ width: '40%', height: '1.5rem' }}></div>
                  <div className="skeleton skeleton-text" style={{ width: '60%', height: '0.8rem' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Dashboard */}
      {!loading && profile && (
        <main className="dashboard-container">
          {/* Profile Overview Card */}
          <div className="profile-card">
            <div className="avatar-wrapper">
              <img 
                src={profile.avatar_url} 
                alt={`${profile.name || profile.login}'s avatar`} 
                className="profile-avatar"
                onError={(e) => {
                  e.target.src = 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png';
                }}
              />
              {profile.hireable && (
                <span className="hireable-badge">Available for hire</span>
              )}
            </div>

            <div className="profile-details">
              <div className="profile-heading">
                <div className="profile-name-group">
                  <h2>{profile.name || profile.login}</h2>
                  <div className="profile-username">@{profile.login}</div>
                </div>

                <div className="profile-cta-group">
                  <button 
                    className="btn-copy" 
                    onClick={handleCopyLink} 
                    title="Copy GitHub link to clipboard"
                  >
                    <i className={copied ? 'fa-solid fa-check' : 'fa-regular fa-copy'}></i>
                    <span>{copied ? 'Copied!' : 'Share'}</span>
                  </button>

                  <a 
                    href={profile.html_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="btn-github"
                  >
                    <i className="fa-brands fa-github"></i>
                    <span>View GitHub</span>
                  </a>
                </div>
              </div>

              {profile.bio && (
                <p className="profile-bio">{profile.bio}</p>
              )}

              {/* Profile Meta Info */}
              <div className="profile-meta-grid">
                {profile.company && (
                  <div className="meta-item">
                    <i className="fa-solid fa-building"></i>
                    <span>{profile.company}</span>
                  </div>
                )}
                {profile.location && (
                  <div className="meta-item">
                    <i className="fa-solid fa-location-dot"></i>
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.blog && (
                  <div className="meta-item">
                    <i className="fa-solid fa-link"></i>
                    <a 
                      href={profile.blog.startsWith('http') ? profile.blog : `https://${profile.blog}`} 
                      target="_blank" 
                      rel="noreferrer" 
                    >
                      {profile.blog.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                {profile.twitter_username && (
                  <div className="meta-item">
                    <i className="fa-brands fa-x-twitter"></i>
                    <a 
                      href={`https://twitter.com/${profile.twitter_username}`} 
                      target="_blank" 
                      rel="noreferrer" 
                    >
                      @{profile.twitter_username}
                    </a>
                  </div>
                )}
                <div className="meta-item">
                  <i className="fa-regular fa-calendar-days"></i>
                  <span>Joined {formatDate(profile.created_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon repos">
                <i className="fa-solid fa-book-bookmark"></i>
              </div>
              <div className="stat-info">
                <span className="stat-value">{formatNumber(profile.public_repos)}</span>
                <span className="stat-label">Public Repos</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon followers">
                <i className="fa-solid fa-users"></i>
              </div>
              <div className="stat-info">
                <span className="stat-value">{formatNumber(profile.followers)}</span>
                <span className="stat-label">Followers</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon following">
                <i className="fa-solid fa-user-plus"></i>
              </div>
              <div className="stat-info">
                <span className="stat-value">{formatNumber(profile.following)}</span>
                <span className="stat-label">Following</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon gists">
                <i className="fa-solid fa-code"></i>
              </div>
              <div className="stat-info">
                <span className="stat-value">{formatNumber(profile.public_gists)}</span>
                <span className="stat-label">Public Gists</span>
              </div>
            </div>
          </div>

          {/* Languages Breakdown */}
          {languageStats.length > 0 && (
            <div className="languages-card">
              <div className="languages-header">
                <h3 className="section-title">
                  <i className="fa-solid fa-code-branch"></i>
                  <span>Top Languages Distribution</span>
                </h3>
                <span className="repos-count-badge">
                  {languageStats.length} {languageStats.length === 1 ? 'Language' : 'Languages'} Analyzed
                </span>
              </div>

              {/* Progress Multi-Bar */}
              <div className="lang-progress-bar" title="Language distribution across public repositories">
                {languageStats.map(stat => (
                  <div 
                    key={stat.name}
                    className="lang-progress-segment"
                    style={{
                      width: `${stat.percentage}%`,
                      backgroundColor: stat.color
                    }}
                    title={`${stat.name}: ${stat.percentage}% (${stat.count} repos)`}
                  />
                ))}
              </div>

              {/* Chips */}
              <div className="lang-chips-container">
                {languageStats.map(stat => (
                  <div key={stat.name} className="lang-chip">
                    <span className="lang-dot" style={{ backgroundColor: stat.color }}></span>
                    <span className="lang-name">{stat.name}</span>
                    <span className="lang-percentage">{stat.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Repositories Section */}
          <section className="repos-section">
            {/* Filter and Search Bar */}
            <div className="repos-controls-bar">
              <div className="repos-filters-group">
                <div className="repo-search-input-wrapper">
                  <i className="fa-solid fa-magnifying-glass"></i>
                  <input 
                    type="text" 
                    className="repo-search-input" 
                    placeholder="Search repositories..."
                    value={repoQuery}
                    onChange={(e) => setRepoQuery(e.target.value)}
                    aria-label="Filter repositories by title or description"
                  />
                </div>

                <select 
                  className="filter-select"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  aria-label="Filter by programming language"
                >
                  <option value="all">All Languages</option>
                  {availableLanguages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>

                <select 
                  className="filter-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort repositories"
                >
                  <option value="stars">Sort by Stars (High to Low)</option>
                  <option value="forks">Sort by Forks (High to Low)</option>
                  <option value="updated">Recently Updated</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>

              <div className="repos-count-badge">
                Showing {filteredAndSortedRepos.length} of {repos.length} repos
              </div>
            </div>

            {/* Repos Grid */}
            {filteredAndSortedRepos.length > 0 ? (
              <div className="repos-grid">
                {filteredAndSortedRepos.map(repo => (
                  <article key={repo.id} className="repo-card">
                    <div>
                      <div className="repo-header">
                        <a 
                          href={repo.html_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="repo-name-link"
                        >
                          <i className="fa-regular fa-folder-closed"></i>
                          <span>{repo.name}</span>
                        </a>
                        <span className="repo-badge-visibility">
                          {repo.visibility || (repo.private ? 'Private' : 'Public')}
                        </span>
                      </div>

                      <p className="repo-description">
                        {repo.description || 'No description provided.'}
                      </p>

                      {repo.topics && repo.topics.length > 0 && (
                        <div className="repo-topics">
                          {repo.topics.slice(0, 3).map(topic => (
                            <span key={topic} className="topic-tag">#{topic}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="repo-footer">
                      <div className="repo-lang-meta">
                        {repo.language ? (
                          <>
                            <span 
                              className="lang-dot" 
                              style={{ backgroundColor: getLanguageColor(repo.language) }}
                            ></span>
                            <span>{repo.language}</span>
                          </>
                        ) : (
                          <span>Plain text</span>
                        )}
                      </div>

                      <div className="repo-stats-meta">
                        <span className="repo-stat-item" title="Stars">
                          <i className="fa-regular fa-star"></i>
                          <span>{formatNumber(repo.stargazers_count)}</span>
                        </span>
                        <span className="repo-stat-item" title="Forks">
                          <i className="fa-solid fa-code-fork"></i>
                          <span>{formatNumber(repo.forks_count)}</span>
                        </span>
                        <span className="repo-stat-item" title="Updated Date">
                          <i className="fa-regular fa-clock"></i>
                          <span>{formatDate(repo.updated_at)}</span>
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <i className="fa-solid fa-code-commit"></i>
                <h3>No repositories match your criteria</h3>
                <p>Try clearing your search query or selecting "All Languages".</p>
              </div>
            )}
          </section>
        </main>
      )}

      {/* Footer */}
      <footer className="app-footer">
        <div>
          DevScope &bull; Coding Ninjas 10X SRM Web Dev Task &bull; Second Year
        </div>
        <div className="footer-tags">
          <span className="footer-tag">React 18</span>
          <span className="footer-tag">GitHub REST API</span>
          <span className="footer-tag">Responsive UI</span>
          <span className="footer-tag">Zero Config</span>
        </div>
      </footer>
    </div>
  );
}

// Mount the React Application
const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);

