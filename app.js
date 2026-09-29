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
  
  if (cleaned.startsWith('@')) {
    cleaned = cleaned.substring(1);
  }
  
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
      setError(err.message || 'An unexpected error occurred while fetching profile.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchGitHubData(currentUsername);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      fetchGitHubData(searchInput);
    }
  };

  const handleQuickTagClick = (tagUser) => {
    setSearchInput(tagUser);
    fetchGitHubData(tagUser);
  };

  const handleCopyProfileUrl = () => {
    if (profile && profile.html_url) {
      navigator.clipboard.writeText(profile.html_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Calculate Languages & Metrics
  const languageStats = useMemo(() => {
    const counts = {};
    let totalKnownRepos = 0;

    repos.forEach(repo => {
      if (repo.language) {
        counts[repo.language] = (counts[repo.language] || 0) + 1;
        totalKnownRepos += 1;
      }
    });

    if (totalKnownRepos === 0) return [];

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: ((count / totalKnownRepos) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count);
  }, [repos]);

  // Aggregate Total Stars and Forks across repositories
  const totalStars = useMemo(() => {
    return repos.reduce((acc, repo) => acc + (repo.stargazers_count || 0), 0);
  }, [repos]);

  const totalForks = useMemo(() => {
    return repos.reduce((acc, repo) => acc + (repo.forks_count || 0), 0);
  }, [repos]);

  // Filtered & Sorted Repositories
  const filteredRepos = useMemo(() => {
    return repos
      .filter(repo => {
        const matchesQuery = repo.name.toLowerCase().includes(repoQuery.toLowerCase()) ||
          (repo.description && repo.description.toLowerCase().includes(repoQuery.toLowerCase()));
        const matchesLang = selectedLanguage === 'all' || repo.language === selectedLanguage;
        return matchesQuery && matchesLang;
      })
      .sort((a, b) => {
        if (sortBy === 'stars') return (b.stargazers_count || 0) - (a.stargazers_count || 0);
        if (sortBy === 'forks') return (b.forks_count || 0) - (a.forks_count || 0);
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return new Date(b.updated_at) - new Date(a.updated_at);
      });
  }, [repos, repoQuery, selectedLanguage, sortBy]);

  // Unique languages for dropdown filter
  const availableLanguages = useMemo(() => {
    const langs = new Set();
    repos.forEach(r => {
      if (r.language) langs.add(r.language);
    });
    return Array.from(langs).sort();
  }, [repos]);

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

      {/* Error / Rate Limit Alert */}
      {error && (
        <div className="dashboard-container" style={{ paddingBottom: '1rem' }}>
          <div className="error-banner">
            <i className="fa-solid fa-triangle-exclamation"></i>
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
              />
              {profile.hireable && (
                <span className="hireable-badge" title="Open to Work">
                  <i className="fa-solid fa-briefcase"></i> Open to Work
                </span>
              )}
            </div>

            <div className="profile-details">
              <div className="profile-header-row">
                <div>
                  <h2 className="profile-name">{profile.name || profile.login}</h2>
                  <span className="profile-login">@{profile.login}</span>
                </div>
                <div className="profile-actions">
                  <button 
                    className="copy-btn" 
                    onClick={handleCopyProfileUrl}
                    title="Copy Profile URL"
                  >
                    <i className={copied ? "fa-solid fa-check" : "fa-regular fa-copy"}></i>
                    <span>{copied ? 'Copied!' : 'Share'}</span>
                  </button>
                  <a 
                    href={profile.html_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="view-github-btn"
                  >
                    <span>View on GitHub</span>
                    <i className="fa-solid fa-arrow-up-right-from-square"></i>
                  </a>
                </div>
              </div>

              {profile.bio && (
                <p className="profile-bio">{profile.bio}</p>
              )}

              {/* Profile Metadata */}
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

          {/* Quick Stats Grid */}
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
              <div className="stat-icon stars">
                <i className="fa-solid fa-star"></i>
              </div>
              <div className="stat-info">
                <span className="stat-value">{formatNumber(totalStars)}</span>
                <span className="stat-label">Total Stars</span>
              </div>
            </div>
          </div>

          {/* Language Breakdown Section */}
          <section className="section-card language-section">
            <div className="section-header">
              <h3 className="section-title">
                <i className="fa-solid fa-chart-pie"></i>
                <span>Language & Technology Breakdown</span>
              </h3>
              <span className="stats-badge">{languageStats.length} Languages Detected</span>
            </div>

            {languageStats.length === 0 ? (
              <p className="empty-subtext">No public repository language data detected.</p>
            ) : (
              <>
                {/* Multi-segmented Progress Bar */}
                <div className="lang-bar-container">
                  {languageStats.map(item => (
                    <div 
                      key={item.name}
                      className="lang-bar-segment"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: getLanguageColor(item.name)
                      }}
                      title={`${item.name}: ${item.percentage}% (${item.count} repos)`}
                    />
                  ))}
                </div>

                {/* Language Legend Pills */}
                <div className="lang-legend-grid">
                  {languageStats.map(item => (
                    <div key={item.name} className="lang-legend-item">
                      <span 
                        className="lang-indicator-dot"
                        style={{ backgroundColor: getLanguageColor(item.name) }}
                      />
                      <span className="lang-name">{item.name}</span>
                      <span className="lang-percent">{item.percentage}%</span>
                      <span className="lang-count">({item.count} {item.count === 1 ? 'repo' : 'repos'})</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* Repositories Section */}
          <section className="section-card">
            <div className="repos-header">
              <div className="repos-title-group">
                <h3 className="section-title">
                  <i className="fa-solid fa-folder-tree"></i>
                  <span>Public Repositories</span>
                </h3>
                <span className="repos-count-badge">
                  Showing {filteredRepos.length} of {repos.length}
                </span>
              </div>

              {/* Repos Controls: Search, Language Filter, Sort */}
              <div className="repos-controls">
                <div className="repo-search-wrapper">
                  <i className="fa-solid fa-magnifying-glass"></i>
                  <input 
                    type="text" 
                    placeholder="Filter repositories..." 
                    className="repo-search-input"
                    value={repoQuery}
                    onChange={(e) => setRepoQuery(e.target.value)}
                  />
                  {repoQuery && (
                    <button 
                      className="clear-search-btn" 
                      onClick={() => setRepoQuery('')}
                      style={{ right: 8, top: '50%', transform: 'translateY(-50%)' }}
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  )}
                </div>

                <select 
                  className="control-select"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  aria-label="Filter by language"
                >
                  <option value="all">All Languages</option>
                  {availableLanguages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>

                <select 
                  className="control-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort repositories"
                >
                  <option value="stars">Most Stars</option>
                  <option value="forks">Most Forks</option>
                  <option value="updated">Recently Updated</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Repositories List Grid */}
            {filteredRepos.length === 0 ? (
              <div className="empty-repos-state">
                <i className="fa-solid fa-box-open"></i>
                <p>No repositories match your selected filters.</p>
                {(repoQuery || selectedLanguage !== 'all') && (
                  <button 
                    className="reset-filters-btn"
                    onClick={() => {
                      setRepoQuery('');
                      setSelectedLanguage('all');
                    }}
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="repos-grid">
                {filteredRepos.map(repo => (
                  <div key={repo.id} className="repo-card">
                    <div className="repo-card-top">
                      <div className="repo-card-name-row">
                        <i className="fa-regular fa-folder-closed repo-icon"></i>
                        <a 
                          href={repo.html_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="repo-title-link"
                        >
                          {repo.name}
                        </a>
                      </div>
                      <span className="repo-visibility-pill">{repo.visibility || 'public'}</span>
                    </div>

                    <p className="repo-desc">
                      {repo.description || 'No description provided for this repository.'}
                    </p>

                    {/* Topics */}
                    {repo.topics && repo.topics.length > 0 && (
                      <div className="repo-topics-list">
                        {repo.topics.slice(0, 4).map(topic => (
                          <span key={topic} className="topic-tag">{topic}</span>
                        ))}
                        {repo.topics.length > 4 && (
                          <span className="topic-tag more">+{repo.topics.length - 4}</span>
                        )}
                      </div>
                    )}

                    {/* Card Footer */}
                    <div className="repo-card-footer">
                      <div className="repo-footer-left">
                        {repo.language && (
                          <span className="repo-lang">
                            <span 
                              className="lang-indicator-dot"
                              style={{ backgroundColor: getLanguageColor(repo.language) }}
                            />
                            {repo.language}
                          </span>
                        )}

                        <span className="repo-metric" title="Stars">
                          <i className="fa-regular fa-star"></i>
                          {formatNumber(repo.stargazers_count)}
                        </span>

                        <span className="repo-metric" title="Forks">
                          <i className="fa-solid fa-code-fork"></i>
                          {formatNumber(repo.forks_count)}
                        </span>
                      </div>

                      <span className="repo-updated">
                        Updated {formatDate(repo.updated_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      )}

      {/* Footer */}
      <footer className="footer-nav">
        <p>
          DevScope — Built for <strong>Coding Ninjas 10X SRM Club Recruitment</strong>
        </p>
        <p className="footer-subtext">
          Powered by GitHub REST API v3 • React 18
        </p>
      </footer>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

