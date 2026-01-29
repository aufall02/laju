/**
 * API Routes
 * 
 * All API routes are prefixed with /api
 * These routes return JSON responses only
 * 
 * Best Practices:
 * - Use versioning: /api/v1/*, /api/v2/*
 * - Always return JSON
 * - Use appropriate rate limiting
 * - Use API authentication (token-based)
 */

import HyperExpress from 'hyper-express';
import Auth from "../app/middlewares/auth";
import UploadController from "../app/controllers/UploadController";
import S3Controller from "../app/controllers/S3Controller";

// Rate limiting middleware  
import {
    apiRateLimit,
    uploadRateLimit
} from "../app/middlewares/rateLimit";

const ApiRoute = new HyperExpress.Router();

/**
 * API v1 Routes
 * ------------------------------------------------
 */

// Health check
ApiRoute.get("/api/health", [apiRateLimit], (request, response) => {
    response.json({
        success: true,
        message: "API is running",
        timestamp: Date.now(),
        version: "1.0.0"
    });
});

/**
 * Upload Routes
 * ------------------------------------------------
 * POST /api/upload/image - Upload image with processing
 * POST /api/upload/file - Upload file (PDF, Word, Excel, etc.)
 */
ApiRoute.post("/api/upload/image", [Auth, uploadRateLimit], UploadController.uploadImage);
ApiRoute.post("/api/upload/file", [Auth, uploadRateLimit], UploadController.uploadFile);

/**
 * S3 Routes
 * ------------------------------------------------
 * POST /api/s3/signed-url - Generate signed URL for file upload
 * GET  /api/s3/public-url/:fileKey - Get public URL for existing file
 * GET  /api/s3/health - S3 service health check
 */
ApiRoute.post("/api/s3/signed-url", [Auth, uploadRateLimit], S3Controller.getSignedUrl);
ApiRoute.get("/api/s3/public-url/:fileKey", [apiRateLimit], S3Controller.getPublicUrl);
ApiRoute.get("/api/s3/health", [apiRateLimit], S3Controller.health);

/**
 * Example: User API Routes (uncomment and customize)
 * ------------------------------------------------
 * GET    /api/users     - List all users
 * GET    /api/users/:id - Get single user
 * POST   /api/users     - Create user
 * PUT    /api/users/:id - Update user
 * DELETE /api/users/:id - Delete user
 */
// ApiRoute.get("/api/users", [Auth, apiRateLimit], UserController.index);
// ApiRoute.get("/api/users/:id", [Auth, apiRateLimit], UserController.show);
// ApiRoute.post("/api/users", [Auth, apiRateLimit], UserController.store);
// ApiRoute.put("/api/users/:id", [Auth, apiRateLimit], UserController.update);
// ApiRoute.delete("/api/users/:id", [Auth, apiRateLimit], UserController.destroy);

export default ApiRoute;
