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
      console.log('[Google Profile Received]:', profile ? `${profile.displayName || profile._json?.name} <${profile.emails?.[0]?.value}>` : 'NO PROFILE');
      
      const email = profile.emails?.[0]?.value?.toLowerCase()?.trim();
      if (!email) return done(new Error('No email found in Google profile'), null);

      let role = 'recruiter';
      let passedName = '';
      if (req.query.state) {
        try {
          const decoded = JSON.parse(Buffer.from(req.query.state, 'base64').toString('utf8'));
          if (decoded && decoded.role) role = decoded.role;
          if (decoded && decoded.name) passedName = decoded.name;
        } catch (e) {
          if (req.query.state === 'candidate' || req.query.role === 'candidate') role = 'candidate';
        }
      }

      let googleAvatar = profile.photos?.[0]?.value || profile._json?.picture || profile._json?.avatar_url || profile._json?.picture_url || '';
      if (googleAvatar && googleAvatar.includes('googleusercontent.com')) {
        if (/=s\d+/.test(googleAvatar)) {
          googleAvatar = googleAvatar.replace(/=s\d+.*$/, '=s300-c');
        } else {
          googleAvatar = `${googleAvatar}=s300-c`;
        }
      }

      const googleName = (
        profile.displayName ||
        profile._json?.name ||
        (profile.name ? `${profile.name.givenName || ''} ${profile.name.familyName || ''}`.trim() : '') ||
        (profile._json?.given_name ? `${profile._json.given_name || ''} ${profile._json.family_name || ''}`.trim() : '') ||
        passedName ||
        email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      ).trim();

      let user = await User.findOne({
        $or: [{ googleId: profile.id }, { email }]
      });

      const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(googleName)}&background=4285F4&color=fff&size=128&bold=true`;

      if (user) {
        user.googleId = profile.id;
        user.role = role;
        if (googleAvatar) user.avatar = googleAvatar;
        if (!user.avatar) user.avatar = fallbackAvatar;
        if (googleName) user.name = googleName;
        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });
      } else {
        user = await User.create({
          name: googleName,
          email: email,
          googleId: profile.id,
          avatar: googleAvatar || fallbackAvatar,
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
