// var VF = require('./index.js')

// var vf = VF(process.env.SF_SERVER_URL, process.env.SF_USER, process.env.SF_PASSWORD, function(er, executeMethod) {
//   executeMethod('/apex/comm', 'Commissions.getData', ['employees'], function(er, res) {
//     console.log(er, res)
//   })
// })

var VF = require('./vfproxy')

VF('https://na40.salesforce.com', '00D460000016Itr!ARUAQEcOtnmrnG8i0wAfMDZujpeJml321ld_wpN56fZIZjT2zDBpGzu16cfN4ioByphibAnFWgQsCtg5dOI1sD7E5cgOLyI8', function(er, executeMethod) {
  executeMethod('/apex/config', 'porthole.config.getApiNames', [], (er, res) => {
    console.log(er, res)
  })
})
