/**
 * Module dependencies.
 */
var InternalOAuthError = require('passport-oauth').InternalOAuthError;
var OAuth2Strategy = require('passport-oauth').OAuth2Strategy;
var parse = require('./profile').parse;
var uri = require('url');
var util = require('util');

/**
 * `Strategy` constructor.
 *
 * The FPP authentication strategy authenticates requests by delegating to
 * FPP using the OAuth 2.0 protocol.
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `done`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occured, `err` should be set.
 *
 * Options:
 *   - `returnURL`  URL to which FPP will redirect the user after authentication
 *   - `realm`      the part of URL-space for which an OpenID authentication request is valid
 *   - `profile`    enable profile exchange, defaults to _true_
 *
 * Examples:
 *
 *     passport.use(new FppStrategy({
 *         clientID: '123-456-789',
 *         clientSecret: 'shhh-its-a-secret'
 *         callbackURL: 'https://www.example.net/auth/example-oauth2orize/callback'
 *       },
 *       function (accessToken, refreshToken, profile, done) {
 *         User.findOrCreate(..., function (err, user) {
 *           done(err, user);
 *         });
 *       }
 *     ));
 *
 * @param {Object} options
 * @param {Function} verify
 * @api public
 */
function Strategy(options, verify) {
    options = options || {};
    options.authorizationURL = options.authorizationURL || options.authorizationUrl || 'http://auth.osufpp.org/dialog/authorize';
    options.tokenURL = options.tokenURL || options.tokenUrl || 'http://auth.osufpp.org/oauth/token';

    OAuth2Strategy.call(this, options, verify);

    // must be called after prototype is modified
    this.name = 'fpp';
    this._clientSecret = options.clientSecret;
    this._profileURL = options.profileURL || options.profileUrl || 'http://auth.osufpp.org/api/userinfo';
    this._profileFields = options.profileFields || null;
}

/**
 * Inherit from `OAuth2Strategy`.
 */
util.inherits(Strategy, OAuth2Strategy);

/**
 * Retrieve user profile from example-oauth2orize.
 *
 * This function constructs a normalized profile, with the following properties:
 *
 *   - `provider`         always set to `example-oauth2orize`
 *   - `id`
 *   - `username`
 *   - `displayName`
 *
 * @param {String} accessToken
 * @param {Function} done
 * @api protected
 */
Strategy.prototype.userProfile = function (accessToken, done) {
    var me = this;
    var url = uri.parse(this._profileURL);

    me._oauth2.get(url, accessToken, function (err, body, res) {
        var json;

        if (err) {
            return done(new InternalOAuthError('Failed to fetch user profile', err));
        }

        try {
            json = JSON.parse(body);
        } catch (ex) {
            return done(new Error('Failed to parse user profile'));
        }

        var profile = parse(json);
        profile.provider = me.name;
        profile._raw = body;
        profile._json = json;

        return done(null, profile);
    });
};

/**
 * Expose `Strategy`.
 */
module.exports = Strategy;
