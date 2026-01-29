/**
 * Routes Index
 * 
 * This file combines all route files into a single router.
 * Follows Laravel-style route organization:
 * - web.ts  → Web routes (HTML pages, auth, Inertia)
 * - api.ts  → API routes (JSON responses, /api/*)
 * 
 * Usage in server.ts:
 *   import Routes from "./routes";
 *   webserver.use(Routes);
 */

import HyperExpress from 'hyper-express';
import WebRoute from './web';
import ApiRoute from './api';

const Routes = new HyperExpress.Router();

// Mount API routes first (more specific)
Routes.use(ApiRoute);

// Mount Web routes
Routes.use(WebRoute);

export default Routes;
