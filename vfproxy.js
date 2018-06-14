var request = require('request')

module.exports.getVFCredentials = (namespace, serverUrl, customDomain, sessionId, vfpage, callback) => {
  let VFURL, remotingstuff
  if(customDomain) {
    VFURL = serverUrl
  } else {
    if(!namespace || !namespace.length) namespace = 'c'
    
    let firstDotPos = serverUrl.indexOf('.')
    if(serverUrl.indexOf('my.salesforce') !== -1) {
      VFURL = serverUrl.substr(0, firstDotPos) + '--c.' + serverUrl.substr(firstDotPos + 1)
      VFURL = VFURL.replace('my.salesforce', 'visual.force' )
    } else {
      VFURL = serverUrl.substr(0, 8) + namespace + '.' + serverUrl.substr(8)
      VFURL = VFURL.replace('salesforce', 'visual.force')
    }
  }
  let tok = sessionId
 let JAR = request.jar()

  JAR.setCookie(request.cookie('sid=' + tok), VFURL)
  let url = VFURL + vfpage
  request({
      url: url,
      jar: JAR,
      method: 'GET'
    }, function(er, res) {
      if(er) return callback(er)
      VFURL = res.request.uri.protocol + '//' + res.request.uri.host
      try {
        remotingstuff = JSON.parse(res.body.split('Visualforce.remoting.Manager.add(new $VFRM.RemotingProviderImpl(')[1].split('));')[0])
      } catch(er) {
        return callback(er)
      }
      
      let cookies = JAR.getCookies(VFURL)
      let vfRemoteReq = {
        url: VFURL,
        vfpage,
        cookies: cookies.map(c => c.toString()),
        ctx: remotingstuff,
	sid: customDomain ? tok : null
      }
      return callback(null, vfRemoteReq)
    })
}

module.exports.apexremote = (vfRequest, method, data, cb) => {
  let { url: VFURL, cookies, vfpage, ctx: pageTokens } = vfRequest
  var lastDot = method.lastIndexOf('.')
  var cls = method.slice(0, lastDot)
  var mtd = method.slice(lastDot + 1)
  var _ctx = pageTokens.actions[cls].ms.filter( function(c) { return c.name === mtd } )
  var ctx = _ctx.length > 0 && _ctx[0]
  ctx.vid = pageTokens.vf.vid
  let JAR = request.jar()
  cookies.map(cookie => JAR.setCookie(cookie, VFURL + '/apexremote'))
  if(vfRequest.sid) JAR.setCookie(request.cookie('sid=' + vfRequest.sid), VFURL)
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
    if(res.headers['content-type'].indexOf('json') === -1) return cb({ message: 'Unknown Error, possibly needs a new token', statusCode: 402 })
    if(res.body[0].statusCode !== 200) return cb(res.body[0])
    cb(null,resolveRefs(res.body[0].result))
  })
  
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
