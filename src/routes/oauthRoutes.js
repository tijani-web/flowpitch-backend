// oauthRoutes.js
import express from 'express';
import passport from '../passportSetup.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email }, 
    process.env.JWT_SECRET, 
    { expiresIn: '7d' }
  );
};

// Google OAuth
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  session: false 
}));

router.get('/google/callback', 
  passport.authenticate('google', { 
    session: false,
    failureRedirect: '/api/oauth/failure' 
  }),
  (req, res) => {
    try {
      const token = generateToken(req.user);
      
      // Redirect to frontend homepage (port 3000) with token
      res.redirect(`http://localhost:3000/oauth-success?token=${token}`);
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect('/api/oauth/failure');
    }
  }
);

// GitHub OAuth
router.get('/github', passport.authenticate('github', { 
  scope: ['user:email'],
  session: false 
}));

router.get('/github/callback', 
  passport.authenticate('github', { 
    session: false,
    failureRedirect: '/api/oauth/failure' 
  }),
  (req, res) => {
    try {
      const token = generateToken(req.user);
      
      // Redirect to frontend homepage (port 3000) with token
      res.redirect(`http://localhost:3000/oauth-success?token=${token}`)
    } catch (error) {
      console.error('GitHub callback error:', error);
      res.redirect('/api/oauth/failure');
    }
  }
);

// OAuth failure route
router.get('/failure', (req, res) => {
  res.status(401).json({
    success: false,
    message: 'OAuth authentication failed'
  });
});

export default router;