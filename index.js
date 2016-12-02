var request = require('request')
var login = require('./soap-login')
var vf = require('./vfproxy')

var loginInfo

function init(authUrl, username, password, cb) {
  login(authUrl, username, password, function(er, res) {
    if(er) return cb(er)
    loginInfo = res
    vf(loginInfo.serverUrl, loginInfo.sessionId, function(er, executeMethod) {
      cb(er, executeMethod)
    })
  })
}

module.exports = init


