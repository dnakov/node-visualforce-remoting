// var VF = require('./index.js')

// var vf = VF(process.env.SF_SERVER_URL, process.env.SF_USER, process.env.SF_PASSWORD, function(er, executeMethod) {
//   executeMethod('/apex/comm', 'Commissions.getData', ['employees'], function(er, res) {
//     console.log(er, res)
//   })
// })

var VF = require('./vfproxy')

VF('https://cs3.salesforce.com', '00DQ000000GKa6H!AR0AQM5xPcdq5zv4ot.2D.B_eUezlxqTZ03UuIcyElTuKyA4kzJ9RJ_WfMJed5IB4_d_ptQo_EuZTK6eyJ9CKSqBuA4IWCCH', function(er, executeMethod) {
  executeMethod('/apex/porthole__config', 'porthole.config.rawQuery', ['select'], (er, res) => {
    console.log(er, res)
  })
})
