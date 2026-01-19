import {
  Card,
  Col,
  DatePicker,
  Input,
  Row,
  Space,
  Table,
  Divider,
  Typography,
  Modal,
  Descriptions,
  Tag,
  Statistic,
  Button,
} from "antd";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { showError } from "@/libs/toast";
import AvatarTable from "@/components/AvatarTable";
import NoAvatarImage from "@/assets/img/defaultAvatar.jpg";
import { statusTagColor, translateStatus } from "@/utils/format";
import {
  useGetRefundedAppointmentsMutation,
  type AppointmentRefundProps,
} from "@/services/appointment";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

type RefundTableProps = AppointmentRefundProps & {
  onViewDetail: () => void;
};

export default function RefundManagementCasher() {
  const [isLoading, setIsLoading] = useState(false);
  const [refunds, setRefunds] = useState<RefundTableProps[]>([]);

  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null
  );

  const [getAllRefunds] = useGetRefundedAppointmentsMutation();

  // === STATE CHO MODAL CHI TIẾT ===
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentRefund, setCurrentRefund] =
    useState<AppointmentRefundProps | null>(null);

  const handleGetRefunds = async () => {
    setIsLoading(true);
    try {
      const res = await getAllRefunds().unwrap();
      const tempRes = res ?? [];
      setRefunds(
        tempRes.map((refund: any) => ({
          ...refund,
          onViewDetail: () => handleViewDetail(refund),
        }))
      );
    } catch (error) {
      showError("Lỗi", "Không thể tải danh sách hoàn tiền");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleGetRefunds();
  }, []);

  const filteredRefunds = refunds.filter((r) => {
    const appointment = r.appointment;
    const customer = appointment?.customer;

    const matchSearch =
      search === "" ||
      customer?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      customer?.email?.toLowerCase().includes(search.toLowerCase()) ||
      customer?.phone?.toLowerCase().includes(search.toLowerCase());

    const matchDate =
      !dateRange ||
      (dayjs(r.processedAt).isAfter(dateRange[0].startOf("day")) &&
        dayjs(r.processedAt).isBefore(dateRange[1].endOf("day")));

    return matchSearch && matchDate;
  });

  // === TÍNH THỐNG KÊ ===
  const totalRefundAmount = filteredRefunds.reduce(
    (sum, r) => sum + Number(r.refundAmount),
    0
  );
  const totalRefundsCount = filteredRefunds.length;

  // === HANDLE XEM CHI TIẾT ===
  const handleViewDetail = (refund: AppointmentRefundProps) => {
    setCurrentRefund(refund);
    setDetailModalVisible(true);
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
      render: (_: any, record: RefundTableProps) => {
        const customer = record.appointment?.customer;
        return (
          <Space size={12}>
            <AvatarTable
              src={customer?.avatar ?? NoAvatarImage}
              alt="avatar"
              fallback={NoAvatarImage}
            />
            <div>
              <div style={{ fontWeight: 600 }}>{customer?.full_name}</div>
              <div style={{ color: "#8c8c8c", fontSize: 12 }}>
                {customer?.phone || customer?.email}
              </div>
            </div>
          </Space>
        );
      },
    },
    {
      title: "Bác sĩ",
      render: (_: any, record: RefundTableProps) => {
        const doctor = record.appointment?.doctor;
        return doctor ? (
          <Space size={8}>
            <AvatarTable src={doctor.avatar ?? NoAvatarImage} />
            <span>{doctor.full_name}</span>
          </Space>
        ) : (
          <em style={{ color: "#999" }}>Chưa phân công</em>
        );
      },
    },
    {
      title: "Ngày hẹn",
      dataIndex: ["appointment", "appointment_date"],
      align: "center" as const,
      width: 120,
      render: (value: string) => dayjs(value).format("DD/MM/YYYY"),
    },
    {
      title: "Thời gian hoàn",
      dataIndex: "processedAt",
      align: "center" as const,
      width: 160,
      render: (value: string) => dayjs(value).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Số tiền hoàn",
      dataIndex: "refundAmount",
      align: "right" as const,
      width: 140,
      render: (value: string | number) =>
        Number(value).toLocaleString("vi-VN", {
          style: "currency",
          currency: "VND",
        }),
    },
    {
      title: "Phương thức",
      dataIndex: "refundMethod",
      align: "center" as const,
      render: (method: string) => {
        const labels: Record<string, string> = {
          cash: "Tiền mặt",
          qr: "QR Code",
          card: "Thẻ",
        };
        return <Tag color="green">{labels[method] || method}</Tag>;
      },
    },
    {
      title: "Nhân viên xử lý",
      render: (_: any, record: RefundTableProps) =>
        record.staff?.full_name || "-",
    },
    {
      title: "",
      key: "operation",
      fixed: "right" as const,
      width: 100,
      align: "center" as const,
      render: (_: any, record: RefundTableProps) => (
        <Button type="link" onClick={record.onViewDetail}>
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <>
      <Row className="mx-2 my-2">
        <Col>
          <Title level={4} className="cus-text-primary">
            <strong>Quản lý hoàn tiền</strong>
          </Title>
        </Col>
      </Row>

      {/* === CARD THỐNG KÊ === */}
      <Row gutter={16} className="mb-4">
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng số hoàn tiền"
              value={totalRefundsCount}
              suffix="lịch hẹn"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng tiền đã hoàn"
              value={totalRefundAmount}
              formatter={(value) =>
                Number(value).toLocaleString("vi-VN", {
                  style: "currency",
                  currency: "VND",
                })
              }
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: 16 }}
        >
          <Col>
            <Space>
              <Input.Search
                placeholder="Tìm khách hàng..."
                allowClear
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 250 }}
              />
              <RangePicker
                onChange={(val) =>
                  setDateRange(val as [dayjs.Dayjs, dayjs.Dayjs] | null)
                }
                format="DD/MM/YYYY"
              />
            </Space>
          </Col>
        </Row>

        <Table
          loading={isLoading}
          rowKey="id"
          columns={columns}
          dataSource={filteredRefunds}
          scroll={{ x: "max-content" }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            position: ["bottomRight"],
            showTotal: (total, range) =>
              `Hiển thị ${range[0]}-${range[1]} trong ${total} bản ghi hoàn tiền`,
          }}
        />
      </Card>

      {/* === MODAL CHI TIẾT === */}
      <Modal
        title="Chi tiết hoàn tiền"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        {currentRefund && (
          <>
            <Descriptions title="Thông tin lịch hẹn" bordered column={2}>
              <Descriptions.Item label="Mã lịch hẹn">
                {currentRefund.appointment?.id}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={statusTagColor(currentRefund.appointment?.status)}>
                  {translateStatus(currentRefund.appointment?.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Khách hàng">
                {currentRefund.appointment?.customer?.full_name}
              </Descriptions.Item>
              <Descriptions.Item label="Bác sĩ">
                {currentRefund.appointment?.doctor?.full_name ||
                  "Chưa phân công"}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày hẹn">
                {dayjs(currentRefund.appointment?.appointment_date).format(
                  "DD/MM/YYYY"
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Giờ hẹn">
                {dayjs(currentRefund.appointment?.startTime).format("HH:mm")} -{" "}
                {dayjs(currentRefund.appointment?.endTime).format("HH:mm")}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng tiền">
                {Number(currentRefund.appointment?.totalAmount).toLocaleString(
                  "vi-VN",
                  {
                    style: "currency",
                    currency: "VND",
                  }
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Đặt cọc">
                {Number(
                  currentRefund.appointment?.depositAmount
                ).toLocaleString("vi-VN", {
                  style: "currency",
                  currency: "VND",
                })}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions title="Thông tin hoàn tiền" bordered column={2}>
              <Descriptions.Item label="Số tiền hoàn">
                {Number(currentRefund.refundAmount).toLocaleString("vi-VN", {
                  style: "currency",
                  currency: "VND",
                })}
              </Descriptions.Item>
              <Descriptions.Item label="Phương thức">
                <Tag color="green">
                  {currentRefund.refundMethod === "cash"
                    ? "Tiền mặt"
                    : currentRefund.refundMethod === "qr"
                    ? "QR Code"
                    : "Thẻ"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Lý do">
                {currentRefund.refundReason || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Nhân viên xử lý">
                {currentRefund.staff?.full_name || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian hoàn" span={2}>
                {dayjs(currentRefund.processedAt).format("DD/MM/YYYY HH:mm:ss")}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Modal>
    </>
  );
}
