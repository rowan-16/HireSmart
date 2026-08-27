const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

const getCallbackURL = () => {
  if (process.env.GOOGLE_CALLBACK_URL) return process.env.GOOGLE_CALLBACK_URL;
  if (process.env.SERVER_URL) return `${process.env.SERVER_URL.replace(/\/$/, '')}/api/auth/google/callback`;
  return '/api/auth/google/callback';
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
      const role = (req.query.state === 'candidate' || req.query.role === 'candidate') ? 'candidate' : 'recruiter';
      
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error('No email found in Google profile'), null);

        user = await User.findOne({ email });
        if (user) {
          user.googleId = profile.id;
          if (googleAvatar) user.avatar = googleAvatar;
          if (profile.displayName) user.name = profile.displayName;
          await user.save({ validateBeforeSave: false });
        } else {
          user = await User.create({
            name: profile.displayName || email.split('@')[0],
            email: email,
            googleId: profile.id,
            avatar: googleAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName || email)}&background=4285F4&color=fff&bold=true`,
            role,
          });
        }
      } else {
        if (googleAvatar) user.avatar = googleAvatar;
        if (profile.displayName) user.name = profile.displayName;
        await user.save({ validateBeforeSave: false });
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
