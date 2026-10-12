/**
 * EduTube Deterministic Educational Content Classifier Service
 * Version: 2.0.0
 *
 * Enforces strict, education-only YouTube discovery and playback.
 * Eliminates music videos, movies, film clips, trailers, YouTube Shorts,
 * comedy, celebrity gossip, entertainment vlogs, and keyword-stuffing clickbait.
 *
 * Supported decisions: 'allow', 'reject', 'review'
 */

export const CLASSIFIER_VERSION = "2.0.0";

export const CLASSIFIER_REASON_CODES = {
  // Hard Block Reasons
  HARD_BLOCK_MUSIC: "HARD_BLOCK_MUSIC",
  HARD_BLOCK_MUSIC_CHANNEL: "HARD_BLOCK_MUSIC_CHANNEL",
  HARD_BLOCK_MOVIE_TRAILER: "HARD_BLOCK_MOVIE_TRAILER",
  HARD_BLOCK_FILM_CLIP: "HARD_BLOCK_FILM_CLIP",
  HARD_BLOCK_COMEDY: "HARD_BLOCK_COMEDY",
  HARD_BLOCK_PRANK_VLOG: "HARD_BLOCK_PRANK_VLOG",
  HARD_BLOCK_UNRELATED_GAMING: "HARD_BLOCK_UNRELATED_GAMING",
  HARD_BLOCK_CELEBRITY_GOSSIP: "HARD_BLOCK_CELEBRITY_GOSSIP",
  HARD_BLOCK_SHORTS: "HARD_BLOCK_SHORTS",
  HARD_BLOCK_DURATION_BELOW_MINIMUM: "HARD_BLOCK_DURATION_BELOW_MINIMUM",
  HARD_BLOCK_UNVERIFIED_DURATION: "HARD_BLOCK_UNVERIFIED_DURATION",
  HARD_BLOCK_NON_EMBEDDABLE: "HARD_BLOCK_NON_EMBEDDABLE",
  HARD_BLOCK_KEYWORD_MISUSE: "HARD_BLOCK_KEYWORD_MISUSE",
  HARD_BLOCK_CONFLICTING_SIGNALS: "HARD_BLOCK_CONFLICTING_SIGNALS",

  // Positive Educational Signals
  EDUCATIONAL_CATEGORY_CONFIRMED: "EDUCATIONAL_CATEGORY_CONFIRMED",
  PROVEN_EDUCATIONAL_CHANNEL: "PROVEN_EDUCATIONAL_CHANNEL",
  STRUCTURED_COURSE_SYLLABUS: "STRUCTURED_COURSE_SYLLABUS",
  ACADEMIC_LECTURE_FORMAT: "ACADEMIC_LECTURE_FORMAT",
  PRACTICAL_DEMO_CODE: "PRACTICAL_DEMO_CODE",
  EXAM_CERTIFICATION_PREP: "EXAM_CERTIFICATION_PREP",
  CONTEXTUAL_EXCEPTION_APPROVED: "CONTEXTUAL_EXCEPTION_APPROVED",

  // Review / Ambiguity Signals
  INSUFFICIENT_EVIDENCE: "INSUFFICIENT_EVIDENCE",
  BORDERLINE_CONFIDENCE: "BORDERLINE_CONFIDENCE",
};

// YouTube Category ID Constants
export const YOUTUBE_CATEGORIES = {
  FILM_ANIMATION: "1",
  AUTOS_VEHICLES: "2",
  MUSIC: "10",
  PETS_ANIMALS: "15",
  SPORTS: "17",
  SHORT_MOVIES: "18",
  TRAVEL_EVENTS: "19",
  GAMING: "20",
  VIDEBLOGGING: "21",
  PEOPLE_BLOGS: "22",
  COMEDY: "23",
  ENTERTAINMENT: "24",
  NEWS_POLITICS: "25",
  HOWTO_STYLE: "26",
  EDUCATION: "27",
  SCIENCE_TECH: "28",
  NONPROFITS: "29",
  MOVIES: "30",
  ANIME_ANIMATION: "31",
  ACTION_ADVENTURE: "32",
  CLASSICS: "33",
  COMEDY_MOVIES: "34",
  DOCUMENTARY: "35",
  DRAMA: "36",
  FAMILY: "37",
  FOREIGN: "38",
  HORROR: "39",
  SCI_FI_FANTASY: "40",
  THRILLER: "41",
  SHORTS: "42",
  SHOWS: "43",
  TRAILERS: "44",
};

