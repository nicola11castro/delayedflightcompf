/**
 * Portable email + password authentication.
 *
 * Replaces the Replit-only OpenID login so the app can run on any host.
 * Sessions live in the `sessions` table (connect-pg-simple), passwords are
 * scrypt hashes (Node built-in, no extra dependency), and the existing
 * `users` table, roles and consent flags are kept as they were.
 */
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";
import type { Express, RequestHandler } from "express";
import { pool } from "./db";
import { storage } from "./storage";
import { consentManager } from "./services/consent-manager";
import { emailService } from "./services/email";
import { appUrl } from "./config";
import {
  forgotPasswordSchema,
  loginSchema,
  registerUserSchema,
  resetPasswordSchema,
  type PublicUser,
  type User,
} from "@shared/schema";

const scrypt = promisify(scryptCallback) as (password: string, salt: string, keylen: number) => Promise<Buffer>;

declare global {
  namespace Express {
    // The logged-in user attached to req.user by passport (never includes the password hash).
    interface User extends PublicUser {}
  }
}

/** Emails that are granted senior admin automatically on register/login. */
const DEFAULT_ADMIN_EMAILS = ["pncastrodorion@gmail.com"];

export function adminEmails(): string[] {
  const configured = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  return configured.length > 0 ? configured : DEFAULT_ADMIN_EMAILS;
}

export function isConfiguredAdmin(email?: string | null): boolean {
  return !!email && adminEmails().includes(email.toLowerCase());
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored?: string | null): Promise<boolean> {
  if (!stored) return false;
  const [algorithm, salt, hashHex] = stored.split("$");
  if (algorithm !== "scrypt" || !salt || !hashHex) return false;
  const derived = await scrypt(password, salt, 64);
  const expected = Buffer.from(hashHex, "hex");
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

const TOKEN_TTL = {
  password_reset: 60 * 60 * 1000, // 1 hour
  email_verify: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function issueToken(userId: string, type: keyof typeof TOKEN_TTL): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await storage.createAuthToken(userId, type, hashToken(token), new Date(Date.now() + TOKEN_TTL[type]));
  return token;
}

/** Email a verification link; logs the link when SMTP is not configured so local testing still works. */
export async function sendVerificationEmail(user: User): Promise<void> {
  if (!user.email || user.emailVerified) return;
  const token = await issueToken(user.id, "email_verify");
  const link = `${appUrl()}/api/verify-email?token=${token}`;
  const sent = await emailService.sendEmailVerification(user.email, {
    firstName: user.firstName,
    link,
    language: user.preferredLanguage ?? "en",
  });
  if (!sent) console.log(`[auth] verification link for ${user.email}: ${link}`);
}

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

export function getSession() {
  const isProduction = process.env.NODE_ENV === "production";
  const secret = process.env.SESSION_SECRET;
  if (!secret && isProduction) {
    throw new Error("SESSION_SECRET must be set in production (any long random string).");
  }

  const sessionTtlMs = 7 * 24 * 60 * 60 * 1000; // 1 week
  const PgStore = connectPg(session);
  const store = new PgStore({
    pool,
    createTableIfMissing: false, // created by `npm run db:push`
    tableName: "sessions",
    ttl: sessionTtlMs / 1000,
  });

  return session({
    secret: secret || "dev-only-insecure-session-secret",
    store,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction, // plain http in local development
      sameSite: "lax",
      maxAge: sessionTtlMs,
    },
  });
}

