# EduTube Module — Learning Persistence & Personal Learning System (Phase 3B)

## Overview

**EduTube** is an educational video discovery and personal learning layer for Smart Skill Hub.
- Videos remain embedded YouTube players (`https://www.youtube-nocookie.com/embed/<videoId>`).
- No videos are downloaded, proxied, stored, or re-hosted.
- Complete authenticated learning persistence system isolated by `req.user._id`.

---

## 1. Architecture & Persistence Flow

```
Client Request (Bearer Firebase Token)
    ↓
Auth Middleware (verifyFirebaseToken → req.user._id)
    ↓
EduTube Router (Rate limiting on public search + Auth on persistence)
    ↓
EduTube Controller (Parameter validation & sanitization)
    ↓
EduTube Persistence Service
    ├── EduTubeWatchHistory (Unique (owner, videoId), sorted by watchedAt)
    ├── EduTubeProgress (Exact timestamp milestone & auto-completion)
    ├── EduTubeSavedVideo (Bookmarks per user)
    ├── EduTubePlaylist (Custom tracks & derived deterministic progress)
    └── EduTubeVideoNote (Timestamped personal notes)
    ↓
Client API Response (ApiResponse envelope)
```

---

## 2. API Endpoints

### A. Video Discovery (Phase 2)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/v1/edutube/search?q=...` | Educational video search with ranking | Public / Rate Limited |
| `GET` | `/api/v1/edutube/video/:videoId` | Normalized video metadata & embed verification | Public / Rate Limited |

### B. Watch History (Phase 3B)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/v1/edutube/history` | Record or update watch history item | Required |
| `GET` | `/api/v1/edutube/history?page=1&limit=20` | Paginated watch history sorted newest first | Required |
| `DELETE` | `/api/v1/edutube/history/:videoId` | Delete specific history item | Required |
| `DELETE` | `/api/v1/edutube/history` | Clear user's entire watch history | Required |

### C. Playback Progress & Continue Learning (Phase 3B)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `PUT` | `/api/v1/edutube/progress/:videoId` | Save throttled playback milestone (`positionSeconds`, `durationSeconds`, `completed`) | Required |
| `GET` | `/api/v1/edutube/progress/:videoId` | Fetch playback position & completion percentage | Required |
| `GET` | `/api/v1/edutube/continue-learning?limit=10` | Fetch active in-progress lessons (excludes completed) | Required |

### D. Saved Videos / Bookmarks (Phase 3B)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/v1/edutube/saved` | Bookmark a video | Required |
| `GET` | `/api/v1/edutube/saved?page=1&limit=50` | Get saved video bookmarks | Required |
| `DELETE` | `/api/v1/edutube/saved/:videoId` | Remove video from saved bookmarks | Required |
| `GET` | `/api/v1/edutube/saved/:videoId` | Check if video is saved (`{ isSaved: boolean }`) | Required |

### E. Custom Playlists (Phase 3B)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/v1/edutube/playlists` | Create custom playlist | Required |
| `GET` | `/api/v1/edutube/playlists` | List user's playlists with derived progress | Required |
| `GET` | `/api/v1/edutube/playlists/:playlistId` | Get playlist details and lesson list with completion status | Required |
| `PATCH` | `/api/v1/edutube/playlists/:playlistId` | Update playlist name or description | Required |
| `DELETE` | `/api/v1/edutube/playlists/:playlistId` | Delete playlist | Required |
| `POST` | `/api/v1/edutube/playlists/:playlistId/videos` | Add video to playlist (rejects duplicates with 409) | Required |
| `DELETE` | `/api/v1/edutube/playlists/:playlistId/videos/:videoId` | Remove video from playlist | Required |
| `PATCH` | `/api/v1/edutube/playlists/:playlistId/videos/reorder` | Reorder playlist video sequence | Required |

### F. Video Notes (Phase 3B)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/v1/edutube/videos/:videoId/notes` | Create timestamped note | Required |
| `GET` | `/api/v1/edutube/videos/:videoId/notes` | List notes sorted by timestamp | Required |
| `PATCH` | `/api/v1/edutube/notes/:noteId` | Update note content or timestamp | Required |
| `DELETE` | `/api/v1/edutube/notes/:noteId` | Delete note | Required |

### G. Learning Stats (Phase 3B)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/v1/edutube/stats` | Aggregated counts (`videosWatched`, `completedVideos`, `activePlaylists`, `savedVideos`) | Required |

---

## 3. Frontend Routes & Pages

- `/dashboard/edutube`: Learning Dashboard (Search, Stats, Continue Learning, Recommended Lessons)
- `/dashboard/edutube/watch/:videoId`: Video Player with exact resume prompt, live throttled progress saving, interactive notes, bookmarking, and playlist picker
- `/dashboard/edutube/history`: Watch History grouped by Today, Yesterday, and Older with single-item deletion and Clear All confirmation
- `/dashboard/edutube/saved`: Saved Bookmarks grid with search filter
- `/dashboard/edutube/playlists`: My Learning Playlists with completion progress bars
- `/dashboard/edutube/playlists/:playlistId`: Playlist track detail with reordering and lesson completion checkmarks

---

## 4. Security & Isolation Guarantee

- Ownership is strictly derived from verified Firebase JWT token (`req.user._id`).
- No client-supplied user or owner IDs are trusted.
- Cross-user document mutations and reads are strictly forbidden.
- Zero YouTube API keys or credentials exposed in frontend code or client requests.
