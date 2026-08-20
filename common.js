const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const store = require('../../config/store.config');
const products = require('../../public/products.server.json');

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(command, args=[]) {
  if (!redisUrl || !redisToken) throw new Error('UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN belum dikonfigurasi.');
  const r = await fetch(`${redisUrl.replace(/\/$/,'')}/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${redisToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([command, ...args])
  });
  const data = await r.json();
  if (!r.ok || data.error) throw new Error(data.error || 'Redis request gagal.');
  return data.result;
}

const key = id => `rexx:order:${id}`;
async function saveOrder(order) { await redis('SET', [key(order.orderId), JSON.stringify(order), 'EX', 86400]); }
async function getOrder(orderId) { const raw = await redis('GET', [key(orderId)]); return raw ? JSON.parse(raw) : null; }

function rupiah(n) {
  return new Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR', maximumFractionDigits:0 }).format(n);
}
function makeOrderId() {
  const d = new Date();
  const stamp = d.toISOString().replace(/\D/g,'').slice(0,14);
  return `${store.orderPrefix}-${stamp}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
}
function getProduct(id) { return products.find(p => p.id === id); }
function escapeHtml(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }

async function pakasirCreate({orderId, amount}) {
  if (!process.env.PAKASIR_PROJECT || !process.env.PAKASIR_API_KEY) throw new Error('PAKASIR_PROJECT / PAKASIR_API_KEY belum dikonfigurasi.');
  const r = await fetch('https://app.pakasir.com/api/transactioncreate/qris', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ project:process.env.PAKASIR_PROJECT, order_id:orderId, amount, api_key:process.env.PAKASIR_API_KEY })
  });
  const data = await r.json();
  if (!r.ok || !data.payment) throw new Error(data.message || 'Pakasir gagal membuat transaksi.');
  return data.payment;
}
async function pakasirDetail({orderId, amount}) {
  const u = new URL('https://app.pakasir.com/api/transactiondetail');
  u.searchParams.set('project', process.env.PAKASIR_PROJECT);
  u.searchParams.set('amount', String(amount));
  u.searchParams.set('order_id', orderId);
  u.searchParams.set('api_key', process.env.PAKASIR_API_KEY);
  const r = await fetch(u);
  const data = await r.json();
  if (!r.ok) throw new Error(data.message || 'Gagal mengecek transaksi.');
  return data.transaction;
}
async function telegramSend(text) {
  if (process.env.TELEGRAM_ENABLED !== 'true') return;
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) return;
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const r = await fetch(url, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({chat_id:process.env.TELEGRAM_CHAT_ID,text,parse_mode:'HTML',disable_web_page_preview:true})});
  if (!r.ok) console.error('Telegram notification failed:', await r.text());
}
function orderMessage(o) {
  return [
    '<b>REXX MARKET DIGITAL</b>', '<b>TRANSAKSI BERHASIL</b>', '',
    `<b>ORDER ID:</b> ${escapeHtml(o.orderId)}`,
    `<b>PRODUK:</b> ${o.items.map(x=>`${escapeHtml(x.name)} x${x.qty}`).join(', ')}`,
    `<b>TOTAL:</b> ${rupiah(o.amount)}`, '<b>STATUS:</b> PAID', '',
    '<b>DATA BUYER</b>', `Nama: ${escapeHtml(o.buyer.name)}`, `Email: ${escapeHtml(o.buyer.email)}`,
    `Username: ${escapeHtml(o.buyer.username)}`, `WhatsApp: ${escapeHtml(o.buyer.whatsapp)}`,
    o.buyer.note ? `Catatan: ${escapeHtml(o.buyer.note)}` : '',
    '', `Waktu: ${new Date().toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})}`
  ].filter(Boolean).join('\n');
}
async function maybeNotify(order) {
  if (order.status === 'completed' && !order.telegramNotified) {
    await telegramSend(orderMessage(order));
    order.telegramNotified = true;
    await saveOrder(order);
  }
}

module.exports = { store, products, QRCode, redis, saveOrder, getOrder, rupiah, makeOrderId, getProduct, pakasirCreate, pakasirDetail, maybeNotify };
