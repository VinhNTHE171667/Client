import { useEffect, useState, useRef } from "react";
import {
  Card,
  Col,
  Row,
  Select,
  Typography,
  Space,
  Segmented,
  Grid,
  Tag,
  Avatar,
} from "antd";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import {
  DollarOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  StarOutlined,
  FireOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import FancyIconBox from "@/components/FancyIconBox";
import FancyCounting from "@/components/FancyCounting";
import { motion } from "framer-motion";
import { useDashboardMutation } from "@/services/auth";

const { Title } = Typography;
const { useBreakpoint } = Grid;

const currentYear = new Date().getFullYear();

export default function AdminDashboardPage() {
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'year' | 'month'>('year'); // Thêm viewMode
  const [getDashboard] = useDashboardMutation();
  const [loading, setLoading] = useState(false);
  const [fullDashboard, setFullDashboard] = useState(null);
  const pieChartRef = useRef<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Theo dõi trạng thái sidebar

  const [dataTop, setDataTop] = useState({
    totalInvoices: 0,
    totalAmount: 0,
    totalCustomers: 0,
  });

  const [chartData, setChartData] = useState<
    { month: number; total: number }[]
  >([]);
  const [topServices, setTopServices] = useState<
    { name: string; count: number }[]
  >([]);
  const [topCustomers, setTopCustomers] = useState<
    { name: string; total: number }[]
  >([]);

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const monthOptions = [
    { label: "Tất cả", value: 0 },
    ...Array.from({ length: 12 }, (_, i) => ({
      label: `Tháng ${i + 1}`,
      value: i + 1,
    })),
  ];

  const handleGetData = async () => {
    setLoading(true);
    try {
      const res = await getDashboard({ year, month }).unwrap();

      setFullDashboard(res);

      setDataTop({
        totalInvoices: res.totalInvoices || 0,
        totalAmount: res.totalAmount || 0,
        totalCustomers: res.totalCustomers || 0,
      });

      setTopServices(res.topServices || []);
      setTopCustomers(res.topCustomers || []);

      // Xử lý doanh thu theo tháng hoặc ngày
      if (month === 0) {
        // Hiển thị theo 12 tháng
        setViewMode('year');
        const monthlyTotals: Record<number, number> = {};

        (res.invoices || []).forEach((inv: any) => {
          const createdAt = new Date(
            inv.createdAt || inv.created_at || Date.now()
          );
          const m = createdAt.getMonth() + 1;
          const amount = parseFloat(inv.totalAmount || inv.total_amount || "0");

          if (!isNaN(amount)) {
            monthlyTotals[m] = (monthlyTotals[m] || 0) + amount;
          }
        });

        const chartArr = Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          total: monthlyTotals[i + 1] || 0,
        }));

        setChartData(chartArr);
      } else {
        // Hiển thị theo từng ngày trong tháng
        setViewMode('month');
        const daysInMonth = new Date(year, month, 0).getDate();
        const dailyTotals: Record<number, number> = {};

        (res.invoices || []).forEach((inv: any) => {
          const createdAt = new Date(
            inv.createdAt || inv.created_at || Date.now()
          );
          const m = createdAt.getMonth() + 1;
          const d = createdAt.getDate();
          const amount = parseFloat(inv.totalAmount || inv.total_amount || "0");

          if (m === month && !isNaN(amount)) {
            dailyTotals[d] = (dailyTotals[d] || 0) + amount;
          }
        });

        const chartArr = Array.from({ length: daysInMonth }, (_, i) => ({
          month: i + 1, // Sử dụng month cho day để tương thích
          total: dailyTotals[i + 1] || 0,
        }));

        setChartData(chartArr);
      }
    } catch (error) {
      console.error("Lỗi lấy dữ liệu dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGetData();
  }, [year, month]);

  // Thêm useEffect để theo dõi sidebar và update chart size
  useEffect(() => {
    const checkSidebarState = () => {
      // Kiểm tra icon trigger để xác định trạng thái sidebar
      const siderTrigger = document.querySelector('.ant-layout-sider-trigger');
      const sider = document.querySelector('.ant-layout-sider');
      
      let isCollapsed = false;
      
      if (sider) {
        // Check bằng class collapsed
        isCollapsed = sider.classList.contains('ant-layout-sider-collapsed');
        
        // Hoặc check bằng width
        if (!isCollapsed) {
          const width = sider.getBoundingClientRect().width;
          isCollapsed = width <= 80; // Sidebar collapsed thường có width khoảng 80px
        }
      }
      
      console.log('Sidebar collapsed:', isCollapsed); // Debug log
      setSidebarCollapsed(isCollapsed);
    };

    const handleReflow = () => {
      checkSidebarState();
      if (pieChartRef.current?.chart) {
        setTimeout(() => {
          pieChartRef.current.chart.reflow();
        }, 350);
      }
    };

    // Lắng nghe window resize
    window.addEventListener('resize', handleReflow);
    
    // Sử dụng MutationObserver để theo dõi thay đổi DOM (sidebar toggle)
    const observer = new MutationObserver(() => {
      handleReflow();
    });

    // Theo dõi thay đổi trên body
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class', 'style'],
      subtree: true,
      childList: true,
    });

    // Check initial state và trigger reflow
    const intervals = [100, 300, 500, 1000].map(delay =>
      setTimeout(() => {
        checkSidebarState();
        handleReflow();
      }, delay)
    );

    return () => {
      window.removeEventListener('resize', handleReflow);
      observer.disconnect();
      intervals.forEach(clearTimeout);
    };
  }, []);

  const chartOptions = {
    chart: { type: "line", backgroundColor: "transparent", height: 320 },
    title: { 
      text: month === 0 
        ? `Doanh thu năm ${year}` 
        : `Doanh thu tháng ${month}/${year}`, 
      style: { fontWeight: "bold" } 
    },
    credits: { enabled: false },
    tooltip: {
      shared: true,
      backgroundColor: "rgba(255,255,255,0.95)",
      borderColor: "#1677ff",
      style: { color: "#000" },
      formatter: function (this: any) {
        const index = this.point.index;
        const actualValue = chartData[index]?.month || this.x;
        if (month === 0) {
          return `<b>Tháng ${actualValue}</b><br/>Doanh thu: <b>${this.y.toLocaleString("vi-VN")} VNĐ</b>`;
        } else {
          return `<b>Ngày ${actualValue}</b><br/>Doanh thu: <b>${this.y.toLocaleString("vi-VN")} VNĐ</b>`;
        }
      },
    },
    xAxis: {
      categories: chartData.map((d) => viewMode === 'year' ? `Tháng ${d.month}` : `N-${d.month}`),
      labels: { 
        style: { color: "#666", fontSize: '9px' },
        rotation: -45,
        step: null, // Hiển thị tất cả labels
      },
      tickInterval: 1, // Đảm bảo mỗi ngày có tick
    },
    yAxis: {
      title: { text: "Doanh thu (VNĐ)" },
      labels: {
        formatter: function (this: any) {
          return (this.value / 1000000).toFixed(1) + "tr";
        },
      },
    },
    series: [
      {
        name: "Doanh thu",
        data: chartData.map((d) => d.total),
        color: "#1677ff",
        marker: { radius: 5 },
      },
    ],
    plotOptions: {
      line: {
        dataLabels: { enabled: false },
        animation: { duration: 1000 },
      },
    },
  };

  const pieOptions = {
    chart: {
      type: "pie",
      backgroundColor: "transparent",
      height: null,
      reflow: true,
    },
    title: {
      text: "Top 5 dịch vụ được đặt nhiều nhất",
      style: { fontWeight: "bold", fontSize: '16px' },
    },
    credits: { enabled: false },
    tooltip: {
      pointFormat: "<b>{point.y} lượt đặt</b> ({point.percentage:.1f}%)",
    },
    responsive: {
      rules: [{
        condition: {
          maxWidth: 500
        },
        chartOptions: {
          plotOptions: {
            pie: {
              size: '80%',
              dataLabels: {
                distance: 10,
                style: {
                  fontSize: '10px'
                }
              }
            }
          }
        }
      }]
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: "pointer",
        borderRadius: 5,
        size: sidebarCollapsed ? '70%' : '70%', // Giữ nguyên size
        center: ['50%', '50%'],
        dataLabels: {
          enabled: sidebarCollapsed, // Chỉ hiển thị label khi sidebar ĐÓNG
          connectorWidth: 2,
          connectorColor: '#999',
          distance: 15,
          style: {
            color: '#333',
            fontSize: '11px',
            textOutline: 'none',
            fontWeight: 'normal',
          },
          format: '{point.name}: {point.y} lượt',
        },
        showInLegend: !sidebarCollapsed, // Hiển thị legend khi sidebar MỞ (thay cho labels)
      },
    },
    series: [
      {
        type: "pie",
        name: "Lượt đặt",
        colorByPoint: true,
        data:
          topServices && topServices.length > 0
            ? topServices.map((item) => ({
                name: item.name,
                y: item.count,
              }))
            : [{ name: "Không có dữ liệu", y: 1, color: "#d9d9d9" }],
      },
    ],
  };

  return (
    <div style={{ padding: 24, background: "#f9fafc", minHeight: "100vh" }}>
      <Row className="mx-2 my-2">
        <Col>
          <Title
            level={3}
            style={{ marginBottom: 24 }}
            className="overview-title cus-text-primary"
          >
            Tổng quan hệ thống
          </Title>
        </Col>
      </Row>

      <Row gutter={[16, 16]} align="middle" className="mb-4">
        <Col>
          <Space align="center">
            <Typography.Text strong>Tháng:</Typography.Text>
            {isMobile ? (
              <Select
                value={month}
                onChange={setMonth}
                options={monthOptions}
                style={{ width: 140 }}
              />
            ) : (
              <Segmented
                options={monthOptions}
                value={month}
                onChange={setMonth}
              />
            )}
          </Space>
        </Col>
        <Col>
          <Space align="center">
            <Typography.Text strong>Năm:</Typography.Text>
            <Select
              value={year}
              style={{ width: 120 }}
              onChange={setYear}
              options={[
                { label: currentYear - 1, value: currentYear - 1 },
                { label: currentYear, value: currentYear },
                { label: currentYear + 1, value: currentYear + 1 },
              ]}
            />
          </Space>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {[
          {
            title: "Khách hàng",
            icon: <UserOutlined />,
            value: dataTop.totalCustomers,
            expected: dataTop.expectedCustomers,
            bg: "bg-gradient-danger",
          },
          {
            title: "Doanh thu",
            icon: <DollarOutlined />,
            value: fullDashboard?.actualRevenue,
            expected: fullDashboard?.expectedRevenue,
            type: "money",
            bg: "bg-gradient-info",
            onClickDetail: () => (window.location.href = "/casher/stats"),
          },
          {
            title: "Đơn hàng",
            icon: <ShoppingCartOutlined />,
            value: fullDashboard?.completedAppointments || 0,
            expected: fullDashboard?.totalAppointments,
            type: "number",
            bg: "bg-gradient-success",
            onClickDetail: () => (window.location.href = "/staff/orders"),
          },
          {
            title: "Dịch vụ",
            icon: <ShoppingOutlined />,
            value: topServices.length,
            bg: "bg-gradient-warning",
          },
        ].map((item, idx) => (
          <Col xs={24} md={6} key={idx}>
            <Card
              className={item.bg}
              style={{ borderRadius: 12, height: "100%", position: "relative" }}
              bodyStyle={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "100%",
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <FancyIconBox icon={item.icon} />
                <Title level={5} className="text-light m-0">
                  {item.title}
                </Title>
              </div>

              {/* Value + Dự kiến */}
              <div className="flex justify-between items-end mt-3">
                <FancyCounting
                  className="text-light"
                  to={item.value}
                  duration={2}
                  style={{ fontSize: 24, fontWeight: "bold" }}
                  format={(v) =>
                    item.type === "money"
                      ? v.toLocaleString("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        })
                      : v
                  }
                />
                {item.expected && item.expected >= 0 && (
                  <span
                    style={{
                      color: "rgba(255, 255, 255, 0.85)",
                      fontSize: 14,
                      fontWeight: 500,
                      fontStyle: "italic",
                      marginLeft: 4,
                    }}
                  >
                    Dự kiến:{" "}
                    {item.type === "money"
                      ? item.expected.toLocaleString("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        })
                      : item.expected}
                  </span>
                )}
              </div>

              {item.onClickDetail && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 12,
                    right: 12,
                  }}
                >
                  <ArrowRightOutlined
                    style={{ fontSize: 20, color: "white", cursor: "pointer" }}
                    onClick={item.onClickDetail}
                  />
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} className="mt-8">
        <Col xs={24} lg={16}>
          <Card title="Doanh thu theo tháng" className="shadow-md">
            <HighchartsReact highcharts={Highcharts} options={chartOptions} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card className="shadow-md" style={{ height: '100%' }}>
            <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HighchartsReact 
                key={`pie-chart-${sidebarCollapsed}`}
                highcharts={Highcharts} 
                options={pieOptions}
                ref={pieChartRef}
                containerProps={{ style: { height: '100%', width: '100%' } }}
              />
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <span>
                <StarOutlined style={{ color: "#faad14", marginRight: 8 }} />
                Khách hàng thân thiết
              </span>
            }
          >
            {topCustomers.length === 0 ? (
              <Typography.Text>Không có dữ liệu</Typography.Text>
            ) : (
              topCustomers.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="d-flex justify-content-between align-items-center py-2 border-b border-gray-100"
                >
                  <div className="d-flex align-items-center gap-2">
                    <Avatar
                      icon={<UserOutlined />}
                      style={{
                        backgroundColor: [
                          "#1890ff",
                          "#52c41a",
                          "#faad14",
                          "#eb2f96",
                          "#722ed1",
                        ][idx % 5],
                      }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <Tag color="blue">{item.total} lượt</Tag>
                </motion.div>
              ))
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <span>
                <FireOutlined style={{ color: "#ff4d4f", marginRight: 8 }} />
                Top dịch vụ được đặt nhiều nhất
              </span>
            }
          >
            {topServices.length === 0 ? (
              <Typography.Text>Không có dữ liệu</Typography.Text>
            ) : (
              topServices.map((item, idx, arr) => {
                const max = arr[0].count;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    style={{ marginBottom: 12 }}
                  >
                    <div className="d-flex justify-content-between font-medium mb-1">
                      <span>{item.name}</span>
                      <span>{item.count}</span>
                    </div>
                    <div
                      style={{
                        height: 8,
                        borderRadius: 6,
                        background: "#f5f5f5",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${(item.count / max) * 100}%`,
                          height: "100%",
                          background:
                            "linear-gradient(90deg, #1890ff, #36cfc9)",
                        }}
                      />
                    </div>
                  </motion.div>
                );
              })
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
