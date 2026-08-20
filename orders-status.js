const { getOrder, pakasirDetail, saveOrder, maybeNotify } = require('./lib/common');
module.exports = async (req,res) => {
  const orderId=req.query.orderId;
  if(req.method!=='GET' || !orderId) return res.status(400).json({error:'Order ID tidak valid.'});
  const order=await getOrder(orderId);
  if(!order) return res.status(404).json({error:'Order tidak ditemukan.'});
  try {
    if(order.status==='pending') {
      const tx=await pakasirDetail({orderId:order.orderId,amount:order.amount});
      if(tx && tx.status && tx.status!==order.status) {
        order.status=tx.status; order.payment.completedAt=tx.completed_at||null; await saveOrder(order); await maybeNotify(order);
      }
    }
  } catch(e) { console.error('status check:',e.message); }
  res.status(200).json({orderId:order.orderId,status:order.status,amount:order.amount,expiredAt:order.payment.expiredAt});
};
