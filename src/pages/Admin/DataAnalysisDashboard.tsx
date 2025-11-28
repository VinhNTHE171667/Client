import React, { useEffect, useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RFMData {
  customer_id: string;
  full_name: string;
  Cluster: number;
  Cluster_Name: string;
  recency: number;
  frequency: number;
  monetary: number;
}

interface ComboRecommendation {
  combo: string[];
  if_buy: string[];
  then_recommend: string[];
  support: number;
  confidence: number;
  lift: number;
}

interface ComboResult {
  success: boolean;
  message: string;
  recommendations: ComboRecommendation[];
  total_transactions?: number;
}

interface ChurnPrediction {
  customer_id: number;
  full_name: string;
  phone: string;
  days_absent: number;
  avg_cycle: number;
  risk_level: string;
  reason: string;
  action_suggest: string;
}

const DataAnalysisDashboard: React.FC = () => {
  const [rfmData, setRfmData] = useState<RFMData[]>([]);
  const [comboData, setComboData] = useState<ComboResult | null>(null);
  const [churnData, setChurnData] = useState<ChurnPrediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rfmRes, comboRes, churnRes] = await Promise.all([
          fetch('http://localhost:8000/rfm-clusters'),
          fetch('http://localhost:8000/combo-recommendations'),
          fetch('http://localhost:8000/churn-prediction')
        ]);

        const rfmJson = await rfmRes.json();
        const comboJson = await comboRes.json();
        const churnJson = await churnRes.json();

        setRfmData(rfmJson);
        setComboData(comboJson);
        setChurnData(churnJson);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading Data Analysis...</div>;

  // Transform data cho Bubble Chart
  const chartData = rfmData.map(d => ({
    x: d.recency,
    y: d.frequency,
    z: d.monetary / 1000000,  // Size: triệu VNĐ
    cluster: d.Cluster_Name,
    name: d.full_name,
    monetary: d.monetary
  }));

  const colors = {
    'VIP (Trung thành & Chi nhiều)': '#FFD700',
    'Nguy cơ rời bỏ (Lâu không đến)': '#FF0000',
    'Khách vãng lai (Chi ít)': '#0000FF',
    'Khách tiềm năng': '#00FF00'
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Phân Tích Dữ Liệu Khách Hàng</h1>

      {/* RFM Clustering Section */}
      <div style={{ marginBottom: '40px' }}>
        <h2>RFM Clustering Analysis</h2>
        <div style={{ width: '100%', height: 600 }}>
          <ResponsiveContainer>
            <ScatterChart>
              <CartesianGrid />
              <XAxis type="number" dataKey="x" name="Recency (ngày)" />
              <YAxis type="number" dataKey="y" name="Frequency (lần)" />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(value, name) => {
                  if (name === 'Size') return [`${value} triệu VNĐ`, 'Monetary'];
                  return [value, name];
                }}
              />
              <Legend />
              {Object.keys(colors).map(cluster => (
                <Scatter
                  key={cluster}
                  name={cluster}
                  data={chartData.filter(d => d.cluster === cluster)}
                  fill={colors[cluster as keyof typeof colors]}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Combo Recommendations Section */}
      <div>
        <h2>Combo Service Recommendations (Apriori Analysis)</h2>
        {comboData?.success ? (
          <div>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              {comboData.message} | Tổng số giao dịch: {comboData.total_transactions}
            </p>
            {comboData.recommendations.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                {comboData.recommendations.map((rec, index) => (
                  <div key={index} style={{
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '15px',
                    backgroundColor: '#f9f9f9'
                  }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>
                      Combo {index + 1}
                    </h3>
                    <div style={{ marginBottom: '10px' }}>
                      <strong>Nếu mua:</strong> {rec.if_buy.join(', ')}
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <strong>Đề xuất thêm:</strong> {rec.then_recommend.join(', ')}
                    </div>
                    <div style={{ fontSize: '0.9em', color: '#666' }}>
                      <div>Support: {rec.support}</div>
                      <div>Confidence: {rec.confidence}</div>
                      <div>Lift: {rec.lift}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>Không có combo nào được tìm thấy với ngưỡng hiện tại.</p>
            )}
          </div>
        ) : (
          <div style={{ color: 'red' }}>
            <p>{comboData?.message || 'Không thể tải dữ liệu combo'}</p>
          </div>
        )}
      </div>

      {/* Churn Prediction Section */}
      <div style={{ marginTop: '40px' }}>
        <h2>⚠️ Cảnh báo Khách hàng có nguy cơ rời bỏ (Churn Prediction)</h2>
        {churnData.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
            {churnData.map((customer) => (
              <div key={customer.customer_id} style={{
                border: '2px solid',
                borderColor: customer.risk_level === 'Nguy cơ cao' ? '#ff4444' : '#ffaa00',
                borderRadius: '8px',
                padding: '15px',
                backgroundColor: customer.risk_level === 'Nguy cơ cao' ? '#fff5f5' : '#fffbf0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0, color: customer.risk_level === 'Nguy cơ cao' ? '#cc0000' : '#aa6600' }}>
                    {customer.risk_level === 'Nguy cơ cao' ? '🔴' : '🟡'} {customer.full_name}
                  </h3>
                  <span style={{
                    fontSize: '0.8em',
                    color: '#666',
                    backgroundColor: '#f0f0f0',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    {customer.days_absent} ngày
                  </span>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <strong>📞 SĐT:</strong> {customer.phone || 'N/A'}
                </div>

                <div style={{ marginBottom: '10px', fontSize: '0.9em', color: '#555' }}>
                  <strong>Lý do:</strong> {customer.reason}
                </div>

                <div style={{ marginBottom: '15px', fontSize: '0.9em', color: '#666' }}>
                  <div>Chu kỳ thường lệ: {customer.avg_cycle} ngày/lần</div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button style={{
                    flex: 1,
                    padding: '8px 12px',
                    backgroundColor: customer.action_suggest === 'Gửi SMS Voucher' ? '#007bff' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9em'
                  }}>
                    {customer.action_suggest === 'Gửi SMS Voucher' ? '📱 Gửi Voucher' : '📞 Gọi điện'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: '#f8fff8',
            border: '2px solid #28a745',
            borderRadius: '8px'
          }}>
            <h3 style={{ color: '#28a745', margin: '0 0 10px 0' }}>✅ Tốt!</h3>
            <p style={{ color: '#666', margin: 0 }}>Hiện tại không có khách hàng nào có nguy cơ rời bỏ.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataAnalysisDashboard;