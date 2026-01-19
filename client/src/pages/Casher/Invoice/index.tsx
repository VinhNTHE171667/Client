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
} from "antd";
import {
  EyeOutlined,
  DownloadOutlined,
  UserOutlined,
  MoneyCollectOutlined,
  ProfileOutlined,
  DollarOutlined,
  CrownOutlined,
} from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { showError } from "@/libs/toast";
import {
  useGetInvoiceMutation,
  type InvoiceProps,
} from "@/services/appointment";
import * as XLSX from "xlsx/dist/xlsx.full.min.js";
import { saveAs } from "file-saver";
import AvatarTable from "@/components/AvatarTable";
import NoAvatarImage from "@/assets/img/defaultAvatar.jpg";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

type AggregatedInvoice = {
  appointmentId: string;
  customer: InvoiceProps["customer"];
  appointmentDate: string;
  invoiceType: string;
  status: string;
  paymentMethods: string;
  totalFinalAmount: number;
  createdAt: string;
  details: InvoiceProps["details"][0][]; // đã gộp, không trùng
  depositInvoice?: InvoiceProps;
  finalInvoice?: InvoiceProps;
};

export default function InvoiceCasher() {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<InvoiceProps[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceProps[]>([]);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null
  );
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [getInvoice] = useGetInvoiceMutation();

  // Modal chi tiết
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AggregatedInvoice | null>(null);

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

  // FIX TRÙNG DỊCH VỤ + GỘP CHÍNH XÁC
  const aggregatedInvoices = useMemo(() => {
    const grouped = invoices.reduce(
      (acc: Record<string, AggregatedInvoice>, inv) => {
        const apptId = inv.appointment.id;

        if (!acc[apptId]) {
          acc[apptId] = {
            appointmentId: apptId,
            customer: inv.customer,
            appointmentDate: inv.appointment.appointment_date,
            invoiceType: "Combined",
            status: inv.appointment.status,
            paymentMethods: "",
            totalFinalAmount: 0,
            createdAt: inv.createdAt,
            details: [],
            depositInvoice: undefined,
            finalInvoice: undefined,
          };
        }

        const group = acc[apptId];

        inv.details?.forEach((detail) => {
          const existing = group.details.find(
            (d) => d.serviceId === detail.serviceId
          );
          if (existing) {
            existing.quantity = detail.quantity;
          } else {
            group.details.push({ ...detail });
          }
        });

        const methodText = inv.payment_method === "qr" ? "QR Code" : "Tiền mặt";
        const typeText = inv.invoice_type === "deposit" ? "Đặt cọc" : "Cuối";

        if (group.paymentMethods.includes(methodText)) {
          group.paymentMethods = group.paymentMethods.replace(
            new RegExp(`${methodText}.*`),
            `${methodText} (${typeText})`
          );
        } else {
          group.paymentMethods +=
            (group.paymentMethods ? ", " : "") + `${methodText} (${typeText})`;
        }

        group.totalFinalAmount += Number(inv.finalAmount || 0);

        if (inv.invoice_type === "deposit") group.depositInvoice = inv;
        if (inv.invoice_type === "final") group.finalInvoice = inv;

        return acc;
      },
      {}
    );

    return Object.values(grouped);
  }, [invoices]);

  const filteredInvoices = aggregatedInvoices.filter((aggInv) => {
    const matchSearch =
      search === "" ||
      aggInv.customer?.full_name
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      aggInv.customer?.email?.toLowerCase().includes(search.toLowerCase()) ||
      aggInv.customer?.phone?.toLowerCase().includes(search.toLowerCase()) ||
      aggInv.appointmentId.includes(search);

    const matchDate =
      !dateRange ||
      (dayjs(aggInv.createdAt).isAfter(dateRange[0].startOf("day")) &&
        dayjs(aggInv.createdAt).isBefore(dateRange[1].endOf("day")));

    return matchSearch && matchDate;
  });

  const rowSelection = {
    selectedRowKeys,
    onChange: (
      newSelectedRowKeys: React.Key[],
      selectedRows: AggregatedInvoice[]
    ) => {
      setSelectedRowKeys(newSelectedRowKeys);
      const originalInvoices = selectedRows.flatMap((agg) =>
        [agg.depositInvoice, agg.finalInvoice].filter(Boolean)
      ) as InvoiceProps[];
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
        "Thành tiền":
          Number(inv.finalAmount || 0).toLocaleString("vi-VN") + "đ",
        PTTT: inv.payment_method === "qr" ? "QR Code" : "Tiền mặt",
      });

      inv.details?.forEach((d) => {
        rows.push({
          "Mã HD": "",
          "Khách hàng": `→ ${d.service?.name} (x${d.quantity})`,
          Email: `Giá: ${Number(d.price).toLocaleString("vi-VN")}đ`,
        });
      });
      rows.push({});
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
      align: "center" as const,
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
            <div className="text-xs text-gray-500">
              {record.customer?.phone}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Ngày hẹn",
      dataIndex: "appointmentDate",
      align: "center" as const,
      width: 120,
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Loại HD",
      align: "center" as const,
      width: 110,
      render: () => <Tag color="blue">Kết hợp</Tag>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      align: "center" as const,
      render: (status: string) => {
        const map: Record<string, { color: string; text: string }> = {
          completed: { color: "purple", text: "Hoàn tất" },
          paid: { color: "green", text: "Đã thanh toán" },
          deposited: { color: "orange", text: "Đã đặt cọc" },
          pending: { color: "gold", text: "Chờ xử lý" },
        };
        const item = map[status] || { color: "default", text: status };
        return <Tag color={item.color}>{item.text}</Tag>;
      },
    },
    {
      title: "PT Thanh toán",
      dataIndex: "paymentMethods",
      align: "center" as const,
      width: 200,
      render: (methods: string) => (
        <Space direction="vertical" size={0}>
          {methods.split(", ").map((m, i) => (
            <Tag
              key={i}
              color={m.includes("QR") ? "cyan" : "blue"}
              size="small"
            >
              {m}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "Thành tiền cuối",
      dataIndex: "totalFinalAmount",
      align: "right" as const,
      width: 150,
      render: (value: number) =>
        value.toLocaleString("vi-VN", { style: "currency", currency: "VND" }),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      align: "center" as const,
      width: 160,
      render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm"),
      sorter: (a: AggregatedInvoice, b: AggregatedInvoice) =>
        dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
    {
      title: "Hành động",
      align: "center" as const,
      width: 100,
      fixed: "right" as const,
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

      {/* MODAL CHI TIẾT - ĐÃ FIX CASHIER + DỊCH VỤ */}
      <Modal
        title={
          <Row align="middle" gutter={16}>
            <Col>
              <ProfileOutlined style={{ fontSize: 20, color: "#1890ff" }} />
            </Col>
            <Col>
              <Title level={4} className="mb-0">
                Chi tiết lịch hẹn & hóa đơn
              </Title>
              <Text className="text-primary">
                {selectedAppointment?.appointmentId}
              </Text>
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
        style={{ top: 20 }}
      >
        {selectedAppointment && (
          <div className="space-y-6">
            <Row gutter={24} align="middle">
              <Col span={6}>
                <Text strong>Ngày hẹn</Text>
                <Tag color="cyan" className="block mt-1">
                  {dayjs(selectedAppointment.appointmentDate).format(
                    "DD/MM/YYYY HH:mm"
                  )}
                </Tag>
              </Col>
              <Col span={6}>
                <Text strong>Trạng thái</Text>
                <Tag color="purple" className="block mt-1">
                  {selectedAppointment.status === "paid"
                    ? "Đã thanh toán"
                    : "Đã đặt cọc"}
                </Tag>
              </Col>
              <Col span={12} className="text-right">
                <Statistic
                  title="Tổng thành tiền cuối"
                  value={selectedAppointment.totalFinalAmount}
                  prefix="₫"
                  valueStyle={{ color: "#52c41a", fontSize: 28 }}
                  formatter={(v) => Number(v).toLocaleString("vi-VN")}
                />
              </Col>
            </Row>

            <Card
              title={
                <Space>
                  <UserOutlined /> Thông tin khách hàng
                </Space>
              }
              size="small"
            >
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="Tên khách hàng" span={2}>
                  <Space>
                    <Avatar
                      src={
                        selectedAppointment.customer?.avatar ?? NoAvatarImage
                      }
                      size={48}
                    />
                    <div>
                      <div className="font-semibold text-lg">
                        {selectedAppointment.customer?.full_name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {selectedAppointment.customer?.phone} |{" "}
                        {selectedAppointment.customer?.email}
                      </div>
                    </div>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Loại khách">
                  {selectedAppointment.customer?.customer_type === "vip" ? (
                    <Tag color="gold" icon={<CrownOutlined />}>
                      VIP
                    </Tag>
                  ) : (
                    <Tag color="default">Thường</Tag>
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card
              title={
                <Space>
                  <ProfileOutlined /> Dịch vụ đã sử dụng
                </Space>
              }
              size="small"
            >
              <Table
                dataSource={selectedAppointment.details}
                pagination={false}
                rowKey="serviceId"
                size="small"
                bordered
                columns={[
                  {
                    title: "Tên dịch vụ",
                    render: (_: any, r: any) => (
                      <Space>
                        <div>
                          <div className="font-medium">{r.service?.name}</div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {r.service?.description?.slice(0, 80)}...
                          </Text>
                        </div>
                      </Space>
                    ),
                    width: 380,
                  },
                  {
                    title: "SL",
                    dataIndex: "quantity",
                    width: 80,
                    align: "center" as const,
                  },
                  {
                    title: "Giá",
                    dataIndex: "price",
                    width: 130,
                    align: "right" as const,
                    render: (v: string) =>
                      Number(v).toLocaleString("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }),
                  },
                  {
                    title: "Thành tiền",
                    width: 150,
                    align: "right" as const,
                    render: (_: any, r: any) => (
                      <Text strong className="text-green-600">
                        {(Number(r.price) * r.quantity).toLocaleString(
                          "vi-VN",
                          {
                            style: "currency",
                            currency: "VND",
                          }
                        )}
                      </Text>
                    ),
                  },
                ]}
              />
            </Card>

            <Card
              title={
                <Space>
                  <MoneyCollectOutlined /> Chi tiết thanh toán
                </Space>
              }
              size="small"
            >
              <Row gutter={24}>
                {selectedAppointment.depositInvoice && (
                  <Col span={12}>
                    <Statistic
                      title="Hóa đơn đặt cọc"
                      value={Number(
                        selectedAppointment.depositInvoice.finalAmount
                      )}
                      prefix="₫"
                      valueStyle={{ color: "#faad14" }}
                      formatter={(v) => Number(v).toLocaleString("vi-VN")}
                    />
                    <Tag color="orange" className="mt-2">
                      {selectedAppointment.depositInvoice.payment_method ===
                      "qr"
                        ? "QR Code"
                        : "Tiền mặt"}
                    </Tag>
                  </Col>
                )}
                {selectedAppointment.finalInvoice && (
                  <Col span={12}>
                    <Statistic
                      title="Hóa đơn thanh toán cuối"
                      value={Number(
                        selectedAppointment.finalInvoice.finalAmount
                      )}
                      prefix="₫"
                      valueStyle={{ color: "#52c41a" }}
                      formatter={(v) => Number(v).toLocaleString("vi-VN")}
                    />
                    <Tag color="green" className="mt-2">
                      {selectedAppointment.finalInvoice.payment_method === "qr"
                        ? "QR Code"
                        : "Tiền mặt"}
                    </Tag>
                  </Col>
                )}
              </Row>
              <Divider />
              <Row justify="end">
                <Text strong className="text-2xl text-green-600">
                  {selectedAppointment.totalFinalAmount.toLocaleString("vi-VN")}{" "}
                  ₫
                </Text>
              </Row>
            </Card>

            {/* CASHIER - ĐÃ FIX RÕ RÀNG */}
            {(selectedAppointment.finalInvoice?.cashier ||
              selectedAppointment.depositInvoice?.cashier) && (
              <Card
                title={
                  <Space>
                    <UserOutlined /> Thông tin thu ngân
                  </Space>
                }
                size="small"
              >
                <Descriptions bordered column={1} size="small">
                  {selectedAppointment.finalInvoice?.cashier && (
                    <Descriptions.Item label="Thu ngân thanh toán cuối">
                      <Space>
                        <Avatar
                          src={
                            selectedAppointment.finalInvoice.cashier.avatar ??
                            NoAvatarImage
                          }
                          size={32}
                        />
                        <div>
                          <div className="font-semibold">
                            {selectedAppointment.finalInvoice.cashier.full_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {selectedAppointment.finalInvoice.cashier.email}
                          </div>
                        </div>
                      </Space>
                    </Descriptions.Item>
                  )}
                  {selectedAppointment.depositInvoice?.cashier &&
                    !selectedAppointment.finalInvoice?.cashier && (
                      <Descriptions.Item label="Thu ngân đặt cọc">
                        <Space>
                          <Avatar
                            src={
                              selectedAppointment.depositInvoice.cashier
                                .avatar ?? NoAvatarImage
                            }
                            size={32}
                          />
                          <div>
                            <div className="font-semibold">
                              {
                                selectedAppointment.depositInvoice.cashier
                                  .full_name
                              }
                            </div>
                            <div className="text-xs text-gray-500">
                              {selectedAppointment.depositInvoice.cashier.email}
                            </div>
                          </div>
                        </Space>
                      </Descriptions.Item>
                    )}
                  {selectedAppointment.depositInvoice &&
                    !selectedAppointment.depositInvoice.cashier && (
                      <Descriptions.Item label="Hóa đơn đặt cọc">
                        <Tag color="orange">Thanh toán online qua QR</Tag>
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
