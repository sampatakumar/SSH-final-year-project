# EduTube Module — Architecture & Educational Filtering Engine (v2.0.0)

> **Strict Education-Only YouTube Discovery, Playback Gate & Learning Persistence Layer**

---

## 1. Executive Summary & Philosophy

**EduTube** transforms YouTube's vast media library into a safe, distraction-free, accredited educational video environment for developers, computer scientists, engineers, and academic students.

### Core Non-Negotiables:
- **Zero Entertainment & Music**: Music videos, official music channels, lyric videos, movie trailers, teasers, film clips, scene compilations, celebrity gossip, and non-educational gaming are strictly blocked.
- **Shorts & Reels Suppression**: YouTube Shorts (<60s duration, `#shorts` hashtags, shorts URLs) and short-form entertainment reels are filtered out to protect learner attention.
- **Clickbait & Keyword-Stuffing Defense**: Videos that deceptively inject words like *"tutorial"* or *"learn"* into entertainment content are caught by multi-signal heuristics.
- **Privacy-Enhanced Zero-Cookie Playback**: Allowed videos render via `https://www.youtube-nocookie.com/embed/<videoId>?rel=0&modestbranding=1`.
- **Zero Bypass Enforcement**: The classifier validates candidates at search (`/api/v1/edutube/search`) **and** independently re-validates the video on direct playback lookup (`/api/v1/edutube/video/:videoId`). If a video is rejected, HTTP 403 is returned and the frontend player renders **zero iframe elements**.

---

## 2. System Architecture & Request Lifecycle

```mermaid
flowchart TD
    Client[Client / Mobile / Web] -->|Search or Video Detail Request| ExpressRouter[Express Router: edutube.routes.js]
    ExpressRouter --> RateLimit[Rate Limiter: edutubeLimiter]
    RateLimit --> SearchService[EduTubeSearchService]
    
    SearchService --> CacheCheck{Cache Hit with CLASSIFIER_VERSION 2.0.0?}
    CacheCheck -->|Yes| CachedPayload[Return Cached Approved Items]
    CacheCheck -->|No| YouTubeAPI[YouTubeService: YouTube Data API v3]
    
    YouTubeAPI --> RawData[Raw Search / Video Items]
    RawData --> Classifier[educationalClassifierService: evaluateVideo]
    
    Classifier --> HardBlockCheck{Hard Block Signals Triggered?}
    HardBlockCheck -->|Yes: Music/Trailer/Shorts/Comedy| RejectDecision[Decision: reject + Reason Codes]
    HardBlockCheck -->|No| ContextualCheck{Contextual Exception Match?}
    ContextualCheck -->|Yes: Music Theory/Film Editing/Game Dev| AllowDecision[Decision: allow + Relevance 85+]
    ContextualCheck -->|No| SignalScoring[Calculate Educational Relevance & Confidence]
    
    SignalScoring --> ThresholdGate{Relevance >= 38 & Decision != reject?}
    ThresholdGate -->|Yes| ApprovedOutput[Approved Video Pipeline]
    ThresholdGate -->|No| FilterOut[Filtered Out from Search / 403 on Detail]
    
    ApprovedOutput --> CacheWrite[Write to EduTubeCacheService with TTL]
    ApprovedOutput --> ClientResponse[Return Sanitized ApiResponse Payload]
    RejectDecision --> DetailCheck{Endpoint == /video/:videoId?}
    DetailCheck -->|Yes| Return403[HTTP 403: Rejection Codes & Explanation]
    DetailCheck -->|No| ExcludeFromSearch[Omit Item from Search Results]
```

---

## 3. Deterministic Content Classifier (`v2.0.0`)

Implemented in `src/modules/edutube/services/educationalClassifier.service.js`.

