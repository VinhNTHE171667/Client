import React, { useEffect, useState } from "react";
import { Card, List, Button, Select, InputNumber, Spin, Checkbox, message } from "antd";
import { getCustomerRecommendations, type RecommendationItem } from "@/services/recommendation";
import { useAuthStore } from "@/hooks/UseAuth";
import { useAddToCartMutation } from "@/services/cart";

const { Option } = Select;

export default function RecommendationSidebar() {
  const { auth } = useAuthStore();
  const customerId = auth?.accountId ? String(auth.accountId) : "";
  const [k, setK] = useState<number>(4);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<(RecommendationItem & { qty:number; selected:boolean })[]>([]);

  useEffect(() => { void fetchRecs(); }, [k]);

  async function fetchRecs() {
    setLoading(true);
    try {
      if (!customerId) { setItems([]); return; }
      const res = await getCustomerRecommendations(customerId, { limit: k });
      setItems(res.items.map(it => ({ ...it, qty: 1, selected: true })));
    } catch (err) {
      console.error(err);
      message.error("Không lấy được gợi ý.");
    } finally { setLoading(false); }
  }

  const [addToCart] = useAddToCartMutation();

  async function addSelected() {
    const sel = items.filter((i) => i.selected);
    if (!sel.length) {
      message.info("Chọn ít nhất 1 dịch vụ");
      return;
    }
    if (!customerId) {
      message.warning("Bạn cần đăng nhập để thêm vào giỏ");
      return;
    }

    try {
      for (const it of sel) {
        await addToCart({
          customerId,
          doctorId: it.doctorId ?? undefined,
          itemData: { itemId: it.serviceId, quantity: it.qty },
        }).unwrap();
      }
      message.success("Đã thêm vào giỏ");
    } catch (err) {
      console.error(err);
      message.error("Thêm vào giỏ thất bại");
    }
  }

  function toggle(i:number) { setItems(prev => { const a=[...prev]; a[i].selected = !a[i].selected; return a; }); }
  function changeQty(i:number, v:any) { setItems(prev => { const a=[...prev]; a[i].qty = Number(v||1); return a; }); }

  return (
    <div>
      <Card size="small" title="Gợi ý thêm dịch vụ" extra={<div style={{display:'flex',gap:8,alignItems:'center'}}><div>Số</div><Select value={k} onChange={(v)=>setK(Number(v))} style={{width:80}}>{Array.from({length:8}).map((_,i)=><Option key={i+1} value={i+1}>{i+1}</Option>)}</Select></div>}>
        {loading ? <div style={{textAlign:'center',padding:20}}><Spin /></div> : (
          <List
            itemLayout="horizontal"
            dataSource={items}
            renderItem={(it, idx) => (
              <List.Item actions={[<div key="qty">SL <InputNumber min={1} max={10} value={it.qty} onChange={(v)=>changeQty(idx, v)} /></div>] }>
                <List.Item.Meta
                  avatar={<Checkbox checked={it.selected} onChange={()=>toggle(idx)} />}
                  title={it.serviceName || `Dịch vụ #${it.serviceId}`}
                  description={<div><div style={{fontWeight:600}}>{it.price ? `${it.price}đ` : ''}</div><div style={{fontSize:12,color:'#666'}}>{it.reason}</div></div>}
                />
              </List.Item>
            )}
          />
        )}
        <div style={{textAlign:'right',marginTop:8}}><Button type="primary" onClick={addSelected}>Thêm đã chọn</Button></div>
      </Card>
    </div>
  );
}
