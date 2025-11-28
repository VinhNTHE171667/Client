import {
  Card,
  Col,
  DatePicker,
  Input,
  Row,
  Space,
  Table,
  Select,
  Tag,
  Modal,
  Descriptions,
  Avatar,
  Typography,
  Button,
  Divider,
  Statistic,
  Collapse
} from "antd";
import { EyeOutlined, DownloadOutlined, UserOutlined, MoneyCollectOutlined, ProfileOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { showError } from "@/libs/toast";
import { useGetInvoiceMutation, type InvoiceProps } from "@/services/appointment";
import * as XLSX from "xlsx/dist/xlsx.full.min.js";
import { saveAs } from "file-saver";
import AvatarTable from "@/components/AvatarTable";
import NoAvatarImage from "@/assets/img/defaultAvatar.jpg";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

type AggregatedInvoice = {
  appointmentId: string;
  customer: InvoiceProps['customer'];
  appointmentDate: string;
  invoiceType: string;
  status: string;
  paymentMethods: string;
  totalFinalAmount: number;
  createdAt: string;
  details: InvoiceProps['details']; 
  depositInvoice?: InvoiceProps;
  finalInvoice?: InvoiceProps;
};

export default function InvoiceCasher() {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<InvoiceProps[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceProps[]>([]);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [getInvoice] = useGetInvoiceMutation();

  // Modal chi tiết
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AggregatedInvoice | null>(null);

  const handleGetInvoices = async () => {
    setIsLoading(true);
    try {
      const res = await getInvoice().unwrap();
      setInvoices(res ?? []);
    } catch (error) {
      showError("Lỗi", "Không thể tải danh sách hóa đơn");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleGetInvoices();
  }, []);

  // Group invoices by appointmentId
  const aggregatedInvoices = useMemo(() => {
    const grouped = invoices.reduce((acc: Record<string, AggregatedInvoice>, inv) => {
      const apptId = inv.appointment.id;
      if (!acc[apptId]) {
        acc[apptId] = {
          appointmentId: apptId,
          customer: inv.customer,
          appointmentDate: inv.appointment.appointment_date,
          invoiceType: 'Combined',
          status: inv.status,
          paymentMethods: `${inv.payment_method === "qr" ? "QR Code" : "Tiền mặt"} (${inv.invoice_type === "deposit" ? "Đặt cọc" : "Cuối"})`,
          totalFinalAmount: Number(inv.finalAmount || 0),
          createdAt: inv.createdAt,
          details: [...(inv.details || [])],
          depositInvoice: inv.invoice_type === 'deposit' ? inv : undefined,
          finalInvoice: inv.invoice_type === 'final' ? inv : undefined,
        };
      } else {
        // Combine payment methods if multiple
        const separator = acc[apptId].paymentMethods ? ', ' : '';
        acc[apptId].paymentMethods += separator + `${inv.payment_method === "qr" ? "QR Code" : "Tiền mặt"} (${inv.invoice_type === "deposit" ? "Đặt cọc" : "Cuối"})`;
        acc[apptId].totalFinalAmount += Number(inv.finalAmount || 0);
        acc[apptId].details.push(...(inv.details || []));
        if (inv.invoice_type === 'deposit') acc[apptId].depositInvoice = inv;
        if (inv.invoice_type === 'final') acc[apptId].finalInvoice = inv;
      }
      return acc;
    }, {});

    return Object.values(grouped);
  }, [invoices]);

  const filteredInvoices = aggregatedInvoices.filter((aggInv) => {
    const matchSearch =
      search === "" ||
      aggInv.customer?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      aggInv.customer?.email?.toLowerCase().includes(search.toLowerCase()) ||
      aggInv.appointmentId.includes(search);

    const matchStatus = !statusFilter || statusFilter === 'combined';

    const matchDate =
      !dateRange ||
      (dayjs(aggInv.createdAt).isAfter(dateRange[0].startOf("day")) &&
        dayjs(aggInv.createdAt).isBefore(dateRange[1].endOf("day")));

    return matchSearch && matchStatus && matchDate;
  });

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[], selectedRows: AggregatedInvoice[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
      // Map back to original invoices for export
      const originalInvoices = selectedRows.flatMap(agg => [
        agg.depositInvoice, 
        agg.finalInvoice 
      ].filter(Boolean) as InvoiceProps[]);
      setSelectedInvoices(originalInvoices);
    },
  };

  const handleExportExcel = () => {
    if (selectedInvoices.length === 0) {
      showError("Vui lòng chọn ít nhất 1 hóa đơn");
      return;
    }

    const rows: any[] = [];
    selectedInvoices.forEach((inv) => {
      rows.push({
        "Mã HD": inv.id,
        "Khách hàng": inv.customer?.full_name || "",
        Email: inv.customer?.email || "",
        "Ngày tạo": dayjs(inv.createdAt).format("DD/MM/YYYY HH:mm"),
        "Loại HD": inv.invoice_type === "final" ? "Thanh toán cuối" : "Đặt cọc",
        "Tổng tiền": Number(inv.total || 0).toLocaleString("vi-VN") + "đ",
        "Giảm giá": Number(inv.discount || 0).toLocaleString("vi-VN") + "đ",
        "Thành tiền": Number(inv.finalAmount || 0).toLocaleString("vi-VN") + "đ",
        "PTTT": inv.payment_method === "qr" ? "QR Code" : "Tiền mặt",
      });

      inv.details?.forEach((d) => {
        rows.push({
          "Mã HD": "",
          "Khách hàng": `→ ${d.service?.name} (x${d.quantity})`,
          Email: `Giá: ${Number(d.price).toLocaleString("vi-VN")}đ`,
        });
      });
      rows.push({}); // Separator
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "HoaDon");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, `HoaDon_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`);
  };

  const showDetailModal = (record: AggregatedInvoice) => {
    setSelectedAppointment(record);
    setIsModalOpen(true);
  };

  const columns = [
    {
      title: "STT",
      width: 70,
      align: "center",
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "Khách hàng",
      render: (_: any, record: AggregatedInvoice) => (
        <Space size={12}>
          <AvatarTable
            src={record.customer?.avatar ?? NoAvatarImage}
            alt="avatar"
            fallback={NoAvatarImage}
            size={40}
          />
          <div>
            <div className="font-semibold">{record.customer?.full_name}</div>
            <div className="text-xs text-gray-500">{record.customer?.phone}</div>
          </div>
        </Space>
      ),
    },
    {
      title: "Ngày hẹn",
      dataIndex: "appointmentDate",
      align: "center",
      width: 120,
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Loại HD",
      dataIndex: "invoiceType",
      align: "center",
      width: 120,
      render: () => <Tag color="blue">Kết hợp</Tag>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      align: "center",
      render: (status: string) => {
        const map: Record<string, { color: string; text: string }> = {
          completed: { color: "purple", text: "Hoàn tất" },
          paid: { color: "green", text: "Đã thanh toán" },
          pending: { color: "orange", text: "Chờ xử lý" },
        };
        const item = map[status] || { color: "default", text: status };
        return <Tag color={item.color}>{item.text}</Tag>;
      },
    },
    {
      title: "PT Thanh toán",
      dataIndex: "paymentMethods",
      align: "center",
      width: 180,
      render: (methods: string) => (
        <Space direction="vertical" size={0}>
          {methods.split(', ').map((method, index) => (
            <Tag key={index} color={method.includes('QR') ? "cyan" : "blue"} size="small">
              {method}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "Thành tiền cuối",
      dataIndex: "totalFinalAmount",
      align: "right",
      width: 150,
      render: (value: number) =>
        value.toLocaleString("vi-VN", {
          style: "currency",
          currency: "VND",
        }),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      align: "center",
      width: 160,
      render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm"),
      sorter: (a: AggregatedInvoice, b: AggregatedInvoice) =>
        dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
    {
      title: "Hành động",
      align: "center",
      width: 100,
      fixed: "right",
      render: (_: any, record: AggregatedInvoice) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => showDetailModal(record)}
          className="text-blue-600 hover:text-blue-800 p-0"
        />
      ),
    },
  ];

  return (
    <>
      <Row className="mx-2 my-4">
        <Col>
          <Title level={4} className="text-primary !mb-0">
            Quản lý Hoá đơn
          </Title>
        </Col>
      </Row>

      <Card>
        <Row justify="space-between" align="middle" className="mb-4">
          <Space size={16}>
            <Input.Search
              placeholder="Tìm tên, email, mã HD..."
              allowClear
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 300 }}
            />
            <RangePicker
              format="DD/MM/YYYY"
              onChange={(dates) => setDateRange(dates as any)}
            />
            <Select
              allowClear
              placeholder="Loại hóa đơn"
              style={{ width: 180 }}
              onChange={(v) => setStatusFilter(v)}
              options={[
                { label: "Kết hợp", value: "combined" },
              ]}
            />
          </Space>

          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExportExcel}
            disabled={selectedInvoices.length === 0}
          >
            Xuất Excel ({selectedInvoices.length})
          </Button>
        </Row>

        <Table
          loading={isLoading}
          rowKey="appointmentId"
          rowSelection={rowSelection}
          columns={columns}
          dataSource={filteredInvoices}
          scroll={{ x: 1300 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total, range) =>
              `Hiển thị ${range[0]}-${range[1]} của ${total} lịch hẹn`,
          }}
        />
      </Card>

      <Modal
        title={
          <Row align="middle" gutter={16}>
            <Col><ProfileOutlined style={{ fontSize: 20, color: '#1890ff' }} /></Col>
            <Col>
            <Title level={4} className="mb-0">Chi tiết lịch hẹn & hóa đơn</Title>
            <Text className="text-primary">{selectedAppointment?.appointmentId}</Text>
            </Col>
          </Row>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalOpen(false)}>
            Đóng
          </Button>,
        ]}
        width={1100}
        destroyOnClose
        className="modern-modal-invoice"
        style={{ top: 20 }}
      >
        {selectedAppointment && (
          <div className="space-y-6">
            {/* Header with Icons */}
            <Row gutter={24} align="middle" className="modern-header">
              <Col span={6} className="ml-2">
                <Space direction="vertical">
                  <Text strong className="text-lg">Ngày hẹn</Text>
                  <Tag color="cyan">
                    {dayjs(selectedAppointment.appointmentDate).format("DD/MM/YYYY HH:mm")}
                  </Tag>
                </Space>
              </Col>
              <Col span={6}>
                <Space direction="vertical">
                  <Text strong className="text-lg">Trạng thái</Text>
                  <Tag color="purple" className="modern-tag-large">
                    {selectedAppointment.status}
                  </Tag>
                </Space>
              </Col>
              <Col span={6} className="text-right">
                <Statistic
                  title="Tổng thành tiền cuối"
                  value={selectedAppointment.totalFinalAmount}
                  prefix={<MoneyCollectOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#52c41a', fontSize: 24 }}
                  formatter={(value) => value.toLocaleString("vi-VN")}
                />
              </Col>
            </Row>

            <Card 
              title={<Space><UserOutlined /> Thông tin khách hàng</Space>} 
              size="small" 
              className="modern-card mb-2"
              hoverable
            >
              <Descriptions bordered column={2} size="small" colon={false}>
                <Descriptions.Item label="Tên khách hàng" span={2}>
                  <Space>
                    <Avatar src={selectedAppointment.customer?.avatar ?? NoAvatarImage} size={48} />
                    <div>
                      <div className="font-semibold text-lg">{selectedAppointment.customer?.full_name}</div>
                      <div className="text-sm text-gray-600">
                        {selectedAppointment.customer?.phone} | {selectedAppointment.customer?.email}
                      </div>
                    </div>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Loại khách">
                  {selectedAppointment.customer?.customer_type === "vip" ? (
                    <Tag color="gold" icon={<CrownOutlined />}>VIP</Tag>
                  ) : (
                    <Tag color="default">Thường</Tag>
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Services Table */}
            <Card 
              title={<Space><ProfileOutlined /> Dịch vụ đã sử dụng</Space>} 
              size="small" 
              className="modern-card"
              hoverable
            >
              <Table
                dataSource={selectedAppointment.details || []}
                pagination={false}
                rowKey="id"
                size="small"
                bordered
                className="modern-table"
                columns={[
                  {
                    title: "Tên dịch vụ",
                    dataIndex: ["service", "name"],
                    render: (name: string, record: any) => (
                      <Space size="middle">
                        <div>
                          <div className="font-medium">{name}</div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {record.service?.description}
                          </Text>
                        </div>
                      </Space>
                    ),
                    width: 350,
                  },
                  { 
                    title: "SL", 
                    dataIndex: "quantity", 
                    width: 80, 
                    align: "center",
                  },
                  {
                    title: "Giá",
                    dataIndex: "price",
                    width: 120,
                    align: "right",
                    render: (v: string) =>
                      <Text strong>{Number(v).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}</Text>,
                  },
                  {
                    title: "Thành tiền",
                    width: 150,
                    align: "right",
                    render: (_: any, record: any) =>
                      <Text strong className="text-green-600">
                        {(Number(record.price) * record.quantity).toLocaleString("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        })}
                      </Text>,
                  },
                ]}
              />
            </Card>

            {/* Payment Breakdown */}
            <Card 
              title={<Space><MoneyCollectOutlined /> Chi tiết thanh toán</Space>} 
              size="small" 
              className="modern-card mb-2 mt-2"
              hoverable
            >
              <Row gutter={24} align="middle">
                {selectedAppointment.depositInvoice && (
                  <Col span={12}>
                    <Statistic
                      title="Hóa đơn đặt cọc"
                      value={Number(selectedAppointment.depositInvoice.finalAmount)}
                      prefix="₫"
                      valueStyle={{ color: '#faad14' }}
                      formatter={(value) => value.toLocaleString("vi-VN")}
                    />
                    <Tag color="orange" size="small" className="mt-2">
                      {selectedAppointment.depositInvoice.payment_method === "qr" ? "QR Code" : "Tiền mặt"}
                    </Tag>
                  </Col>
                )}
                {selectedAppointment.finalInvoice && (
                  <Col span={12}>
                    <Statistic
                      title="Hóa đơn thanh toán cuối"
                      value={Number(selectedAppointment.finalInvoice.finalAmount)}
                      prefix="₫"
                      valueStyle={{ color: '#52c41a' }}
                      formatter={(value) => value.toLocaleString("vi-VN")}
                    />
                    <Tag color="green" size="small" className="mt-2">
                      {selectedAppointment.finalInvoice.payment_method === "qr" ? "QR Code" : "Tiền mặt"}
                    </Tag>
                  </Col>
                )}
              </Row>
              <Divider />
              <Row justify="end" className="modern-total">
                <Col>
                  <Space>
                    <Text>Tổng cộng: </Text>
                    <Text strong className="text-2xl text-green-600">
                      {Number(selectedAppointment.totalFinalAmount).toLocaleString("vi-VN")}₫
                    </Text>
                  </Space>
                </Col>
              </Row>
            </Card>

            {/* Cashier Card */}
            {(selectedAppointment.finalInvoice?.cashier || selectedAppointment.depositInvoice?.cashier) && (
              <Card title={<Space><UserOutlined /> Thông tin thu ngân</Space>} size="small" className="modern-card" hoverable>
                <Descriptions bordered column={1} size="small" colon={false}>
                  {selectedAppointment.finalInvoice?.cashier && (
                    <Descriptions.Item label="Thu ngân cuối">
                      <Space>
                        <Avatar src={selectedAppointment.finalInvoice.cashier.avatar ?? NoAvatarImage} size={32} />
                        <div>
                          <div className="font-semibold">{selectedAppointment.finalInvoice.cashier.full_name}</div>
                          <div className="text-xs text-gray-500">{selectedAppointment.finalInvoice.cashier.email}</div>
                        </div>
                      </Space>
                    </Descriptions.Item>
                  )}
                  {selectedAppointment.depositInvoice?.cashier && selectedAppointment.depositInvoice.cashier !== selectedAppointment.finalInvoice?.cashier && (
                    <Descriptions.Item label="Thu ngân đặt cọc">
                      <Space>
                        <Avatar src={selectedAppointment.depositInvoice.cashier.avatar ?? NoAvatarImage} size={32} />
                        <div>
                          <div className="font-semibold">{selectedAppointment.depositInvoice.cashier.full_name}</div>
                          <div className="text-xs text-gray-500">{selectedAppointment.depositInvoice.cashier.email}</div>
                        </div>
                      </Space>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}