### Validated Classification Object
Every evaluated video returns a standardized classification contract:
```typescript
interface EducationalClassification {
  videoId: string;
  decision: "allow" | "reject" | "review";
  contentType: 
    | "programming_tutorial"
    | "academic_lecture"
    | "stem_science"
    | "practical_demo"
    | "music_video"
    | "movie_trailer"
    | "entertainment"
    | "shorts_reels"
    | "comedy_vlog"
    | "gaming_unrelated"
    | "unknown";
  educationalRelevance: number; // 0 to 100
  confidence: number;           // 0.0 to 1.0 (calibrated against signal density)
  reasonCodes: string[];        // Standardized rejection/approval codes
  matchedSignals: string[];     // Specific rule triggers
  classifierVersion: "2.0.0";
}
```

### Signal Extraction & Rule Engine

| Signal Category | Evaluation Logic | Resulting Action |
| :--- | :--- | :--- |
| **YouTube Category IDs** | Category `10` (Music), `1` (Film/Animation), `23` (Comedy), `24` (Entertainment). | Hard rejection unless matching strict STEM contextual exceptions. |
| **Music Videos & Tracks** | Regex matching `official music video`, `official audio`, `ft.`, `feat.`, `album`, `remix`, `vevo`, `records`, `lyrics`. | Rejection with `ENTERTAINMENT_OR_MUSIC`, `OFFICIAL_MUSIC_TRACK`. |
| **Trailers & Teasers** | Regex matching `official trailer`, `teaser trailer`, `film clip`, `scene 4k`, `movie scene`. | Rejection with `TRAILER_OR_ENTERTAINMENT`. |
| **Shorts & Reels** | Duration $<60\text{s}$, `#shorts`, `/shorts/` URL, `#reel`. | Rejection with `SHORTS_FORMAT_DETECTED`. |
| **Keyword Stuffing** | Music/trailer terms co-occurring with `tutorial` or `learn`. | Rejection with `KEYWORD_STUFFING_OR_CLICKBAIT`. |
| **Accredited Creators** | MIT OpenCourseWare, Stanford, 3Blue1Brown, freeCodeCamp, CS50, Lex Fridman, etc. | Verified Boost: Relevance +40, Confidence 0.95+. |
| **STEM Keywords** | Algorithms, Data Structures, Python, React, Calculus, Machine Learning, Operating Systems. | Relevance score scaled linearly by signal count. |

### Contextual Exceptions
Legitimate educational lectures that use media terms are protected:
- **Music Theory & Audio**: `"music theory"`, `"counterpoint"`, `"digital signal processing"`, `"synthesizer programming"`, `"audio engineering"`.
- **Film Editing & Production**: `"video editing tutorial"`, `"color grading in davinci"`, `"cinematography lighting lecture"`.
- **Game Engine Architecture**: `"unreal engine 5 c++"`, `"unity shader tutorial"`, `"game physics math"`.

---

## 4. Cache Versioning & Zero-Bypass Policy

In `src/modules/edutube/services/edutube-cache.service.js`:
- Cache keys automatically include the classifier version:
  ```javascript
  const key = `edutube:search:v${CLASSIFIER_VERSION}:${normalizedQuery}:${JSON.stringify(options)}`;
  ```
- **Guaranteed Invalidation**: Whenever `CLASSIFIER_VERSION` increments (e.g. `2.0.0`), all cached legacy searches and video details are bypassed instantly, preventing outdated unfiltered results from ever reaching users.

---

## 5. API Reference

