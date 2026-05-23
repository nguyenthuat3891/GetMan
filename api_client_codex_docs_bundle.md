# API Client Tool - Documentation Bundle

## Folder Structure

```txt
/docs
  01-product-requirements.md
  02-tech-stack.md
  03-app-color-system.md
  04-ui-design-rules.md
  05-postman-import-export.md
  06-request-builder.md
  07-dynamic-random-values.md
  08-environment-variables.md
  09-storage-schema.md
  10-development-workflow.md
```

---

# 01-product-requirements.md

## Product Overview

Build a desktop API client application similar to Postman, Bruno, and Insomnia.

Main goals:
- Fast API testing
- Clean developer experience
- Lightweight desktop application
- Local-first storage
- Postman compatible import/export
- Dynamic request variable system

## Core Features

### Request Builder
- GET
- POST
- PUT
- PATCH
- DELETE
- Query params
- Headers
- JSON body
- Form data
- Raw body
- Binary upload

### Response Viewer
- JSON pretty format
- Response headers
- Status code
- Response time
- Response size

### Collection System
- Workspace
- Collection
- Folder
- Request
- Tabs
- History

### Postman Compatibility
- Import Postman Collection v2.1
- Export Postman Collection v2.1
- Import environment files
- Export environment files

### Dynamic Variables
- Random values
- Faker values
- UUID
- Timestamp
- Environment variables
- Response chaining

---

# 02-tech-stack.md

## Frontend

- React
- TypeScript
- Vite
- Fluent UI
- Monaco Editor

## Desktop Runtime

Recommended:
- Electron

Optional:
- Tauri

## HTTP Layer

- undici

## Validation:
- Plain TypeScript/JavaScript only
- No zod
- No ajv
- No yup
- Common reusable validator functions
- Return structured ValidationResult

## Storage

- SQLite
- better-sqlite3

## State Management

- Zustand

---

# 03-app-color-system.md

## Brand Direction

The app is a functional API client tool. Do not copy Postman's color system or branding.

Design direction:
- Function-first API testing tool
- Friendly developer experience
- Calm, soft, easy-on-the-eyes colors
- Clean workspace for long coding/testing sessions
- Cute but professional visual identity
- Colorful icon system for collections, folders, requests, environments, history, and settings

## Visual Personality

The product should feel:
- Friendly
- Lightweight
- Clear
- Modern
- Helpful
- Not corporate-heavy
- Not visually aggressive

Avoid:
- Postman-like orange branding
- Harsh saturated colors
- Pure black backgrounds
- Too much gradient
- Overly enterprise-looking UI

## Color Palette

### Primary

Use a soft blue as the main action color.

```css
--color-primary: #60A5FA;
--color-primary-hover: #3B82F6;
--color-primary-soft: #DBEAFE;
```

### Secondary

Use a soft mint/teal for supportive actions and positive highlights.

```css
--color-secondary: #5EEAD4;
--color-secondary-hover: #2DD4BF;
--color-secondary-soft: #CCFBF1;
```

### Accent

Use a gentle purple for selected states, tabs, and decorative highlights.

```css
--color-accent: #C4B5FD;
--color-accent-hover: #A78BFA;
--color-accent-soft: #EDE9FE;
```

### Background - Light Mode

```css
--color-bg-main: #F8FAFC;
--color-bg-sidebar: #EEF6FF;
--color-bg-panel: #FFFFFF;
--color-bg-elevated: #F1F5F9;
```

### Background - Dark Mode

Dark mode should be soft navy, not pure black.

```css
--color-dark-bg-main: #101828;
--color-dark-bg-sidebar: #172033;
--color-dark-bg-panel: #1E293B;
--color-dark-bg-elevated: #263449;
```

### Text - Light Mode

```css
--color-text-primary: #0F172A;
--color-text-secondary: #475569;
--color-text-muted: #64748B;
```

### Text - Dark Mode

```css
--color-dark-text-primary: #F8FAFC;
--color-dark-text-secondary: #CBD5E1;
--color-dark-text-muted: #94A3B8;
```

### Border

```css
--color-border: #D8E3F0;
--color-border-soft: #E2E8F0;
--color-dark-border: #334155;
```

### Status Colors

```css
--color-success: #22C55E;
--color-warning: #FBBF24;
--color-danger: #FB7185;
--color-info: #38BDF8;
```

