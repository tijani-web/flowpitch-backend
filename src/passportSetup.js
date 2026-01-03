// passportSetup.js
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import prisma from '../lib/prisma.js';
import dotenv from 'dotenv';

dotenv.config();

// Serialize/Deserialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id }
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google Profile:', profile);
        
        // Check if user exists by Google ID or email
        let user = await prisma.users.findFirst({
          where: {
            OR: [
              { google_id: profile.id },
              { email: profile.emails[0].value },
              { avatar_url: profile.photos[0].value }
            ]
          }
        });

        if (!user) {
          // Create new user
          user = await prisma.users.create({
            data: {
              google_id: profile.id,
              email: profile.emails[0].value,
              name: profile.displayName,
              avatar_url: profile.photos[0].value,
            }
          });
        } else if (!user.google_id) {
          // Link Google account to existing user
          user = await prisma.users.update({
            where: { id: user.id },
            data: { google_id: profile.id }
          });
        }

        done(null, user);
      } catch (error) {
        console.error('Google OAuth Error:', error);
        done(error, null);
      }
    }
  )
);

// GitHub OAuth Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ['user:email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('GitHub Profile:', profile);
        
        // Get email from GitHub (might be null if not public)
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : `${profile.username}@users.noreply.github.com`;

        let user = await prisma.users.findFirst({
          where: {
            OR: [
              { github_id: profile.id },
              { email: email }
            ]
          }
        });

        if (!user) {
          user = await prisma.users.create({
            data: {
              github_id: profile.id,
              email: email,
              name: profile.displayName || profile.username,
              avatar_url: profile.photos[0].value,
              username: profile.username,
            }
          });
        } else if (!user.github_id) {
          user = await prisma.users.update({
            where: { id: user.id },
            data: { github_id: profile.id }
          });
        }

        done(null, user);
      } catch (error) {
        console.error('GitHub OAuth Error:', error);
        done(error, null);
      }
    }
  )
);

export default passport;