// Hard Entertainment & Music Patterns
const HARD_MUSIC_PATTERNS = [
  /\bofficial (music )?video\b/i,
  /\bofficial audio\b/i,
  /\bofficial lyric video\b/i,
  /\blyric video\b/i,
  /\b(full )?album (stream|tracklist)?\b/i,
  /\bmusic performance\b/i,
  /\blive at (wembley|coachella|glastonbury|stadium|arena)\b/i,
  /\b(remix|acoustic version|slowed \+ reverb|bass boosted)\b/i,
  /\bft\.|\bfeat\.|\bfeaturing\b/i,
  /\bprod\. by\b/i,
  /\b(original soundtrack|official ost)\b/i,
  /\b(karaoke version|instrumental version)\b/i,
  /\bmusic video\b/i,
];

const HARD_MOVIE_PATTERNS = [
  /\b(official )?(teaser|trailer|main trailer|teaser trailer|final trailer)\b/i,
  /\b(movie clip|film clip|deleted scene|post credit scene)\b/i,
  /\bfull movie\b/i,
  /\bscene (4k|hd|1080p)\b/i,
  /\baction scene\b/i,
  /\bclimax scene\b/i,
  /\bmovie review & spoilers\b/i,
];

const HARD_COMEDY_VLOG_PATTERNS = [
  /\bprank(s|ing)?\b/i,
  /\bcelebrity gossip\b/i,
  /\btik\s*tok compilation\b/i,
  /\bmeme compilation\b/i,
  /\bfunny moments\b/i,
  /\b(reacting to|reaction video)\b/i,
  /\b(daily vlog|vlog\s*#?\d+)\b/i,
  /\bchallenge episode\b/i,
  /\btry not to laugh\b/i,
  /\bparody\b/i,
  /\bgone wrong\b/i,
];

const HARD_GAMING_PATTERNS = [
  /\bgameplay walkthrough\b/i,
  /\blet's play\b/i,
  /\bgameplay part\s*\d+\b/i,
  /\besports highlights\b/i,
  /\bgaming montage\b/i,
  /\bspeedrun (wr|record)\b/i,
  /\bno commentary gameplay\b/i,
];

// Blocked Entertainment / Music Channels
const HARD_ENTERTAINMENT_CHANNELS = [
  "vevo",
  "- topic",
  "official music",
  "records",
  "t-series",
  "sony music",
  "warner music",
  "universal music",
  "atlantic records",
  "spinnin' records",
  "def jam",
  "interscope",
  "rhino",
  "sub pop",
  "movieclips",
  "rotten tomatoes trailers",
  "ign",
  "gamespot",
  "machinima",
  "watchmojo",
  "buzzfeed",
  "complex",
  "tmz",
  "marvel entertainment",
  "paramount pictures",
  "warner bros. pictures",
  "20th century studios",
  "walt disney studios",
  "sony pictures entertainment",
  "netflix",
];

// Contextual Exceptions (Legitimate educational instruction in media, sound, or game dev)
const MUSIC_EDUCATION_EXCEPTIONS = [
  /\bmusic theory\b/i,
  /\bear training\b/i,
  /\bacoustics\b/i,
  /\bsound design tutorial\b/i,
  /\baudio engineering\b/i,
  /\baudio production\b/i,
  /\bmixing (tutorial|masterclass|course)\b/i,
  /\bmastering (tutorial|course)\b/i,
  /\bsynthesizer (basics|programming|tutorial)\b/i,
  /\bcounterpoint\b/i,
  /\bharmony lecture\b/i,
  /\bchords and scales tutorial\b/i,
];

const FILM_EDUCATION_EXCEPTIONS = [
  /\bfilm editing (tutorial|course|masterclass)\b/i,
  /\bpremiere pro (tutorial|course|full course)\b/i,
  /\bdavinci resolve (tutorial|course)\b/i,
  /\bafter effects tutorial\b/i,
  /\bblender (3d|tutorial|course|for beginners)\b/i,
  /\banimation (tutorial|course|in blender)\b/i,
  /\bcinematography (lighting|course|tutorial)\b/i,
  /\bcolor grading (tutorial|masterclass)\b/i,
];

const GAME_DEV_EXCEPTIONS = [
  /\bgame (development|dev) (tutorial|course|from scratch)\b/i,
  /\bunity (tutorial|course|c#|beginner)\b/i,
  /\bunreal engine (tutorial|course|c\+\+|5)\b/i,
  /\bgodot (engine|tutorial|course)\b/i,
  /\bshader (programming|tutorial)\b/i,
  /\bgame physics programming\b/i,
];

// Proven Educational Channels
export const PROVEN_EDUCATIONAL_CHANNELS = [
  "freecodecamp",
  "freecodecamp.org",
  "mit opencourseware",
  "stanford online",
  "harvard",
  "cs50",
  "khan academy",
  "crashcourse",
  "3blue1brown",
  "fireship",
  "traversy media",
  "programming with mosh",
  "academind",
  "the net ninja",
  "web dev simplified",
  "kevin powell",
  "clever programmer",
  "dave gray",
  "hitesh choudhary",
  "chaiaurcode",
  "codevolution",
  "edureka",
  "simplilearn",
  "amigoscode",
  "pedrotech",
  "jack herrington",
  "hussein nasser",
  "bytebytego",
  "neetcode",
  "corey schafer",
  "statquest with josh starmer",
  "statquest",
  "sentdex",
  "lex fridman",
  "andrew ng",
  "deeplearning.ai",
  "sebastian lague",
  "ben eater",
  "the coding train",
  "fireship.io",
  "coursera",
  "edx",
  "nptel",
  "geeksforgeeks",
];

// Educational Subject & Technology Keywords
const EDUCATIONAL_SUBJECT_PATTERNS = [
  // Programming Languages & Frameworks
  {
    regex: /\b(javascript|typescript|python|golang|go lang|rust lang|java|c\+\+|c#|c lang|kotlin|swift|ruby|php|sql|nosql|mongodb|postgresql|postgres|mysql|sqlite|redis|graphql|docker|kubernetes|aws|azure|gcp|linux|bash|git|github|react|reactjs|angular|vue|vuejs|svelte|node|nodejs|express|expressjs|nextjs|nestjs|django|flask|fastapi|spring boot|asp\.net|laravel|rails|flutter|react native|html|html5|css|css3|sass|tailwind|bootstrap|redux|zustand)\b/i,
    weight: 25,
  },
  // Computer Science, Software Engineering & Architecture
  {
    regex: /\b(data structures|algorithms|leetcode|system design|object oriented|clean architecture|microservices|design patterns|api design|rest api|web development|frontend|backend|full stack|devops|ci\/cd|computer science|database design|concurrency|networking|cybersecurity|machine learning|deep learning|artificial intelligence|neural networks)\b/i,
    weight: 30,
  },
  // Mathematics & Natural Sciences
  {
    regex: /\b(calculus|linear algebra|discrete math|probability|statistics|differential equations|physics|mechanics|thermodynamics|chemistry|electromagnetism|quantum|algebra|geometry|trigonometry)\b/i,
    weight: 28,
  },
  // Academic Lectures & Exam Certifications
  {
    regex: /\b(lecture \d+|course lecture|university|syllabus|computer science 101|gate exam|gre prep|aws certified|solutions architect|security\+|ccna|comptia|exam preparation)\b/i,
    weight: 25,
  },
  // Instructional Structure & Tutorial Format
  {
    regex: /\b(full course|complete course|crash course|masterclass|from scratch|zero to hero|step by step|worked example|hands-on tutorial|in depth tutorial|tutorial|for beginners|beginner guide|fundamentals|deep dive|explained)\b/i,
    weight: 20,
  },
];

export class EducationalClassifierService {
  constructor(options = {}) {
    this.minDurationSeconds = options.minDurationSeconds ?? 120;
    this.allowMicroTutorials = options.allowMicroTutorials ?? false;
  }

  /**
   * Determine whether a video candidate is a YouTube Short based on metadata.
   */
  isYouTubeShort(video, durationSeconds = null) {
    if (!video) return false;

    // 1. Explicit URL check
    const url = String(video.youtubeUrl || video.url || video.embedUrl || "");
    if (url.includes("/shorts/")) {
      return true;
    }

    // 2. Tag checks
    if (Array.isArray(video.tags)) {
      const hasShortTag = video.tags.some((t) => {
        const lower = String(t).toLowerCase();
        return lower === "shorts" || lower === "#shorts" || lower.includes("youtubeshorts");
      });
      if (hasShortTag) return true;
    }

    // 3. Title hashtag check
    const title = String(video.title || "").toLowerCase();
    if (title.includes("#shorts") || title.includes("#short")) {
      return true;
    }

    // 4. Strict duration <= 60 seconds
    if (durationSeconds !== null && durationSeconds > 0 && durationSeconds <= 60) {
      return true;
    }

    return false;
  }

  /**
   * Extract authoritative duration in seconds without guessing.
   */
  extractDurationSeconds(video) {
    if (!video) return null;

    if (
      typeof video.duration?.seconds === "number" &&
      !isNaN(video.duration.seconds) &&
      video.duration.seconds > 0
    ) {
      return video.duration.seconds;
    }

    if (
      typeof video.durationSeconds === "number" &&
      !isNaN(video.durationSeconds) &&
      video.durationSeconds > 0
    ) {
      return video.durationSeconds;
    }

    if (
      typeof video.verifiedDurationSeconds === "number" &&
      !isNaN(video.verifiedDurationSeconds) &&
      video.verifiedDurationSeconds > 0
    ) {
      return video.verifiedDurationSeconds;
    }

    return null;
  }

  /**
   * Evaluate whether video metadata matches legitimate contextual exceptions.
   */
  #evaluateContextualException(fullText, categoryId, channelTitle) {
    // A. Music Education Exception
    const isMusicEducation = MUSIC_EDUCATION_EXCEPTIONS.some((p) => p.test(fullText));
    if (isMusicEducation) {
      // Must not be an official music video or artist VEVO channel
      const isOfficialArtist = HARD_MUSIC_PATTERNS.some((p) => p.test(fullText)) ||
        HARD_ENTERTAINMENT_CHANNELS.some((c) => channelTitle.includes(c));
      if (!isOfficialArtist) {
        return {
          approved: true,
          contentType: "academic_lecture",
          matchedSignal: "Music theory / acoustic audio engineering lecture exception",
        };
      }
    }

    // B. Film & Animation Education Exception
    const isFilmEducation = FILM_EDUCATION_EXCEPTIONS.some((p) => p.test(fullText));
    if (isFilmEducation) {
      const isMovieTrailer = HARD_MOVIE_PATTERNS.some((p) => p.test(fullText));
      if (!isMovieTrailer) {
        return {
          approved: true,
          contentType: "practical_demo",
          matchedSignal: "Film editing / 3D software animation tutorial exception",
        };
      }
    }

    // C. Game Development Exception
    const isGameDev = GAME_DEV_EXCEPTIONS.some((p) => p.test(fullText));
    if (isGameDev) {
      const isGameplay = HARD_GAMING_PATTERNS.some((p) => p.test(fullText));
      if (!isGameplay) {
        return {
          approved: true,
          contentType: "programming_tutorial",
          matchedSignal: "Game engine architecture / C# tutorial exception",
        };
      }
    }

    return { approved: false, contentType: null, matchedSignal: null };
  }

  /**
   * Classify a candidate video using transparent deterministic evaluation.
   *
   * @param {object} video
   * @param {object} options
   * @returns {object} validated classification object
   */
  classifyVideo(video, options = {}) {
    const videoId = String(video?.videoId || "").trim();
    const title = String(video?.title || "").trim();
    const description = String(video?.description || "").trim();
    const channelTitle = String(video?.channelTitle || video?.channel || "").trim().toLowerCase();
    const categoryId = String(video?.categoryId || "").trim();
    const tags = Array.isArray(video?.tags) ? video.tags : [];
    const embeddable = video?.embeddable !== false;

    const matchedSignals = [];
    const reasonCodes = [];
    let contentType = "unknown";
    let educationalRelevance = 50; // Neutral baseline
    let confidence = 0.85;

    // Missing basic metadata
    if (!videoId || !title) {
      return {
        videoId: videoId || "unknown",
        decision: "reject",
        contentType: "unknown",
        educationalRelevance: 0,
        confidence: 1.0,
        reasonCodes: [CLASSIFIER_REASON_CODES.INSUFFICIENT_EVIDENCE],
        matchedSignals: ["Missing videoId or title metadata"],
        classifierVersion: CLASSIFIER_VERSION,
      };
    }

    const fullText = `${title} ${description} ${tags.join(" ")}`.toLowerCase();
    const durationSeconds = this.extractDurationSeconds(video);

    // -------------------------------------------------------------
    // 1. EMBEDDABILITY GATE
    // -------------------------------------------------------------
    if (!embeddable) {
      reasonCodes.push(CLASSIFIER_REASON_CODES.HARD_BLOCK_NON_EMBEDDABLE);
      matchedSignals.push("Video is marked non-embeddable by content owner");
      return {
        videoId,
        decision: "reject",
        contentType: "unknown",
        educationalRelevance: 0,
        confidence: 1.0,
        reasonCodes,
        matchedSignals,
        classifierVersion: CLASSIFIER_VERSION,
      };
    }

    // -------------------------------------------------------------
    // 2. YOUTUBE SHORTS & DURATION GATE
    // -------------------------------------------------------------
    const isShort = this.isYouTubeShort(video, durationSeconds);
    if (isShort) {
      reasonCodes.push(CLASSIFIER_REASON_CODES.HARD_BLOCK_SHORTS);
      matchedSignals.push("Short-form content detected via URL, tag, or <=60s duration");
      return {
        videoId,
        decision: "reject",
        contentType: "short_form",
        educationalRelevance: 15,
        confidence: 0.98,
        reasonCodes,
        matchedSignals,
        classifierVersion: CLASSIFIER_VERSION,
      };
    }

    const enforcedMinDuration = options.minDurationSeconds ?? this.minDurationSeconds;
    if (durationSeconds !== null && durationSeconds < enforcedMinDuration) {
      reasonCodes.push(CLASSIFIER_REASON_CODES.HARD_BLOCK_DURATION_BELOW_MINIMUM);
      matchedSignals.push(`Duration (${durationSeconds}s) is below required ${enforcedMinDuration}s threshold`);
      return {
        videoId,
        decision: "reject",
        contentType: "short_form",
        educationalRelevance: 20,
        confidence: 0.95,
        reasonCodes,
        matchedSignals,
        classifierVersion: CLASSIFIER_VERSION,
      };
    }

    // -------------------------------------------------------------
    // 3. CONTEXTUAL EXCEPTIONS CHECK
    // -------------------------------------------------------------
    const exception = this.#evaluateContextualException(fullText, categoryId, channelTitle);
    if (exception.approved) {
      reasonCodes.push(CLASSIFIER_REASON_CODES.CONTEXTUAL_EXCEPTION_APPROVED);
      matchedSignals.push(exception.matchedSignal);
      contentType = exception.contentType;
      educationalRelevance = 88;
      confidence = 0.92;

      return {
        videoId,
        decision: "allow",
        contentType,
        educationalRelevance,
        confidence,
        reasonCodes,
        matchedSignals,
        classifierVersion: CLASSIFIER_VERSION,
      };
    }

    const hasInjectedEducationalKeywords =
      /\b(tutorial|course|learn|for beginners|lecture|full course|study|masterclass)\b/i.test(fullText);

    // -------------------------------------------------------------
    // 4. ENTERTAINMENT & MUSIC CHANNEL DETECTION
    // -------------------------------------------------------------
    const MUSIC_CHANNEL_KEYWORDS = [
      "vevo",
      "- topic",
      "records",
      "t-series",
      "sony music",
      "warner music",
      "universal music",
      "atlantic records",
      "spinnin'",
      "def jam",
      "interscope",
    ];
    const isMusicChannel = MUSIC_CHANNEL_KEYWORDS.some((kw) => channelTitle.includes(kw));

    let matchedEntertainmentChannel = false;
    for (const blockedChannel of HARD_ENTERTAINMENT_CHANNELS) {
      if (channelTitle.includes(blockedChannel)) {
        matchedEntertainmentChannel = true;
        reasonCodes.push(CLASSIFIER_REASON_CODES.HARD_BLOCK_MUSIC_CHANNEL);
        matchedSignals.push(`Recognized official entertainment/music channel: "${channelTitle}"`);
        break;
      }
    }

    if (matchedEntertainmentChannel) {
      if (isMusicChannel) {
        reasonCodes.push(CLASSIFIER_REASON_CODES.HARD_BLOCK_MUSIC);
        contentType = "music";
      } else {
        contentType = "entertainment";
      }

      if (hasInjectedEducationalKeywords) {
        contentType = "misleading_metadata";
        reasonCodes.push(CLASSIFIER_REASON_CODES.HARD_BLOCK_KEYWORD_MISUSE);
        reasonCodes.push(CLASSIFIER_REASON_CODES.HARD_BLOCK_CONFLICTING_SIGNALS);
        matchedSignals.push("Conflicting signals: entertainment channel with injected educational keywords");
      }

      return {
        videoId,
        decision: "reject",
        contentType,
        educationalRelevance: 5,
        confidence: 0.99,
        reasonCodes,
        matchedSignals,
        classifierVersion: CLASSIFIER_VERSION,
      };
    }

    // -------------------------------------------------------------
    // 5. HARD PATTERN DETECTION (Music, Trailers, Comedy, Gaming)
    // -------------------------------------------------------------
    let hasHardBlockPattern = false;

    // Music
    for (const pat of HARD_MUSIC_PATTERNS) {
      if (pat.test(fullText)) {
        hasHardBlockPattern = true;
        reasonCodes.push(CLASSIFIER_REASON_CODES.HARD_BLOCK_MUSIC);
        matchedSignals.push(`Music pattern matched: ${pat}`);
        contentType = "music";
        break;
      }
    }

    // Category ID 10 (Music) hard check if not exempted
    if (categoryId === YOUTUBE_CATEGORIES.MUSIC) {
      hasHardBlockPattern = true;
      if (!reasonCodes.includes(CLASSIFIER_REASON_CODES.HARD_BLOCK_MUSIC)) {
        reasonCodes.push(CLASSIFIER_REASON_CODES.HARD_BLOCK_MUSIC);
      }
      matchedSignals.push("YouTube Category ID is 10 (Music)");
      contentType = "music";
    }

    // Trailers & Movie Clips
    if (!hasHardBlockPattern) {
      for (const pat of HARD_MOVIE_PATTERNS) {
        if (pat.test(fullText)) {
          hasHardBlockPattern = true;
          reasonCodes.push(CLASSIFIER_REASON_CODES.HARD_BLOCK_MOVIE_TRAILER);
          matchedSignals.push(`Movie trailer / clip pattern matched: ${pat}`);
          contentType = "movie_clip";
          break;
        }
      }
    }

    // Comedy, Gossip & Vlogs
    if (!hasHardBlockPattern) {
      for (const pat of HARD_COMEDY_VLOG_PATTERNS) {
        if (pat.test(fullText)) {
          hasHardBlockPattern = true;
          reasonCodes.push(CLASSIFIER_REASON_CODES.HARD_BLOCK_PRANK_VLOG);
          matchedSignals.push(`Entertainment prank/vlog pattern matched: ${pat}`);
          contentType = "entertainment";
          break;
        }
      }
    }

    // Gaming
    if (!hasHardBlockPattern) {
      for (const pat of HARD_GAMING_PATTERNS) {
        if (pat.test(fullText)) {
          hasHardBlockPattern = true;
          reasonCodes.push(CLASSIFIER_REASON_CODES.HARD_BLOCK_UNRELATED_GAMING);
          matchedSignals.push(`Unrelated gameplay pattern matched: ${pat}`);
          contentType = "unrelated_gaming";
          break;
        }
      }
    }

    // -------------------------------------------------------------
    // 6. KEYWORD MISUSE & CONFLICTING SIGNALS EVALUATION
    // -------------------------------------------------------------
    if (hasHardBlockPattern && hasInjectedEducationalKeywords) {
      reasonCodes.push(CLASSIFIER_REASON_CODES.HARD_BLOCK_KEYWORD_MISUSE);
      reasonCodes.push(CLASSIFIER_REASON_CODES.HARD_BLOCK_CONFLICTING_SIGNALS);
      matchedSignals.push("Conflicting signals: entertainment content with injected educational keywords");
      return {
        videoId,
        decision: "reject",
        contentType: "misleading_metadata",
        educationalRelevance: 5,
        confidence: 0.99,
        reasonCodes,
        matchedSignals,
        classifierVersion: CLASSIFIER_VERSION,
      };
    }

    if (hasHardBlockPattern) {
      return {
        videoId,
        decision: "reject",
        contentType,
        educationalRelevance: 10,
        confidence: 0.97,
        reasonCodes,
        matchedSignals,
        classifierVersion: CLASSIFIER_VERSION,
      };
    }

    // -------------------------------------------------------------
    // 7. POSITIVE EDUCATIONAL SIGNAL ACCUMULATION
    // -------------------------------------------------------------
    let educationalScore = 50;

    // Proven Educational Channel Boost
    for (const provenChannel of PROVEN_EDUCATIONAL_CHANNELS) {
      if (channelTitle.includes(provenChannel)) {
        educationalScore += 25;
        reasonCodes.push(CLASSIFIER_REASON_CODES.PROVEN_EDUCATIONAL_CHANNEL);
        matchedSignals.push(`Recognized verified educational channel: "${channelTitle}" (+25)`);
        break;
      }
    }

    // Verified Educational Categories
    if (categoryId === YOUTUBE_CATEGORIES.EDUCATION) {
      educationalScore += 25;
      reasonCodes.push(CLASSIFIER_REASON_CODES.EDUCATIONAL_CATEGORY_CONFIRMED);
      matchedSignals.push("YouTube Category ID confirmed as 27 (Education) (+25)");
    } else if (categoryId === YOUTUBE_CATEGORIES.SCIENCE_TECH) {
      educationalScore += 20;
      reasonCodes.push(CLASSIFIER_REASON_CODES.EDUCATIONAL_CATEGORY_CONFIRMED);
      matchedSignals.push("YouTube Category ID confirmed as 28 (Science & Technology) (+20)");
    }

    // Educational Subject Relevance
    for (const { regex, weight } of EDUCATIONAL_SUBJECT_PATTERNS) {
      if (regex.test(title)) {
        educationalScore += weight;
        matchedSignals.push(`Title matches educational subject: ${regex} (+${weight})`);
      } else if (regex.test(description)) {
        educationalScore += Math.round(weight * 0.4);
        matchedSignals.push(`Description matches educational subject: ${regex} (+${Math.round(weight * 0.4)})`);
      }
    }

    // Deduce Content Type
    if (/\b(full course|complete course|crash course|syllabus|roadmap)\b/i.test(fullText)) {
      contentType = "programming_tutorial";
      reasonCodes.push(CLASSIFIER_REASON_CODES.STRUCTURED_COURSE_SYLLABUS);
    } else if (/\b(lecture|mit opencourseware|cs50|stanford online|university)\b/i.test(fullText)) {
      contentType = "academic_lecture";
      reasonCodes.push(CLASSIFIER_REASON_CODES.ACADEMIC_LECTURE_FORMAT);
    } else if (/\b(exam|certification|gate|gre|aws certified)\b/i.test(fullText)) {
      contentType = "exam_prep";
      reasonCodes.push(CLASSIFIER_REASON_CODES.EXAM_CERTIFICATION_PREP);
    } else if (/\b(build|project|hands-on|from scratch|code along)\b/i.test(fullText)) {
      contentType = "practical_demo";
      reasonCodes.push(CLASSIFIER_REASON_CODES.PRACTICAL_DEMO_CODE);
    } else if (educationalScore >= 70) {
      contentType = "educational_talk";
    }

    // Normalization & Confidence Calibration
    educationalRelevance = Math.max(0, Math.min(100, educationalScore));

    // Threshold Decision Logic:
    // score >= 65 -> allow
    // score between 50 and 64 without hard blocks -> review (conservative reject in strict mode)
    // score < 50 -> reject (insufficient educational substance)
    let decision = "reject";
    if (educationalRelevance >= 65) {
      decision = "allow";
      confidence = Math.min(0.98, 0.80 + (educationalRelevance - 65) * 0.005);
    } else if (educationalRelevance >= 50) {
      decision = "review";
      confidence = 0.65;
      reasonCodes.push(CLASSIFIER_REASON_CODES.BORDERLINE_CONFIDENCE);
      matchedSignals.push("Borderline educational confidence; flagged for review");
    } else {
      decision = "reject";
      confidence = 0.85;
      reasonCodes.push(CLASSIFIER_REASON_CODES.INSUFFICIENT_EVIDENCE);
      matchedSignals.push("Insufficient educational substance");
    }

    return {
      videoId,
      decision,
      contentType,
      educationalRelevance,
      confidence: parseFloat(confidence.toFixed(2)),
      reasonCodes,
      matchedSignals,
      classifierVersion: CLASSIFIER_VERSION,
    };
  }

  /**
   * Filter and validate an array of candidate videos in batch.
   * Keeps only allowed videos, attaching classification objects.
   */
  filterAndClassifyBatch(candidates = [], options = {}) {
    if (!Array.isArray(candidates)) return { allowed: [], rejected: [] };

    const allowed = [];
    const rejected = [];
    const seenIds = new Set();

    for (const video of candidates) {
      if (!video) continue;
      const cleanId = String(video.videoId || video.id?.videoId || video.id || "").trim();
      if (!cleanId || seenIds.has(cleanId)) continue;
      seenIds.add(cleanId);

      const classification = this.classifyVideo(video, options);

      const enrichedVideo = {
        ...video,
        videoId: cleanId,
        classification,
        educationalScore: classification.educationalRelevance,
        educationalSignals: classification.matchedSignals,
        classifierDecision: classification.decision,
      };

      if (classification.decision === "allow") {
        allowed.push(enrichedVideo);
      } else {
        rejected.push(enrichedVideo);
      }
    }

    return {
      allowed,
      rejected,
      totalScanned: candidates.length,
      allowedCount: allowed.length,
      rejectedCount: rejected.length,
      classifierVersion: CLASSIFIER_VERSION,
    };
  }
}

export const educationalClassifierService = new EducationalClassifierService();