### HTTP Method Colors

HTTP method colors should be readable but not too aggressive.

```css
--method-get: #22C55E;
--method-post: #60A5FA;
--method-put: #FBBF24;
--method-patch: #C084FC;
--method-delete: #FB7185;
```

## Icon System

Use a cute, colorful icon style.

Recommended icon direction:
- Rounded icons
- Soft colors
- Slightly playful but still professional
- Each major feature should have a recognizable icon

Icon examples:
- Collection: cute stacked cards / folder box
- Folder: rounded folder
- Request: small lightning bolt or paper plane
- Environment: small planet / globe
- History: clock
- Variables: magic wand / sparkles
- Auth: small shield / key
- Tests: checklist
- Import: arrow into tray
- Export: arrow out of tray
- Settings: rounded gear

Icon color rules:
- Icons can use multiple soft colors.
- Avoid single-color boring enterprise icons.
- Avoid overly childish emoji-only UI.
- Icons should help users scan the sidebar quickly.

## Usage Rules

- Prioritize functionality over decoration.
- Colors must support long developer sessions.
- Important actions should be clear but not visually loud.
- Use soft backgrounds and clear borders.
- Do not make the app look like Postman.
- Use colors to improve navigation and readability.
- JSON editor and response viewer must remain highly readable.

---

# 04-ui-design-rules.md

## Layout

Three panel layout:

- Sidebar
- Request editor
- Response viewer

## Sidebar

Contains:
- Collections
- History
- Environments
- Favorites

## Request Area

Contains:
- Method dropdown
- URL input
- Send button
- Tabs:
  - Params
  - Headers
  - Body
  - Auth
  - Tests

## Response Area

Contains:
- Status
- Time
- Size
- Response tabs

## Design Rules

- Rounded corners: 10px
- Smooth animations
- Minimal shadows
- Dense developer-focused layout
- Keyboard shortcuts supported

---

# 05-postman-import-export.md

## Supported Version

Postman Collection v2.1

## Import Requirements

Must support:
- Collections
- Folders
- Requests
- Variables
- Headers
- Body
- Auth
- Events

## Export Requirements

Generated collection must be fully compatible with Postman.

Schema:

```txt
https://schema.getpostman.com/json/collection/v2.1.0/collection.json
```

## Recommended Library

```txt
postman-collection
```

---

# 06-request-builder.md

## Features

### Request Types
- REST
- GraphQL
- WebSocket (future)
- gRPC (future)

### Body Types
- raw JSON
- text
- XML
- form-data
- urlencoded
- binary

### Authentication
- Bearer Token
- Basic Auth
- API Key
- OAuth2

---

# 07-dynamic-random-values.md

## Supported Variables

```txt
{{uuid}}
{{timestamp}}
{{randomEmail}}
{{randomPhone}}
{{randomName}}
{{randomInt(1,100)}}
```

## Faker Support

```txt
{{faker.internet.email}}
{{faker.person.fullName}}
{{faker.phone.number}}
```

## Processing Flow

```txt
Raw Request
  ↓
Environment Variables
  ↓
Dynamic Variables
  ↓
Faker Variables
  ↓
Final Request
```

## Recommended Library

```txt
@faker-js/faker
```

---

# 08-environment-variables.md

## Features

### Environment Types
- Local
- Dev
- Staging
- Production

### Variable Syntax

```txt
{{baseUrl}}
{{token}}
{{userId}}
```

## Example

```json
{
  "baseUrl": "https://api.dev.local",
  "token": "abc123"
}
```

---

# 09-storage-schema.md

## Database

SQLite

## Tables

### collections
- id
- name
- created_at

### folders
- id
- collection_id
- parent_id
- name

### requests
- id
- folder_id
- method
- url
- headers
- body
- auth

### environments
- id
- name
- variables

### histories
- id
- request_snapshot
- created_at

---

# 10-development-workflow.md

## Branch Strategy

```txt
features/request-builder
features/postman-import
features/dynamic-variables
features/environment-system
```

## Development Rules

- Small focused PRs
- Strong typing everywhere
- Shared UI components
- No duplicated request logic
- Use feature-based folder structure

## Recommended Folder Structure

```txt
/apps
  /desktop
/packages
  /core
  /storage
  /request-engine
  /postman
  /faker-engine
  /ui
```

