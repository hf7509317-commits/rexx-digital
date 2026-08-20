const { getProduct, makeOrderId, pakasirCreate, QRCode, saveOrder } = require('./lib/common');
module.exports = async (req,res) => {
  if (req.method !== 'POST') return res.status(405).json({error:'Method tidak diizinkan.'});
  try {
    const {items,buyer} = req.body || {};
    if (!Array.isArray(items) || !items.length) return res.status(400).json({error:'Keranjang kosong.'});
    if (!buyer || !buyer.name || !buyer.email || !buyer.username || !buyer.whatsapp) return res.status(400).json({error:'Data buyer belum lengkap.'});
    const normalized=[]; let amount=0;
    for (const item of items) {
      const p=getProduct(item.id); const qty=Math.max(1,Math.min(99,Number(item.qty)||1));
      if(!p) return res.status(400).json({error:`Produk ${item.id} tidak ditemukan.`});
      amount += p.price*qty; normalized.push({id:p.id,name:p.name,qty,unitPrice:p.price});
    }
    const orderId=makeOrderId();
    const payment=await pakasirCreate({orderId,amount});
    const order={orderId,items:normalized,amount,buyer:{
      name:String(buyer.name).slice(0,80),email:String(buyer.email).slice(0,120),username:String(buyer.username).slice(0,80),whatsapp:String(buyer.whatsapp).slice(0,25),note:String(buyer.note||'').slice(0,500)
    },status:'pending',createdAt:new Date().toISOString(),telegramNotified:false,
    payment:{method:payment.payment_method,paymentNumber:payment.payment_number,fee:payment.fee,totalPayment:payment.total_payment,expiredAt:payment.expired_at}};
    await saveOrder(order);
    const qrDataUrl=await QRCode.toDataURL(payment.payment_number,{width:500,margin:2,errorCorrectionLevel:'M'});
    res.status(200).json({orderId,amount,payment:{qrDataUrl,paymentNumber:payment.payment_number,totalPayment:payment.total_payment,expiredAt:payment.expired_at}});
  } catch(e) { console.error(e); res.status(500).json({error:e.message||'Gagal membuat pesanan.'}); }
};
