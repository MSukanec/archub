import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual, createHash } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

const SESSION_SECRET = process.env.SESSION_SECRET || 'constructbudget-dev-secret';
const SESSION_NAME = 'session_id';
const ONE_DAY = 1000 * 60 * 60 * 24; // 24 horas en milisegundos

async function hashPassword(password: string) {
  try {
    // Método principal usando scrypt (más seguro)
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  } catch (e) {
    console.error("Error al hashear password con scrypt, usando alternativa:", e);
    // Alternativa con SHA-256 para compatibilidad con los scripts
    const salt = Math.random().toString(36).substring(2, 15);
    const hash = createHash('sha256');
    hash.update(password + salt);
    return hash.digest('hex') + '.' + salt;
  }
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    if (!stored.includes('.')) {
      // Si no tiene formato hash.salt, comparación directa (para desarrollo)
      return supplied === stored;
    }
    
    const [hashed, salt] = stored.split(".");
    
    // Verificar si es probable que sea un hash hecho con scrypt (los hashes de scrypt tienen 64 bytes)
    if (hashed.length === 128) {
      try {
        const hashedBuf = Buffer.from(hashed, "hex");
        const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
        return timingSafeEqual(hashedBuf, suppliedBuf);
      } catch (e) {
        console.error("Error en comparación scrypt, intentando con sha256:", e);
      }
    }
    
    // Verificar con SHA-256 para compatibilidad con los scripts
    const hash = createHash('sha256');
    hash.update(supplied + salt);
    const suppliedHash = hash.digest('hex');
    return suppliedHash === hashed;
  } catch (e) {
    console.error("Error al comparar passwords:", e);
    
    // Como fallback en desarrollo, comparación directa
    if (process.env.NODE_ENV === 'development') {
      return supplied === stored;
    }
    
    return false;
  }
}

export function setupAuth(app: Express) {
  // Configurar almacenamiento de sesiones en PostgreSQL
  const PostgreSqlStore = connectPgSimple(session);
  const sessionStore = new PostgreSqlStore({
    pool,
    tableName: 'sessions', // Nombre de la tabla para sesiones
    createTableIfMissing: true // Crear tabla si no existe
  });
  
  const sessionSettings: session.SessionOptions = {
    secret: SESSION_SECRET,
    name: SESSION_NAME,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: ONE_DAY,
      sameSite: 'lax',
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Usuario no encontrado" });
        }
        
        // Si estamos en desarrollo, permitimos la comparación directa para facilitar el testing
        const isValidPassword = process.env.NODE_ENV === 'development' 
          ? (user.password === password) 
          : await comparePasswords(password, user.password);
          
        if (!isValidPassword) {
          return done(null, false, { message: "Contraseña incorrecta" });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Reemplazar rutas de autenticación existentes con passport
  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const { username, password, fullName, email } = req.body;
      
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "El nombre de usuario ya existe" });
      }

      // Hash de la contraseña para producción
      const hashedPassword = process.env.NODE_ENV === 'development' 
        ? password 
        : await hashPassword(password);

      const user = await storage.createUser({
        username,
        password: hashedPassword,
        fullName: fullName || null,
        email: email || null,
        avatarUrl: null
      });

      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(201).json({
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          avatarUrl: user.avatarUrl
        });
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: { message: string } | undefined) => {
      if (err) return next(err);
      if (!user) return res.status(401).json(info);
      
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        return res.json({
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          avatarUrl: user.avatarUrl
        });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((sessErr) => {
        if (sessErr) return next(sessErr);
        res.clearCookie(SESSION_NAME);
        return res.status(200).json({ message: "Logout successful" });
      });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    return res.json({
      id: req.user.id,
      username: req.user.username,
      fullName: req.user.fullName,
      email: req.user.email,
      avatarUrl: req.user.avatarUrl
    });
  });
}
