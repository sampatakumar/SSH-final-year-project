# Study Module — Intelligent Study Planner & Flashcard Repetition

> **Personalized Study Profiles, Flashcard Repetition & AI Study Material Generation**

---

## 1. Overview & Capabilities

The **Study Module** helps learners organize technical study routines, review technical flashcards, and schedule focused study sessions.

### Core Capabilities:
- **Study Profiles & Goals**: Tracks daily/weekly target study hours, topic preferences, and focus areas.
- **AI-Generated Flashcards**: Generates technical flashcard decks covering algorithmic patterns, system design concepts, and language trivia.
- **Review Scheduling**: Implements active recall intervals based on card difficulty ratings (Easy, Good, Hard).

---

## 2. Directory Structure

```
backend/src/modules/study/
├── controllers/
│   └── study.controller.js         # HTTP handlers for study profiles & flashcards
├── models/
│   ├── flashcard.models.js         # Flashcard decks, cards & review intervals
│   └── studyProfile.models.js      # User study preferences & session logs
├── routes/
│   └── study.routes.js             # Express router: /api/v1/study/*
└── services/
    └── study.service.js            # Flashcard review logic & session management
```

---

## 3. API Reference

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/study/profile` | Get user study preferences and session history. | Required |
| `PUT` | `/api/v1/study/profile` | Update study goals and target schedule. | Required |
| `GET` | `/api/v1/study/flashcards` | List flashcard decks with review counts. | Required |
| `POST` | `/api/v1/study/flashcards` | Create new flashcard deck or card. | Required |
| `POST` | `/api/v1/study/flashcards/:id/review` | Record flashcard review score (Easy, Medium, Hard). | Required |