async function syncAdminRole(user: User): Promise<User> {
  if (isConfiguredAdmin(user.email) && user.role !== "senior_admin") {
    return storage.updateUserRole(user.id, "senior_admin");
  }
  return user;
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({ usernameField: "email", passwordField: "password" }, async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email.trim().toLowerCase());
        if (!user || !(await verifyPassword(password, user.passwordHash))) {
          return done(null, false, { message: "Invalid email or password" });
        }
        return done(null, toPublicUser(await syncAdminRole(user)));
      } catch (error) {
        return done(error as Error);
      }
    }),
  );

  passport.serializeUser<string>((user, done) => done(null, user.id));
  passport.deserializeUser<string>(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user ? toPublicUser(user) : false);
    } catch (error) {
      done(error as Error);
    }
  });

  // Create an account, record the registration consents, and sign the user in.
  app.post("/api/register", async (req, res, next) => {
    try {
      const parsed = registerUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: parsed.error.errors[0]?.message ?? "Invalid registration data",
          errors: parsed.error.flatten().fieldErrors,
        });
      }
      const data = parsed.data;

      const existing = await storage.getUserByEmail(data.email);
      if (existing?.passwordHash) {
        return res.status(409).json({ message: "An account with this email already exists. Please sign in." });
      }

      const user = await storage.upsertUser({
        id: existing?.id ?? randomUUID(),
        email: data.email,
        passwordHash: await hashPassword(data.password),
        firstName: data.firstName,
        lastName: data.lastName,
        role: isConfiguredAdmin(data.email) ? "senior_admin" : existing?.role ?? "user",
        termsAccepted: true,
        privacyAccepted: true,
        dataRetentionAccepted: true,
        emailMarketingConsent: data.emailMarketingConsent,
        preferredLanguage: data.preferredLanguage,
      });

      sendVerificationEmail(user).catch((error) => console.error("Verification email failed:", error));

      const consentBase = {
        userEmail: data.email,
        userName: `${data.firstName} ${data.lastName}`,
        timestamp: new Date().toISOString(),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
        documentVersion: "1.0",
        agreed: true,
      };
      const consentTypes = ["terms", "privacy", "dataRetention", ...(data.emailMarketingConsent ? ["emailMarketing"] : [])];
      for (const consentType of consentTypes) {
        await consentManager.recordConsent({ ...consentBase, consentType });
      }

      const publicUser = toPublicUser(user);
      req.login(publicUser, (error) => {
        if (error) return next(error);
        res.status(201).json({ message: "Registration successful", user: publicUser });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    req.body = parsed.data;
    passport.authenticate("local", (error: Error | null, user: Express.User | false, info?: { message?: string }) => {
      if (error) return next(error);
      if (!user) return res.status(401).json({ message: info?.message ?? "Invalid email or password" });
      req.login(user, (loginError) => {
        if (loginError) return next(loginError);
        res.json({ message: "Login successful", user });
      });
    })(req, res, next);
  });

  // Old links pointed at /api/login (the Replit redirect); send them to the login page.
  app.get("/api/login", (_req, res) => res.redirect("/login"));

  const logout: RequestHandler = (req, res, next) => {
    req.logout((error) => {
      if (error) return next(error);
      req.session.destroy(() => {
        res.clearCookie("connect.sid");
        if (req.method === "GET") return res.redirect("/");
        res.json({ message: "Logged out" });
      });
    });
  };
  app.get("/api/logout", logout);
  app.post("/api/logout", logout);

  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json(req.user);
  });

  // Password reset: always answer 200 so the endpoint cannot be used to probe emails.
  app.post("/api/forgot-password", async (req, res) => {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "A valid email address is required" });
    }
    try {
      const user = await storage.getUserByEmail(parsed.data.email);
      if (user?.email) {
        const token = await issueToken(user.id, "password_reset");
        const link = `${appUrl()}/reset-password?token=${token}`;
        const sent = await emailService.sendPasswordReset(user.email, {
          firstName: user.firstName,
          link,
          language: user.preferredLanguage ?? "en",
        });
        if (!sent) console.log(`[auth] password reset link for ${user.email}: ${link}`);
      }
    } catch (error) {
      console.error("Forgot password error:", error);
    }
    res.json({ message: "If an account exists for that email, a reset link has been sent." });
  });

  app.post("/api/reset-password", async (req, res, next) => {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message ?? "Invalid request" });
    }
    try {
      const record = await storage.findValidAuthToken("password_reset", hashToken(parsed.data.token));
      if (!record) {
        return res.status(400).json({ message: "This reset link is invalid or has expired.", code: "TOKEN_INVALID" });
      }
      const user = await storage.updateUser(record.userId, {
        passwordHash: await hashPassword(parsed.data.password),
        emailVerified: true, // they proved control of the inbox
      });
      await storage.consumeAuthToken(record.id);
      const publicUser = toPublicUser(await syncAdminRole(user));
      req.login(publicUser, (error) => {
        if (error) return next(error);
        res.json({ message: "Password updated", user: publicUser });
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Could not reset password" });
    }
  });

  app.post("/api/verify-email/request", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      if (user.emailVerified) return res.json({ message: "Email already verified", verified: true });
      await sendVerificationEmail(user);
      res.json({ message: "Verification email sent", verified: false });
    } catch (error) {
      console.error("Verification request error:", error);
      res.status(500).json({ message: "Could not send verification email" });
    }
  });

  app.get("/api/verify-email", async (req, res) => {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    try {
      const record = token ? await storage.findValidAuthToken("email_verify", hashToken(token)) : undefined;
      if (!record) return res.redirect("/my-claims?verified=0");
      await storage.updateUser(record.userId, { emailVerified: true });
      await storage.consumeAuthToken(record.id);
      res.redirect("/my-claims?verified=1");
    } catch (error) {
      console.error("Verify email error:", error);
      res.redirect("/my-claims?verified=0");
    }
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Please sign in to continue" });
  }
  next();
};

export const isJuniorAdmin: RequestHandler = (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Please sign in to continue" });
  }
  if (!["junior_admin", "senior_admin"].includes(req.user.role ?? "user")) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

export const isSeniorAdmin: RequestHandler = (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Please sign in to continue" });
  }
  if (req.user.role !== "senior_admin") {
    return res.status(403).json({ message: "Senior admin access required" });
  }
  next();
};
