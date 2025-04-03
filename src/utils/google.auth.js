import GoogleStrategy from "passport-google-oauth20";
import jwt from "jsonwebtoken";

const googleAuth = (passport) => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:8000/auth/google/callback",
        scope: ["email", "profile"],
      },
      (accessToken, refreshToken, profile, cb) => {
        console.log("profile>>", profile._json);

        return cb(null, profile);
      }
    )
  );

  passport.serializeUser((user, done) => {
    console.log(user);
    return done(null, user);
  });

  passport.deserializeUser((profile, done) => {
    let token = jwt.sign({ token: profile }, process.env.ACCESS_TOKEN_SECRET);
    console.log(profile);
    console.log(token);
    return done(null, profile);
  });
};

export { googleAuth };
