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
  ClockCircleOutlined,
} from "@ant-design/icons";
import FancyIconBox from "@/components/FancyIconBox";
import FancyCounting from "@/components/FancyCounting";
import { motion } from "framer-motion";

const { Title } = Typography;
const { useBreakpoint } = Grid;

type StatictisAdminProps = {
  month: number;
  totalInvoices: number;
  totalAmount: number;
  totalCustomers: number;
};

const currentYear = new Date().getFullYear();

const generateMockData = (): StatictisAdminProps[] =>
  Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    totalInvoices: Math.floor(Math.random() * 500 + 200),
    totalAmount: Math.floor(Math.random() * 50_000_000 + 10_000_000),
    totalCustomers: Math.floor(Math.random() * 100 + 50),
  }));

export default function AdminDashboardPage() {
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState<string | number>("all");
  const [data, setData] = useState<StatictisAdminProps[]>(generateMockData());

  const [dataTop, setDataTop] = useState({
    totalInvoices: 0,
    totalAmount: 0,
    totalCustomers: 0,
  });

  const screens = useBreakpoint();

  const monthOptions = [
    { label: "Tất cả", value: "all" },
    ...Array.from({ length: 12 }, (_, i) => ({
      label: `Tháng ${i + 1}`,
      value: i + 1,
    })),
  ];

  const isMobile = !screens.md;

  useEffect(() => {
    const timer = setTimeout(() => {
      const allData = generateMockData();
      setData(allData);

      const filtered =
        month === "all"
          ? allData
          : allData.filter((item) => item.month === Number(month));

      const totals = filtered.reduce(
        (acc, item) => ({
          totalInvoices: acc.totalInvoices + item.totalInvoices,
          totalAmount: acc.totalAmount + item.totalAmount,
          totalCustomers: acc.totalCustomers + item.totalCustomers,
        }),
        { totalInvoices: 0, totalAmount: 0, totalCustomers: 0 }
      );
      setDataTop(totals);
    }, 500);
    return () => clearTimeout(timer);
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
      categories: data.map((d) => `Tháng ${d.month}`),
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
        data: data.map((d) => d.totalAmount),
        color: "#1677ff",
      },
    ],
    plotOptions: {
      series: {
        animation: { duration: 800 },
      },
    },
  };

  const pieOptions = {
    chart: { type: "pie", backgroundColor: "transparent" },
    title: {
      text: "Số lượng dịch vụ",
      style: { fontWeight: "bold" },
    },
    credits: { enabled: false },
    tooltip: {
      pointFormat: "<b>{point.percentage:.1f}%</b>",
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: "pointer",
        dataLabels: {
          enabled: true,
          distance: 20,
          style: {
            color: "#333",
            fontSize: "13px",
            textOutline: "none",
          },
          format: "<b>{point.name}</b>: {point.percentage:.1f} %",
          filter: {
            property: "percentage",
            operator: ">",
            value: 1,
          },
        },
        showInLegend: true,
      },
    },
    series: [
      {
        name: "Tỉ lệ",
        colorByPoint: true,
        data: [
          { name: "Spa", y: 45 },
          { name: "Clinic", y: 30 },
          { name: "Salon", y: 25 },
        ],
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
            <Typography.Text strong style={{ whiteSpace: "nowrap" }}>
              Tháng:
            </Typography.Text>
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
            <Typography.Text strong style={{ whiteSpace: "nowrap" }}>
              Năm:
            </Typography.Text>
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
              Dịch vụ mới
            </Title>
            <FancyCounting
              className="text-light"
              to={Math.floor(Math.random() * 100 + 20)}
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
                <FireOutlined style={{ color: "#ff4d4f", marginRight: 8 }} />
                Top dịch vụ được đặt nhiều nhất
              </span>
            }
          >
            {[
              { name: "Gội đầu dưỡng sinh", count: 145 },
              { name: "Chăm sóc da mặt", count: 120 },
              { name: "Massage toàn thân", count: 95 },
              { name: "Cắt tóc cao cấp", count: 80 },
              { name: "Giảm béo công nghệ", count: 60 },
            ].map((item, idx, arr) => {
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
                        background: "linear-gradient(90deg, #1890ff, #36cfc9)",
                      }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <span>
                <StarOutlined style={{ color: "#faad14", marginRight: 8 }} />
                Khách hàng thân thiết
              </span>
            }
          >
            {[
              { name: "Nguyễn Thị Lan", total: 12 },
              { name: "Trần Minh Quân", total: 10 },
              { name: "Lê Hoàng Anh", total: 9 },
              { name: "Phạm Thảo Vy", total: 7 },
              { name: "Đỗ Nhật Nam", total: 6 },
            ].map((item, idx) => (
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
                      ][idx],
                    }}
                  />
                  <span>{item.name}</span>
                </div>
                <Tag color="blue">{item.total} lượt</Tag>
              </motion.div>
            ))}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card
            title={
              <span>
                <ClockCircleOutlined
                  style={{ color: "#52c41a", marginRight: 8 }}
                />
                Hoạt động gần đây
              </span>
            }
          >
            {[
              "Khách hàng Trần Văn A đã đặt lịch mới.",
              "Dịch vụ 'Massage toàn thân' được thêm vào hệ thống.",
              "Nhân viên Lê Minh cập nhật trạng thái đơn hàng.",
              "Khách hàng Nguyễn Thị B hoàn tất thanh toán.",
            ].map((text, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="d-flex align-items-center justify-content-between py-2"
                style={{ borderBottomWidth: "1px", borderColor: "#F3F4F6" }}
              >
                <span>{text}</span>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {`${Math.floor(Math.random() * 60)} phút trước`}
                </Typography.Text>
              </motion.div>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
