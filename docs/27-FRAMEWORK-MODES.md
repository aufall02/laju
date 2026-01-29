# Framework Modes Guide

Laju framework supports multiple modes of operation depending on your project needs.

## Table of Contents

1. [Overview](#overview)
2. [Full-Stack Mode](#full-stack-mode)
3. [Backend-Only / API Mode](#backend-only--api-mode)
4. [SSR Mode](#ssr-mode)
5. [Hybrid Mode](#hybrid-mode)

---

## Overview

| Mode | Frontend | Use Case |
|------|----------|----------|
| **Full-Stack** | Inertia.js + Svelte 5 | Interactive dashboards, SPA-like apps |
| **Backend-Only** | None (JSON API) | REST API, mobile backends |
| **SSR** | Eta templates | SEO-focused sites, landing pages |
| **Hybrid** | Mixed | Landing pages + Dashboard |

---

## Full-Stack Mode

**Default mode** - Uses Inertia.js with Svelte 5 for interactive single-page application experience.

### Features

- **SPA Experience** - No full page reloads
- **Reactive UI** - Svelte 5 with runes (`$state`, `$props`)
- **Server-Side Data** - Data loaded via Inertia responses
- **TailwindCSS** - Utility-first styling

### Controller Response

```typescript
import { Response, Request } from "../../type";
import DB from "../services/DB";

class DashboardController {
  async index(request: Request, response: Response) {
    const stats = await DB.from("stats").first();
    
    // Inertia response - renders Svelte page
    return response.inertia("dashboard/index", {
      user: request.user,
      stats: stats
    });
  }
}
```

### Page Location

```
resources/js/Pages/
├── dashboard/
│   └── index.svelte
├── users/
│   ├── index.svelte
│   └── form.svelte
└── auth/
    ├── login.svelte
    └── register.svelte
```

### Svelte Page Example

```svelte
<script>
  import DashboardLayout from '@/Components/DashboardLayout.svelte';
  let { user, stats } = $props();
</script>

<DashboardLayout title="Dashboard">
  <h1>Welcome, {user.name}</h1>
  <p>Total users: {stats.users}</p>
</DashboardLayout>
```

---

## Backend-Only / API Mode

Pure REST API server without frontend dependencies.

### When to Use

- Mobile app backend
- Microservices
- Headless CMS
- Third-party integrations

### Setup

1. **Remove frontend dependencies** (optional, for smaller bundle):
   ```bash
   npm uninstall @inertiajs/svelte svelte lucide-svelte
   ```

2. **Disable Inertia middleware** in `server.ts`:
   ```typescript
   // Comment out or remove
   // import inertia from "./app/middlewares/inertia";
   // webserver.use(inertia());
   ```

### Controller Response

```typescript
class ApiController {
  async getUsers(request: Request, response: Response) {
    const users = await DB.from("users").select("id", "name", "email");
    
    // JSON response
    return response.json({
      success: true,
      data: users
    });
  }
  
  async createUser(request: Request, response: Response) {
    const body = await request.json();
    const [id] = await DB.table("users").insert(body);
    
    return response.status(201).json({
      success: true,
      data: { id }
    });
  }
}
```

### Routes

```typescript
// routes/web.ts
import ApiController from "../app/controllers/ApiController";

// API routes (no auth middleware for public endpoints)
Route.get('/api/users', [], ApiController.getUsers);
Route.post('/api/users', [], ApiController.createUser);

// Protected API routes
Route.get('/api/profile', [Auth], ApiController.getProfile);
```

---

## SSR Mode

Server-Side Rendering with Eta templates - traditional multi-page websites.

### When to Use

- Landing pages (SEO important)
- Marketing websites
- Email templates
- Minimal JavaScript needed

### Features

- **SEO Friendly** - Full HTML served from server
- **Fast Initial Load** - No JavaScript required to render
- **Simple** - Traditional request/response cycle

### Controller Response

```typescript
import { view } from "../services/View";

class PublicController {
  async landing(request: Request, response: Response) {
    const features = await DB.from("features").select("*");
    
    // SSR response - renders Eta template
    const html = view("landing.html", {
      title: "Welcome to Our App",
      features: features
    });
    
    return response.type("html").send(html);
  }
}
```

### Template Location

```
resources/views/
├── landing.html
├── about.html
├── partials/
│   ├── header.html
│   ├── footer.html
│   └── nav.html
└── layouts/
    └── main.html
```

### Eta Template Example

```html
<!-- resources/views/landing.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <title><%= it.title %></title>
  <link rel="stylesheet" href="<%= it.asset('js/index.css') %>">
</head>
<body>
  <%~ include('partials/header') %>
  
  <main>
    <h1><%= it.title %></h1>
    
    <% it.features.forEach(function(feature) { %>
      <div class="feature-card">
        <h3><%= feature.title %></h3>
        <p><%= feature.description %></p>
      </div>
    <% }) %>
  </main>
  
  <%~ include('partials/footer') %>
</body>
</html>
```

---

## Hybrid Mode

Combine SSR for public pages with Inertia for authenticated dashboards.

### Common Pattern

```typescript
// routes/web.ts

// Public SSR routes
Route.get('/', [], PublicController.landing);
Route.get('/about', [], PublicController.about);
Route.get('/pricing', [], PublicController.pricing);

// Auth routes (can be Inertia or SSR)
Route.get('/login', [], LoginController.show);
Route.get('/register', [], RegisterController.show);

// Authenticated Inertia routes
Route.get('/dashboard', [Auth], DashboardController.index);
Route.get('/settings', [Auth], SettingsController.index);
Route.get('/users', [Auth], UserController.index);
```

### Best Practices

| Page Type | Recommended Mode |
|-----------|------------------|
| Landing page | SSR (Eta) |
| Blog posts | SSR (Eta) |
| Login/Register | Either |
| Dashboard | Inertia + Svelte |
| Admin panel | Inertia + Svelte |
| Forms | Inertia + Svelte |

---

## Quick Reference

### Response Types

```typescript
// Inertia (Full-Stack)
return response.inertia("page/name", { data });

// JSON (API)
return response.json({ success: true, data });

// SSR (Eta)
const html = view("template.html", { data });
return response.type("html").send(html);

// Redirect
return response.redirect("/path");

// Flash + Redirect
return response.flash("success", "Done!").redirect("/path");
```

---

## Next Steps

- [Eta Template Guide](15-ETA.md) - Learn SSR templating
- [Frontend (Svelte)](05-FRONTEND-SVELTE.md) - Build reactive UI
- [Routing & Controllers](04-ROUTING-CONTROLLERS.md) - Handle requests
