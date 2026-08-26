const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `http://localhost:${process.env.PORT || 5000}/api/auth/google/callback`,
  passReqToCallback: true,
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    console.log('[Google Profile Received]:', profile ? `${profile.displayName} <${profile.emails?.[0]?.value}>` : 'NO PROFILE');
    const role = (req.query.state === 'candidate' || req.query.role === 'candidate') ? 'candidate' : 'recruiter';
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      const email = profile.emails?.[0]?.value;
      if (!email) return done(new Error('No email found in Google profile'), null);

      user = await User.findOne({ email });
      if (user) {
        user.googleId = profile.id;
        if (profile.photos?.[0]?.value) user.avatar = profile.photos[0].value;
        await user.save({ validateBeforeSave: false });
      } else {
        user = await User.create({
          name: profile.displayName || email.split('@')[0],
          email: email,
          googleId: profile.id,
          avatar: profile.photos?.[0]?.value || '',
          role,
        });
      }
    }
    return done(null, user);
  } catch (err) {
    console.error('[Google Strategy Callback Error]:', err);
    return done(err, null);
  }
}));

module.exports = passport;
