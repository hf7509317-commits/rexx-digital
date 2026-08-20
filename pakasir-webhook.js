const { getOrder, saveOrder, maybeNotify } = require('./lib/common');
module.exports = async (req,res) => {
  if(req.method!=='POST') return res.status(405).json({ok:false});
  try {
    const {order_id,amount,status,project,payment_method,completed_at}=req.body||{};
    if(!order_id || !amount || project!==process.env.PAKASIR_PROJECT) return res.status(400).json({ok:false});
    const order=await getOrder(order_id);
    if(!order || Number(order.amount)!==Number(amount)) return res.status(400).json({ok:false});
    order.status=status; order.payment.method=payment_method||order.payment.method; order.payment.completedAt=completed_at||null;
    await saveOrder(order); await maybeNotify(order);
    res.status(200).json({ok:true});
  } catch(e) { console.error(e); res.status(500).json({ok:false}); }
};
