import LoginController from "../app/controllers/LoginController";
import RegisterController from "../app/controllers/RegisterController";
import PasswordController from "../app/controllers/PasswordController";
import ProfileController from "../app/controllers/ProfileController";
import OAuthController from "../app/controllers/OAuthController";
import Auth from "../app/middlewares/auth"
import PublicController from "../app/controllers/PublicController";
import AssetController from "../app/controllers/AssetController";
import StorageController from "../app/controllers/StorageController";
import HyperExpress from 'hyper-express';

// Rate limiting middleware
import {
  authRateLimit,
  passwordResetRateLimit,
  createAccountRateLimit,
} from "../app/middlewares/rateLimit";

const WebRoute = new HyperExpress.Router();

/**
 * Public Routes (SSR)
 * These routes serve HTML pages
 * ------------------------------------------------
 * GET  / - Home page (landing)
 */
WebRoute.get("/", PublicController.index);
WebRoute.get("/test", PublicController.test);

/**
 * Local Storage Static Files
 * Serves files from local storage
 * ------------------------------------------------
 * GET /storage/* - Serve local storage files
 */
WebRoute.get("/storage/*", StorageController.serveFile);

/**
 * Authentication Routes (Web)
 * Routes for handling user authentication with session
 * ------------------------------------------------
 * GET   /login - Login page
 * POST  /login - Process login
 * GET   /register - Registration page
 * POST  /register - Process registration
 * POST  /logout - Logout user
 * GET   /google/redirect - Google OAuth redirect
 * GET   /google/callback - Google OAuth callback
 */
WebRoute.get("/login", LoginController.loginPage);
WebRoute.post("/login", [authRateLimit], LoginController.processLogin);
WebRoute.get("/register", RegisterController.registerPage);
WebRoute.post("/register", [createAccountRateLimit], RegisterController.processRegister);
WebRoute.post("/logout", LoginController.logout);
WebRoute.get("/google/redirect", OAuthController.redirect);
WebRoute.get("/google/callback", OAuthController.googleCallback);

/**
 * Password Reset Routes
 * Routes for handling password reset
 * ------------------------------------------------
 * GET   /forgot-password - Forgot password page
 * POST  /forgot-password - Send reset password link
 * GET   /reset-password/:id - Reset password page
 * POST  /reset-password - Process password reset
 */
WebRoute.get("/forgot-password", PasswordController.forgotPasswordPage);
WebRoute.post("/forgot-password", [passwordResetRateLimit], PasswordController.sendResetPassword);
WebRoute.get("/reset-password/:id", PasswordController.resetPasswordPage);
WebRoute.post("/reset-password", [authRateLimit], PasswordController.resetPassword);

/**
 * Protected Routes (Inertia/Dashboard)
 * These routes require authentication
 * ------------------------------------------------
 * GET   /home - User dashboard
 * GET   /profile - User profile
 * POST  /change-profile - Update profile
 * POST  /change-password - Change password
 * DELETE /users - Delete users (admin only)
 */
WebRoute.get("/home", [Auth], ProfileController.homePage);
WebRoute.get("/profile", [Auth], ProfileController.profilePage);
WebRoute.post("/change-profile", [Auth], ProfileController.changeProfile);
WebRoute.post("/change-password", [Auth], PasswordController.changePassword);
WebRoute.delete("/users", [Auth], ProfileController.deleteUsers);

/**
 * Static Asset Handling Routes
 * ------------------------------------------------
 * /assets/:file - Compiled assets from dist/assets
 * /public/* - Static files from public directory
 */
WebRoute.get("/assets/:file", AssetController.distFolder);
WebRoute.get("/public/*", AssetController.publicFolder);

export default WebRoute;
