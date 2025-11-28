import { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  DatePicker,
  Space,
  Table,
  Button,
  Statistic,
  Tag,
  Empty,
  Typography,
  Alert,
  Avatar,
} from "antd";
import {
  DownloadOutlined,
  ProfileOutlined,
  ReloadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { showError, showSuccess } from "@/libs/toast";
import * as XLSX from "xlsx/dist/xlsx.full.min.js";
import { saveAs } from "file-saver";
import {
  useGetPaymentStatsMutation,
  type PaymentStatsResponse,
} from "@/services/appointment";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

export default function PaymentStatsPage() {
  // Mặc định là ngày hôm nay
  const todayStart = dayjs().startOf("day");
  const todayEnd = dayjs().endOf("day");

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    todayStart,
    todayEnd,
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<PaymentStatsResponse | null>(null);

  const [getPaymentStats] = useGetPaymentStatsMutation();

  const fetchStats = async (from?: string, to?: string) => {
    setIsLoading(true);
    try {
      const fromDate = from || dateRange[0].toISOString();
      const toDate = to || dateRange[1].toISOString();

      const res = await getPaymentStats({ fromDate, toDate }).unwrap();
      setStats(res);
      showSuccess("Thành công", "Tải thống kê thành công");
    } catch (error) {
      showError("Lỗi", "Không thể tải thống kê thanh toán");
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Tự động load khi vào trang và khi thay đổi dateRange
  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const handleRefresh = () => {
    fetchStats();
  };

  const handleExportExcel = () => {
    if (!stats || stats.cashiers.length === 0) {
      showError("Không có dữ liệu để xuất");
      return;
    }

    const rows: any[] = [
      {
        "Khoảng thời gian":
          dayjs(stats.fromDate).format("DD/MM/YYYY") +
          " - " +
          dayjs(stats.toDate).format("DD/MM/YYYY"),
      },
      {},
      { "Tổng thu tiền mặt": stats.totalCash.toLocaleString("vi-VN") + " ₫" },
      {
        "Tổng thu chuyển khoản":
          stats.totalTransfer.toLocaleString("vi-VN") + " ₫",
      },
      { "Tổng thu": stats.totalCollected.toLocaleString("vi-VN") + " ₫" },
      { "Số hóa đơn": stats.countInvoices },
      {},
      ...stats.cashiers.map((c) => ({
        "Thu ngân":
          c.name || c.cashierId === ""
            ? "Khách lẻ / Chuyển khoản trực tiếp"
            : c.name,
        "Tổng thu": c.total.toLocaleString("vi-VN") + " ₫",
      })),
    ];

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ThongKeThanhToan");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });
    saveAs(data, `ThongKeThanhToan_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`);
    showSuccess("Thành công", "Đã xuất file Excel");
  };

  // Xử lý tên thu ngân đẹp hơn
  const getCashierDisplayName = (record: any) => {
    if (!record.name && !record.cashierId) {
      return "Khách lẻ / Chuyển khoản trực tiếp";
    }
    return record.name || "Không xác định";
  };

  const columns = [
    {
      title: "STT",
      key: "index",
      width: 60,
      align: "center" as const,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "Thu ngân",
      key: "name",
      width: 250,
      render: (_: any, record: any) => (
        <Space>
          <Avatar
            icon={<UserOutlined />}
            size={32}
            style={
              !record.cashierId || record.cashierId === ""
                ? { backgroundColor: "#f0f0f0" }
                : {}
            }
          />
          <span>{getCashierDisplayName(record)}</span>
        </Space>
      ),
    },
    {
      title: "Tổng thu (₫)",
      dataIndex: "total",
      key: "total",
      align: "right" as const,
      width: 150,
      render: (total: number) => (
        <Text strong style={{ color: total > 0 ? "#52a868" : "#999" }}>
          {total.toLocaleString("vi-VN")}
        </Text>
      ),
      sorter: (a: any, b: any) => a.total - b.total,
    },
    {
      title: "% Tổng",
      key: "percentage",
      align: "right" as const,
      width: 100,
      render: (_: any, record: any) => {
        if (!stats || stats.totalCollected === 0)
          return <Tag color="green">0%</Tag>;
        const percentage = (
          (record.total / stats.totalCollected) *
          100
        ).toFixed(1);
        return <Tag color="green">{percentage}%</Tag>;
      },
    },
  ];

  return (
    <div className="container my-3">
      <Row className="mb-4">
        <Col span={24}>
          <Title
            level={2}
            className="text-center mb-1"
            style={{
              background: "linear-gradient(135deg, #52a868, #7cbd6f)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Thống kê Tài chính
          </Title>
          <Text
            type="secondary"
            className="d-block text-center"
            style={{
              background: "linear-gradient(135deg, #52a868, #7cbd6f)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontWeight: 600,
            }}
          >
            Theo dõi doanh thu theo phương thức và thu ngân
          </Text>
        </Col>
      </Row>

      {/* Bộ lọc */}
      <Card className="mb-4" title="Bộ lọc">
        <Row gutter={16} align="middle">
          <Col span={10}>
            <RangePicker
              value={dateRange}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setDateRange([dates[0], dates[1]]);
                }
              }}
              format="DD/MM/YYYY"
              placeholder={["Từ ngày", "Đến ngày"]}
              style={{ width: "100%" }}
            />
          </Col>
          <Col span={7}>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={isLoading}
              block
              style={{
                background: "linear-gradient(135deg, #52a868, #7cbd6f)",
                borderColor: "#52a868",
              }}
            >
              Tải lại
            </Button>
          </Col>
          <Col span={7}>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportExcel}
              disabled={!stats || stats.cashiers.length === 0}
              block
            >
              Xuất Excel
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Thẻ tổng quan */}
      {stats && (
        <Row gutter={24} className="mb-4">
          <Col span={6}>
            <Card>
              <Statistic
                title="Tổng thu tiền mặt"
                value={stats.totalCash}
                prefix="₫"
                valueStyle={{ color: "#faad14" }}
                formatter={(v) => Number(v).toLocaleString("vi-VN")}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Tổng thu chuyển khoản"
                value={stats.totalTransfer}
                prefix="₫"
                valueStyle={{ color: "#1890ff" }}
                formatter={(v) => Number(v).toLocaleString("vi-VN")}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Tổng thu"
                value={stats.totalCollected}
                prefix="₫"
                valueStyle={{ color: "#52a868" }}
                formatter={(v) => Number(v).toLocaleString("vi-VN")}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Số hóa đơn"
                value={stats.countInvoices}
                prefix={<ProfileOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Biểu đồ */}
      {stats && (stats.totalCash > 0 || stats.totalTransfer > 0) && (
        <Row gutter={24} className="mb-4">
          <Col span={12}>
            <Card title="Phân bổ phương thức thanh toán">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Tiền mặt", value: stats.totalCash },
                      { name: "Chuyển khoản", value: stats.totalTransfer },
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    <Cell fill="#faad14" />
                    <Cell fill="#1890ff" />
                  </Pie>
                  <Tooltip
                    formatter={(value: number) =>
                      `${value.toLocaleString("vi-VN")} ₫`
                    }
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Doanh thu theo thu ngân">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.cashiers.filter((c) => c.total > 0)}>
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tickFormatter={(v) => `${(v / 1000000).toFixed(1)}tr`}
                  />
                  <Tooltip
                    formatter={(v: number) => `${v.toLocaleString("vi-VN")} ₫`}
                  />
                  <Bar dataKey="total" fill="#722ed1" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      )}

      {stats ? (
        stats.cashiers.length > 0 ? (
          <Card title="Chi tiết thu theo thu ngân">
            <Table
              loading={isLoading}
              rowKey={(r) => r.cashierId || Math.random()}
              dataSource={stats.cashiers}
              columns={columns}
              pagination={{ pageSize: 10, showSizeChanger: true }}
            />
          </Card>
        ) : (
          <Empty description="Không có dữ liệu thu ngân trong khoảng thời gian này" />
        )
      ) : (
        <Card>
          <Alert
            message="Đang tải dữ liệu..."
            description="Vui lòng chờ một chút"
            type="info"
            showIcon
          />
        </Card>
      )}
    </div>
  );
}
