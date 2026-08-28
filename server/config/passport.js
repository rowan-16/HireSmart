const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

const getCallbackURL = () => {
  if (process.env.GOOGLE_CALLBACK_URL) return process.env.GOOGLE_CALLBACK_URL;
  const serverUrl = (process.env.SERVER_URL || 'https://hiresmart-4jfl.onrender.com').replace(/\/$/, '');
  return `${serverUrl}/api/auth/google/callback`;
};

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: getCallbackURL(),
    passReqToCallback: true,
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      console.log('[Google Profile Received]:', profile ? `${profile.displayName} <${profile.emails?.[0]?.value}>` : 'NO PROFILE');
      const googleAvatar = profile.photos?.[0]?.value || profile._json?.picture || '';
      let role = 'recruiter';
      if (req.query.state) {
        try {
          const decoded = JSON.parse(Buffer.from(req.query.state, 'base64').toString('utf8'));
          if (decoded && decoded.role) role = decoded.role;
        } catch (e) {
          if (req.query.state === 'candidate' || req.query.role === 'candidate') role = 'candidate';
        }
      }
      
      const email = profile.emails?.[0]?.value?.toLowerCase()?.trim();
      if (!email) return done(new Error('No email found in Google profile'), null);

      let user = await User.findOne({
        $or: [{ googleId: profile.id }, { email }]
      });

      if (user) {
        user.googleId = profile.id;
        user.role = role;
        if (googleAvatar) user.avatar = googleAvatar;
        if (profile.displayName && !user.name) user.name = profile.displayName;
        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });
      } else {
        user = await User.create({
          name: profile.displayName || email.split('@')[0],
          email: email,
          googleId: profile.id,
          avatar: googleAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName || email)}&background=4285F4&color=fff&bold=true`,
          role,
          lastLogin: new Date(),
        });
      }
      return done(null, user);
    } catch (err) {
      console.error('[Google Strategy Callback Error]:', err);
      return done(err, null);
    }
  }));
} else {
  console.warn('⚠️ GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing in environment. Using fallback login.');
}

module.exports = passport;
