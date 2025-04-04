const express = require('express');
const serverless = require('serverless-http');
const { registerRoutes } = require('../../server/routes');
const passport = require('passport');
const { Strategy } = require('passport-local');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const { storage } = require('../../server/storage');

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());

// Session setup
app.use(
  session({
    cookie: { maxAge: 86400000 },
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    resave: false,
    secret: process.env.SESSION_SECRET || 'my-secret',
    saveUninitialized: false,
  })
);

// Passport auth setup
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new Strategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }

      // In production, you would use bcrypt to compare password hashes
      if (password !== user.password) {
        return done(null, false, { message: 'Incorrect password.' });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Register all routes
registerRoutes(app);

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

// Export the serverless handler
module.exports.handler = serverless(app);