import { useEffect, useState } from "react";
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
  const [getDashboard] = useDashboardMutation();
  const [loading, setLoading] = useState(false);

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
      const res = await getDashboard({
        year,
        month,
      }).unwrap();

      console.log(month, year, "DASHBOARD DATA", res);

      setDataTop({
        totalInvoices: res.totalInvoices,
        totalAmount: res.totalAmount,
        totalCustomers: res.totalCustomers,
      });

      setTopServices(res.topServices || []);
      setTopCustomers(res.topCustomers || []);

      const invoices = res.invoices || [];
      const monthlyTotals: Record<number, number> = {};

      invoices.forEach((inv) => {
        const m = new Date(inv.createdAt).getMonth() + 1;
        monthlyTotals[m] = (monthlyTotals[m] || 0) + Number(inv.total_amount);
      });

      const chartArr = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        total: monthlyTotals[i + 1] || 0,
      }));

      setChartData(chartArr);
    } catch (error) {
      console.error("Lỗi lấy dữ liệu dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGetData();
  }, [year, month]);

  const chartOptions = {
    chart: { type: "line", backgroundColor: "transparent" },
    title: { text: "Doanh thu theo tháng" },
    credits: { enabled: false },
    tooltip: {
      valueSuffix: " VNĐ",
      shared: true,
      backgroundColor: "#fff",
      borderColor: "#1677ff",
      style: { color: "#000" },
    },
    xAxis: {
      categories: chartData.map((d) => `Tháng ${d.month}`),
      labels: { style: { color: "#555" } },
    },
    yAxis: {
      title: { text: "VNĐ" },
      labels: {
        formatter: function (
          this: Highcharts.AxisLabelsFormatterContextObject
        ) {
          return this.value.toLocaleString("vi-VN");
        },
      },
    },
    series: [
      {
        name: "Doanh thu",
        data: chartData.map((d) => d.total),
        color: "#1677ff",
      },
    ],
    plotOptions: {
      series: { animation: { duration: 800 } },
    },
  };

  const pieOptions = {
    chart: {
      type: "pie",
      backgroundColor: "transparent",
    },
    title: {
      text: "Top 5 dịch vụ được đặt nhiều nhất",
      style: { fontWeight: "bold" },
    },
    credits: { enabled: false },
    tooltip: {
      pointFormat: "<b>{point.y} lượt đặt</b> ({point.percentage:.1f}%)",
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: "pointer",
        borderRadius: 5,
        dataLabels: {
          enabled: true,
          distance: 20,
          style: {
            color: "#333",
            fontSize: "13px",
            textOutline: "none",
          },
          format: "<b>{point.name}</b>: {point.y} lượt",
        },
        showInLegend: true,
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
        <Col xs={24} md={6}>
          <Card className="bg-gradient-danger" style={{ borderRadius: 12 }}>
            <FancyIconBox icon={<UserOutlined />} className="mb-3" />
            <Title level={5} className="text-light m-0">
              Khách hàng
            </Title>
            <FancyCounting
              className="text-light"
              to={dataTop.totalCustomers}
              duration={2}
              style={{ fontSize: 24, fontWeight: "bold" }}
            />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card className="bg-gradient-info" style={{ borderRadius: 12 }}>
            <FancyIconBox icon={<DollarOutlined />} className="mb-3" />
            <Title level={5} className="text-light m-0">
              Doanh thu
            </Title>
            <FancyCounting
              className="text-light"
              to={dataTop.totalAmount}
              duration={2}
              style={{ fontSize: 24, fontWeight: "bold" }}
              format={(value) =>
                value.toLocaleString("vi-VN", {
                  style: "currency",
                  currency: "VND",
                })
              }
            />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card className="bg-gradient-success" style={{ borderRadius: 12 }}>
            <FancyIconBox icon={<ShoppingCartOutlined />} className="mb-3" />
            <Title level={5} className="text-light m-0">
              Đơn hàng
            </Title>
            <FancyCounting
              className="text-light"
              to={dataTop.totalInvoices}
              duration={2}
              style={{ fontSize: 24, fontWeight: "bold" }}
            />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card className="bg-gradient-warning" style={{ borderRadius: 12 }}>
            <FancyIconBox icon={<ShoppingOutlined />} className="mb-3" />
            <Title level={5} className="text-light m-0">
              Dịch vụ
            </Title>
            <FancyCounting
              className="text-light"
              to={topServices.length}
              duration={2}
              style={{ fontSize: 24, fontWeight: "bold" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={16}>
          <Card>
            <HighchartsReact highcharts={Highcharts} options={chartOptions} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card>
            <HighchartsReact highcharts={Highcharts} options={pieOptions} />
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
