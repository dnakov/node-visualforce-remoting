var parseSoap, request, soap_login, xml2js;
request = require('request');
xml2js = require('xml2js');

soap_login = function(auth_url, username, password, cb) {
  var the_data;
  the_data = '';
  return request({
    uri: auth_url + "/services/Soap/c/38.0",
    method: 'POST',
    headers: {
      'Connection': 'keep-alive',
      'Content-Type': 'text/xml; charset=utf-8',
      'SOAPAction': '""'
    },
    body: '<Envelope xmlns="http://schemas.xmlsoap.org/soap/envelope/"><Body><login xmlns="urn:enterprise.soap.sforce.com"><username>' + username + '</username><password>' + password + '</password></login></Body></Envelope>'
  }).on('error', function(err) {
    return console.log('ERROR', err);
  }).on('data', function(data) {
    return the_data += data;
  }).on('end', function() {
    var xml;
    xml = the_data.toString();
    return xml2js.parseString(xml, function(err, data) {
      var er, ref, ref1, ref2, ref3, resp, serverUrl;
      if ((ref = data['soapenv:Envelope']['soapenv:Body'][0]['soapenv:Fault']) != null ? ref[0] : void 0) {
        er = (ref1 = data['soapenv:Envelope']['soapenv:Body'][0]['soapenv:Fault']) != null ? ref1[0] : void 0;
        console.log('broke', er);
        return cb(er);
      } else {
        resp = data['soapenv:Envelope']['soapenv:Body'][0].loginResponse[0].result[0];
        serverUrl = (ref2 = resp.serverUrl) != null ? ref2[0].split('/services/')[0] : void 0;
        return cb(err, {
          serverUrl: serverUrl,
          sessionId: (ref3 = resp.sessionId) != null ? ref3[0] : void 0
        });
      }
    });
  });
};


module.exports = soap_login
