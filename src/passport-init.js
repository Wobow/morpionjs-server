import passport from 'passport';
import passportJWT from "passport-jwt";
import User from './models/users';
import config from './config';

const ExtractJWT = passportJWT.ExtractJwt;
const JWTStrategy = passportJWT.Strategy;

export default () => {
  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());
  passport.use(User.createStrategy());

  passport.use(new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.secret
  },
    function (jwtPayload, cb) {
      return User.findOne({_id: jwtPayload._id})
        .then(user => {
          return cb(null, user);
        })
        .catch(err => {
          console.error(err);
          return cb(err);
        });
    }
  ));
};
