var VF = require('./index.js')

var vf = VF(process.env.SF_SERVER_URL, process.env.SF_USER, process.env.SF_PASSWORD, function(er, executeMethod) {
  executeMethod('/apex/comm', 'Commissions.getData', ['employees'], function(er, res) {
    console.log(er, res)
  })
})

