# 🚀 DevScope — GitHub Profile & Repository Analyzer

> Built for the **Coding Ninjas 10X SRM Web Dev Recruitment Tasks (Second Year - Task 1)**.

DevScope is a sleek, modern, interactive developer dashboard built with **React 18** and **GitHub REST API**. It allows recruiters and developers to search for any GitHub username to instantly visualize profile details, repository metrics, star counts, programming language distribution, and direct links.

---

## ✨ Features Implemented

- **🔍 Search & Fetch:** Live search by any GitHub username with input validation and quick-search presets (`gaearon`, `torvalds`, `shadcn`, `sindresorhus`, `yyx990803`).
- **👤 Complete Developer Profile:**
  - Avatar, full name, username, bio, and "Available for hire" status.
  - Profile metadata: company, location, personal website/blog, Twitter/X handle, and joined date.
  - Interactive "Share / Copy Link" and "View on GitHub" buttons.
- **📊 Key Stats Overview:**
  - Public Repositories count.
  - Followers & Following counts.
  - Public Gists count.
- **📈 Top Languages Distribution Visualizer:**
  - Aggregates languages across all public repositories.
  - Custom multi-segment visual progress bar with GitHub-standard colors.
  - Percentage chips and language count.
- **📁 Repositories Explorer:**
  - Real-time instant search by repository name or description.
  - Filter repositories by programming language dropdown.
  - Sort repositories by: **Most Stars**, **Most Forks**, **Recently Updated**, or **Alphabetical (A-Z)**.
  - Repository cards with visibility badge, description, topic tags, stars, forks, and updated date.
- **🛡️ Robust Error Handling:**
  - Graceful handling of invalid usernames (404 Not Found).
  - Friendly alert when hitting GitHub's unauthenticated API rate limits (403).
  - Network failure handling.
- **🎨 Modern Aesthetic Design:**
  - Dark mode by default with a seamless **Light / Dark Mode Toggle** (persisted in `localStorage`).
  - Glassmorphic card design with backdrop blur and glowing gradient accents.
  - Skeleton shimmer loaders during API fetching.
  - Fully responsive on mobile, tablet, and widescreen desktops.

---

## 🛠️ Tech Stack

- **Frontend:** React 18 (Hooks: `useState`, `useEffect`, `useMemo`)
- **Styling:** Modern Vanilla CSS (Custom properties/tokens, Flexbox, CSS Grid, Glassmorphism)
- **API:** GitHub Public REST API (`https://api.github.com/users/{username}`)
- **Icons & Fonts:** FontAwesome 6, Google Fonts (`Outfit`, `JetBrains Mono`)

---

