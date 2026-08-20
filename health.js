const { store } = require('./lib/common');
module.exports = (req,res) => res.status(200).json({ok:true,store:store.storeName,mode:'VERCEL SERVERLESS'});
