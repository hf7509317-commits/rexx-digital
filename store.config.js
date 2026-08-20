module.exports = {
  storeName: "REXX MARKET DIGITAL",
  tagline: "DIGITAL MARKETPLACE",
  profileImage: "/assets/store-profile.svg",
  adminContact: "@ADMIN_REXX",
  currency: "IDR",
  orderPrefix: "RXM",
  categories: ["SEMUA","PANEL HOSTING","VPS","BOT HOSTING","SOFTWARE","VOUCHER"],
  checkoutFields: ["name","email","username","whatsapp","note"],
  payment: {
    provider: "PAKASIR",
    method: "qris",
    qrisOnly: true,
    expiryMinutes: 15
  },
  telegram: {
    enabled: true
  }
};