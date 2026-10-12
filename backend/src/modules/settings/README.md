# Settings Module — User Preferences & Third-Party Integrations

> **User Account Preferences, Notification Rules & Integration Credentials Management**

---

## 1. Overview & Capabilities

The **Settings Module** manages user-level configuration, third-party platform tokens (GitHub, Cloudflare), email notification triggers, and interface theme defaults.

### Core Capabilities:
- **Profile Preferences**: Customizes username, display preferences, and notification frequencies.
- **Third-Party Integrations**: Manages secure connection states for GitHub OAuth, Cloudflare deployment tokens, and Supabase storage credentials.
- **Privacy & Telemetry**: Allows users to manage data export, clear cached learning history, or delete account data.

---

## 2. Directory Structure

```
backend/src/modules/settings/
├── controllers/
│   ├── integrations.controller.js  # Token connection status & credentials
│   └── settings.controller.js      # General user preferences handlers
├── models/
│   └── userSettings.model.js       # Schemas for user preferences and connected services
├── routes/
│   ├── integrations.routes.js      # /api/v1/settings/integrations/*
│   └── settings.routes.js          # /api/v1/settings/*
└── services/
    └── settings.service.js         # Settings persistence and secret sanitization
```

---

## 3. API Reference

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/settings` | Retrieve user preferences and configuration. | Required |
| `PUT` | `/api/v1/settings` | Update user settings (notifications, theme, display). | Required |
| `GET` | `/api/v1/settings/integrations` | Check status of connected third-party integrations. | Required |
| `DELETE` | `/api/v1/settings/integrations/:service` | Disconnect third-party integration and purge tokens. | Required |
