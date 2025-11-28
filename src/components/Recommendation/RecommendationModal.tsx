import React, { useEffect, useState } from "react";
import { Modal, Button, Select, List, Card, InputNumber, Spin, Checkbox, message } from "antd";
import { getCustomerRecommendations, type RecommendationItem } from "@/services/recommendation";
import { useAuthStore } from "@/hooks/UseAuth";
import { useAddToCartMutation } from "@/services/cart";

const { Option } = Select;

type Props = { visible: boolean; onClose: () => void };

export default function RecommendationModal({ visible, onClose }: Props) {
  const { auth } = useAuthStore();
  const customerId = auth?.accountId ? String(auth.accountId) : "";
  const [k, setK] = useState<number>(4);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<(RecommendationItem & { qty:number; selected:boolean })[]>([]);

  useEffect(() => { if (visible) void fetchRecs(); }, [visible, k]);

  async function fetchRecs() {
    setLoading(true);
    try {
      if (!customerId) { setItems([]); return; }
      const res = await getCustomerRecommendations(customerId, { limit: k });
      setItems(res.items.map(it => ({ ...it, qty: 1, selected: true })));
    } catch (err) {
      console.error(err);
      message.error("Không lấy được gợi ý. Kiểm tra server recommendation.");
    } finally { setLoading(false); }
  }

  const [addToCart] = useAddToCartMutation();

  async function handleAddSelected() {
    const selected = items.filter((i) => i.selected);
    if (!selected.length) {
      message.info("Chọn ít nhất một dịch vụ để thêm.");
      return;
    }
    if (!customerId) {
      message.warning("Bạn cần đăng nhập để thêm dịch vụ gợi ý!");
      return;
    }

    try {
      for (const it of selected) {
        await addToCart({
          customerId,
          doctorId: it.doctorId ?? undefined,
          itemData: { itemId: it.serviceId, quantity: it.qty },
        }).unwrap();
      }
      message.success("Đã thêm dịch vụ gợi ý vào giỏ.");
      onClose();
    } catch (err) {
      console.error(err);
      message.error("Thêm vào giỏ thất bại.");
    }
  }

  function toggleSelect(index:number) { setItems(prev => { const a=[...prev]; a[index].selected = !a[index].selected; return a; }); }
  function changeQty(index:number, qty:number) { setItems(prev => { const a=[...prev]; a[index].qty = Number(qty||1); return a; }); }

  return (
    <Modal title="Gợi ý dịch vụ cho bạn" open={visible} onCancel={onClose} footer={[<Button key="cancel" onClick={onClose}>Đóng</Button>, <Button key="add" type="primary" onClick={handleAddSelected}>Thêm đã chọn vào giỏ</Button>]} width={850}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
        <div>Chọn số gợi ý</div>
        <Select value={k} onChange={(v)=>setK(Number(v))} style={{width:120}}>{Array.from({length:10}).map((_,i)=>(<Option key={i+1} value={i+1}>{i+1}</Option>))}</Select>
      </div>

      {loading ? <div style={{textAlign:'center',padding:40}}><Spin /></div> : (
        <List
          grid={{ gutter: 16, column: 3 }}
          dataSource={items}
          renderItem={(item, idx) => (
            <List.Item>
              <Card hoverable title={item.serviceName || `Dịch vụ #${item.serviceId}`} extra={<Checkbox checked={item.selected} onChange={()=>toggleSelect(idx)} />}>
                <div style={{minHeight:48}}>
                  <div style={{fontWeight:600}}>{item.price ? `${item.price}₫` : ''}</div>
                  <div style={{color:'#666',fontSize:12}}>{item.reason || ''}</div>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8}}>
                  <div style={{fontSize:12,color:'#666'}}>Số lượng</div>
                  <InputNumber min={1} max={10} value={item.qty} onChange={(v)=>changeQty(idx, Number(v||1))} />
                </div>
              </Card>
            </List.Item>
          )}
        />
      )}
    </Modal>
  );
}