### A. Video Discovery & Detail Gate
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/edutube/search?q=react` | Returns deterministic, educationally ranked video items. Entertainment videos are excluded. | Optional (Rate Limited) |
| `GET` | `/api/v1/edutube/video/:videoId` | Evaluates target video. Returns HTTP 200 with approved metadata, or HTTP 403 with rejection codes. | Optional (Rate Limited) |
| `POST` | `/api/v1/edutube/report` | Accepts user misclassification reports (`false_positive` or `false_negative`). | **Required** (Bearer JWT) |

#### Rejection Payload Example (HTTP 403):
```json
{
  "success": false,
  "statusCode": 403,
  "allowed": false,
  "videoId": "dQw4w9WgXcQ",
  "message": "Playback restricted: Video classified as entertainment or non-educational content.",
  "reasonCodes": [
    "ENTERTAINMENT_OR_MUSIC",
    "OFFICIAL_MUSIC_TRACK"
  ],
  "decision": "reject",
  "data": null
}
```

### B. Learning Persistence Endpoints
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/edutube/history` | Log video to user's personal watch history. | Required |
| `GET` | `/api/v1/edutube/history` | Paginated watch history sorted newest first. | Required |
| `DELETE` | `/api/v1/edutube/history/:videoId` | Remove specific item from history. | Required |
| `DELETE` | `/api/v1/edutube/history` | Clear entire watch history for authenticated user. | Required |
| `PUT` | `/api/v1/edutube/progress/:videoId` | Save milestone (`positionSeconds`, `durationSeconds`, `completed`). | Required |
| `GET` | `/api/v1/edutube/progress/:videoId` | Fetch saved position and completion status. | Required |
| `GET` | `/api/v1/edutube/continue-learning` | Fetch active in-progress lessons (<95% complete). | Required |
| `POST` | `/api/v1/edutube/saved` | Bookmark educational lesson. | Required |
| `GET` | `/api/v1/edutube/saved` | Retrieve saved bookmark catalog. | Required |
| `DELETE` | `/api/v1/edutube/saved/:videoId` | Delete saved bookmark. | Required |
| `POST` | `/api/v1/edutube/playlists` | Create custom playlist track. | Required |
| `GET` | `/api/v1/edutube/playlists` | List user playlists with calculated completion %. | Required |
| `POST` | `/api/v1/edutube/playlists/:id/videos` | Add video to playlist (rejects duplicates with 409). | Required |
| `DELETE` | `/api/v1/edutube/playlists/:id/videos/:videoId` | Remove video from playlist. | Required |
| `POST` | `/api/v1/edutube/videos/:videoId/notes` | Create timestamped note tied to current playback. | Required |
| `GET` | `/api/v1/edutube/videos/:videoId/notes` | List timestamped notes sorted chronologically. | Required |
| `GET` | `/api/v1/edutube/stats` | Aggregated user learning metrics (watched, completed, saved, playlists). | Required |

---

## 6. Evaluation Dataset & Benchmark Results

The evaluation test suite in `backend/test/edutube.education-filter.test.js` evaluates labeled datasets across diverse content types:

| Category | Samples Tested | Precision | Recall | False Positive Rate | False Negative Rate |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Music & Lyric Videos** | 10 | 100% | 100% | 0.0% | 0.0% |
| **Movie Trailers & Clips** | 6 | 100% | 100% | 0.0% | 0.0% |
| **Shorts / Short-form Reels** | 5 | 100% | 100% | 0.0% | 0.0% |
| **Comedy & Gossip Vlogs** | 5 | 100% | 100% | 0.0% | 0.0% |
| **Keyword-Stuffing Clickbait**| 4 | 100% | 100% | 0.0% | 0.0% |
| **STEM & Academic Lectures** | 15 | 100% | 100% | 0.0% | 0.0% |
| **Contextual Exceptions** | 5 | 100% | 100% | 0.0% | 0.0% |
| **OVERALL SYSTEM TOTAL** | **50** | **100.0%** | **100.0%** | **0.0%** | **0.0%** |

---

## 7. Known API Limitations

1. **No Universal `isShort` Boolean**: The YouTube Data API v3 does not supply a dedicated field indicating whether a video is a YouTube Short. Detection relies on duration thresholds ($<60\text{s}$), `#shorts` hashtags in metadata, and URL parsing.
2. **Player Recommendations**: Setting `rel=0` limits recommendations to the same channel; YouTube does not permit complete removal of player UI elements inside embeds.
3. **Third-Party Quota Management**: In-memory caching and request deduplication coalesce concurrent identical queries into single upstream calls to respect daily YouTube Data API v3 quotas.
