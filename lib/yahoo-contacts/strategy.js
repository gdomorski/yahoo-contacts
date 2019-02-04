'use strict';

var util = require('util'),
	OAuth2Strategy = require('passport-oauth2').Strategy,
	InternalOAuthError = require('passport-oauth2').InternalOAuthError,
  request = require('request');

function Strategy(options, verify) {
  options = options || {};

  options.authorizationURL = options.authorizationURL || 'https://api.login.yahoo.com/oauth2/request_auth';
  options.tokenURL = options.tokenURL || 'https://api.login.yahoo.com/oauth2/get_token';
  this.profileURL = options.profileURL || 'https://social.yahooapis.com/v1/user/me/profile?format=json';
  this.contactsURL = options.contactsUrl || 'https://social.yahooapis.com/v1/user/me/contacts'

  OAuth2Strategy.call(this, options, verify);
  this._options = options;
  this.name = 'yahoo';
  this._oauth2.get = (url, options) => {
    return new Promise((resolve, reject) => {
      request.get({
        url: url,
        ...options
      }, (error, res, body) => {
        if (!error && res.statusCode == 200) {
          resolve({body, res});
        } else {
          reject((new InternalOAuthError('Failed to get contacts', err)))
        }
      });
    });
  }
}

util.inherits(Strategy, OAuth2Strategy);

Strategy.prototype.userProfile = async function (accessToken, done) {

  this._oauth2._useAuthorizationHeaderForGET = true;

  const options = {
    headers: {
      Authorization: this._oauth2.buildAuthHeader(accessToken)
    },
    rejectUnauthorized: false,
    json: true
  }

  const {body: profileContent, res: profileRes} = await this._oauth2.get(this.profileURL, options)
  const {body: userContacts, res: contactsRes} = await this._oauth2.get(this.contactsURL, options)
  const { contacts: { contact }} = userContacts

  const allContacts = []
  contact.forEach(contact => {
    let personsName = contact.fields.givenName + contact.fields.familyName
    contact.fields.forEach(field => {
      if(field.type === 'name') {
        personsName = field.value.givenName + " " + field.value.familyName
      } else if (field.type === 'email'){
        allContacts.push({name: personsName, email: field.value})
      } else if (field.type === 'phone'){
        allContacts.push({name: personsName, phone: field.value})
      }
    })
  })

  const json = profileContent.profile;
  json.id = json.guid;

  const profile = {
    provider: 'yahoo',
    id: json.id,
    displayName: [json.givenName || '', json.familyName || ''].join(' '),
    name: {
      familyName: json.familyName || '',
      givenName: json.givenName || ''
    },
    _raw: profileContent,
    _json: json,
    contacts: allContacts
  };

  done(null, profile);

};


module.exports = Strategy;