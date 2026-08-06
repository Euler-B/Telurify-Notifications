# Architecture

Telurify Notifications is responsible only for detecting significant events
from the existing API and sending web notifications. It does not connect
directly to Neon or USGS.

```mermaid
flowchart LR
    Browser[TeluriFy Web\nAstro + Firebase Web Messaging]
    API[Telurify API\nRails]
    DB[(Neon PostgreSQL)]
    Ingestion[Telurify Ingestion\nGo + scheduled job]
    Cron[cron-job.org]
    Notifications[Telurify Notifications\nNestJS on Vercel]
    Redis[(Upstash Redis)]
    Firebase[Firebase Cloud Messaging]

    Browser -->|POST /v1/devices\nFCM token| API
    API -->|store devices and sismos| DB
    Ingestion -->|persist earthquake data| DB
    Cron -->|POST /notify/check\nX-Notify-Secret| Notifications
    Notifications -->|GET /v1/sismos\nGET /v1/devices| API
    Notifications -->|lock and deduplication| Redis
    Notifications -->|send web push| Firebase
    Firebase -->|notification| Browser
```

## Responsibilities

| Component | Responsibility |
|---|---|
| `TeluriFy-Web` | Requests notification permission and registers FCM tokens. |
| `Telurify-API` | Owns device and earthquake data and exposes it over HTTP. |
| `Telurify-Ingestion` | Collects and persists earthquake data from USGS. |
| `Telurify-Notifications` | Finds new events with magnitude `>= 6.0` and sends alerts. |
| `cron-job.org` | Triggers the notification check every 15 minutes. |
| Upstash Redis | Coordinates concurrent checks and stores temporary deduplication markers. |
| Firebase Cloud Messaging | Delivers notifications to subscribed browsers. |

The notification service communicates with `Telurify-API` over HTTPS and has
no database credentials for Neon.
