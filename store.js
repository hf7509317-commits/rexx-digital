const { store } = require('./lib/common');
module.exports = (req,res) => res.status(200).json({
  storeName:store.storeName, tagline:store.tagline, profileImage:store.profileImage,
  adminContact:store.adminContact, categories:store.categories
});
