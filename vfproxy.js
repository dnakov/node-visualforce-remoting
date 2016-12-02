var request = require('request')

module.exports = function(serverUrl, sessionId, cb) {

  var JAR, VFURL, RCONTEXT
  var PAGE_CACHE = {}

  var firstDotPos = serverUrl.indexOf('.')
  VFURL = serverUrl.substr(0, firstDotPos) + '--c.' + serverUrl.substr(firstDotPos + 1)
  VFURL = VFURL.replace('my.salesforce', 'visual.force' )
  console.log(VFURL)

  var tok = sessionId
  JAR = request.jar()
  var cookie = request.cookie('sid=' + tok)
  JAR.setCookie(cookie, serverUrl)
  console.log('initializing')
  cb(null, executeMethod)
  return executeMethod

  function getPageTokens(vfpage, callback) {
    request({
      url: serverUrl + vfpage,
      jar: JAR,
      method: 'GET'
    }, function(er, res) {
      if(er) return cb(er)

      console.log('Parsing VF page: ' + vfpage)

      JAR.setCookie(JAR.getCookieString(VFURL))

      try {
        var remotingstuff = JSON.parse(res.body.split('Visualforce.remoting.Manager.add(new $VFRM.RemotingProviderImpl(')[1].split('));')[0])
      } catch(er) {
        return callback(er)
      }

      PAGE_CACHE[vfpage] = remotingstuff
      //return cb(null, executeMethod)
      return callback(null, remotingstuff)
    })
  }

  function _executeMethod(pageTokens, vfpage, method, data, cb) {
    var cls = method.split('.')[0]
    var mtd = method.split('.')[1]
    var _ctx = pageTokens.actions[cls].ms.filter( function(c) { return c.name === mtd } )
    var ctx = _ctx.length > 0 && _ctx[0]
    ctx.vid = pageTokens.vf.vid

    request({
      url: VFURL + '/apexremote',
      method: 'POST',
      jar: JAR,
      headers: {
        Referer: VFURL + vfpage,
        Origin: VFURL,
        'X-User-Agent': 'Visualforce-Remoting',
        DNT: '1',

      },
      json: true,
      body: {
        action: cls,
        ctx: ctx,
        method: mtd,
        type:'rpc',
        data: data,
        tid: 2
      }
    }, function(er, res) {
      if(er) return cb(er)
      cb(null,resolveRefs(res.body[0].result))
    })
  }

  function executeMethod(vfpage, method, data, cb) {
    var pageTokens = PAGE_CACHE[vfpage]
    if(!pageTokens) {
      getPageTokens(vfpage, function(er, pageTokens) {
         _executeMethod(pageTokens, vfpage, method, data, cb)
      })
    } else {
      _executeMethod(pageTokens, vfpage, method, data, cb)
    }
  }
}

function isArray(a) {
  return a && a.constructor === Array
}

function isObject(a) {
  return !!a && "[object Object]" === Object.prototype.toString.apply(a)
}

function isEmpty(a) {
  return void 0 === a || null === a || isArray(a) && 0 === a.length || "" === a
}

function __resolveRefs(a, b, c) {
  if (isArray(a)) {
    for (var d = c || [], g = 0; g < a.length; g++)
      d.push(__resolveRefs(a[g], b));
    return d
  }
  if (isObject(a)) {
    d = a.s;
    if (void 0 !== d)
      return a = a.v,
        g = isArray(a) ? [] : {},
        b[d] = g,
        __resolveRefs(a, b, g);
    d = a.r;
    if (void 0 !== d)
      return b[d];
    d = c || {};
    for (g in a)
      d[g] = __resolveRefs(a[g], b);
    return d
  }
  return a
}

function resolveRefs(a) {
  return !isEmpty(a) ? __resolveRefs(a, {}) : a
}
