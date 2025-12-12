import {
  Card,
  Col,
  DatePicker,
  Input,
  Row,
  Space,
  Table,
  Select,
  Modal,
  Descriptions,
  Tag,
  Typography,
  List,
} from "antd";
import { useEffect, useState, useMemo } from "react";
import dayjs from "dayjs";
import { AppointmentColumn } from "./_components/columnTypes";
import { useGetAppointmentsManagedByDoctorMutation } from "@/services/appointment";
import type { AppointmentTableProps } from "./_components/type";
import { appointmentStatusEnum } from "@/common/types/auth";
import { useAuthStore } from "@/hooks/UseAuth";
import { translateStatus, statusTagColor } from "@/utils/format";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

export default function HistoryOrderManagementDoctor() {
  // State chính
  const [isLoading, setIsLoading] = useState(true);
  const [appointments, setAppointments] = useState<AppointmentTableProps[]>([]);

  // Bộ lọc
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null
  );
  const [statusFilter, setStatusFilter] = useState<string[]>([]); // [] = hiện hết

  // Modal chi tiết
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentTableProps | null>(null);

  // Mutation & Auth
  const [getAppointmentsForManagement] =
    useGetAppointmentsManagedByDoctorMutation();
  const { auth } = useAuthStore();

  // Hàm gọi API lấy toàn bộ lịch sử của bác sĩ
  const fetchAppointments = async () => {
    if (!auth?.accountId) {
      setAppointments([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await getAppointmentsForManagement({
        doctorId: auth.accountId,
      }).unwrap();

      const data = (res ?? []) as any[];

      const mappedData: AppointmentTableProps[] = data.map((appt: any) => ({
        ...appt,
        key: appt.id, // Rất quan trọng cho Antd Table
        onViewDetails: () => {
          setSelectedAppointment(appt);
          setDetailModalVisible(true);
        },
      }));

      setAppointments(mappedData);
    } catch (error) {
      console.error("Lỗi khi tải lịch sử khám bệnh:", error);
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Gọi API khi component mount hoặc auth thay đổi
  useEffect(() => {
    fetchAppointments();
  }, [auth?.accountId]);

  // Lọc dữ liệu bằng useMemo (tối ưu hiệu suất)
  const filteredAppointments = useMemo(() => {
    if (appointments.length === 0) return [];

    const searchLower = search.trim().toLowerCase();

    return appointments.filter((appt) => {
      // Tìm kiếm theo tên, email, sđt
      const matchesSearch =
        searchLower === "" ||
        appt.customer.full_name.toLowerCase().includes(searchLower) ||
        appt.customer.email.toLowerCase().includes(searchLower) ||
        (appt.customer.phone?.toLowerCase().includes(searchLower) ?? false);

      // Lọc trạng thái
      const matchesStatus =
        statusFilter.length === 0 || statusFilter.includes(appt.status);

      // Lọc theo ngày
      const matchesDate =
        !dateRange ||
        (dayjs(appt.appointment_date).isSameOrAfter(dateRange[0], "day") &&
          dayjs(appt.appointment_date).isSameOrBefore(dateRange[1], "day"));

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [appointments, search, statusFilter, dateRange]);

  return (
    <>
      {/* Tiêu đề */}
      <Row className="mx-2 my-4">
        <Col>
          <Title level={4} className="cus-text-primary">
            <strong>Lịch sử khám bệnh</strong>
          </Title>
        </Col>
      </Row>

      {/* Card chính */}
      <Card>
        {/* Bộ lọc */}
        <Row
          gutter={[16, 16]}
          justify="space-between"
          align="middle"
          style={{ marginBottom: 24 }}
        >
          <Col xs={24} md={12} lg={14}>
            <Space wrap>
              <Input.Search
                placeholder="Tìm tên khách hàng, email, số điện thoại..."
                allowClear
                enterButton
                size="large"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onSearch={(value) => setSearch(value)}
                style={{ width: 320 }}
              />

              <RangePicker
                format="DD/MM/YYYY"
                placeholder={["Từ ngày", "Đến ngày"]}
                onChange={(dates) => setDateRange(dates as any)}
                style={{ width: 240 }}
              />
            </Space>
          </Col>

          <Col xs={24} md={12} lg={8}>
            <Select
              mode="multiple"
              allowClear
              placeholder="Lọc theo trạng thái"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: "100%" }}
              options={[
                { label: "Đã thanh toán", value: appointmentStatusEnum.Paid },
                { label: "Hoàn thành", value: appointmentStatusEnum.Completed },
                { label: "Đã hủy", value: appointmentStatusEnum.Cancelled },
                { label: "Đang xử lý", value: appointmentStatusEnum.Pending },
                {
                  label: "Đã xác nhận",
                  value: appointmentStatusEnum.Confirmed,
                },
              ]}
            />
          </Col>
        </Row>

        {/* Bảng dữ liệu */}
        <Table
          loading={isLoading}
          columns={AppointmentColumn()}
          dataSource={filteredAppointments}
          rowKey="id"
          scroll={{ x: 1200 }}
          locale={{
            emptyText: isLoading
              ? "Đang tải dữ liệu..."
              : "Không tìm thấy lịch sử khám bệnh nào",
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total, range) =>
              `Hiển thị ${range[0]}-${range[1]} trong tổng cộng ${total} lịch hẹn`,
            position: ["bottomRight"],
          }}
        />
      </Card>

      {/* Modal chi tiết */}
      <Modal
        title={<Title level={4}>Chi tiết lịch hẹn</Title>}
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedAppointment(null);
        }}
        footer={null}
        width={1000}
        destroyOnClose
      >
        {selectedAppointment && (
          <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }}>
            <Descriptions.Item label="Mã lịch hẹn">
              <strong>{selectedAppointment.id}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={statusTagColor(selectedAppointment.status)}>
                {translateStatus(selectedAppointment.status)}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Khách hàng" span={2}>
              <Space direction="vertical">
                <Title level={5}>
                  {selectedAppointment.customer.full_name}
                </Title>
                <Text>{selectedAppointment.customer.email}</Text>
                <Text>
                  {selectedAppointment.customer.phone || "Chưa có SĐT"}
                </Text>
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="Bác sĩ" span={2}>
              {selectedAppointment.doctor ? (
                <Space direction="vertical">
                  <Text strong>{selectedAppointment.doctor.full_name}</Text>
                  <Text type="secondary">
                    {selectedAppointment.doctor.email}
                  </Text>
                </Space>
              ) : (
                <Text type="secondary">Chưa phân công</Text>
              )}
            </Descriptions.Item>

            <Descriptions.Item label="Ngày khám">
              {dayjs(selectedAppointment.appointment_date).format(
                "DD/MM/YYYY (dddd)"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Giờ khám">
              {dayjs(selectedAppointment.startTime).format("HH:mm")} -{" "}
              {dayjs(selectedAppointment.endTime).format("HH:mm")}
            </Descriptions.Item>

            <Descriptions.Item label="Dịch vụ đã chọn" span={2}>
              <List
                size="small"
                bordered
                dataSource={selectedAppointment.details}
                renderItem={(item: any) => (
                  <List.Item>
                    <Space direction="vertical">
                      <Text strong>{item.service.name}</Text>
                      <Text type="secondary">
                        Số lượng: {item.quantity} ×{" "}
                        {Number(item.price).toLocaleString("vi-VN")} VND
                      </Text>
                    </Space>
                  </List.Item>
                )}
              />
            </Descriptions.Item>

            <Descriptions.Item label="Tổng tiền">
              <Text strong type="danger" style={{ fontSize: 18 }}>
                {Number(selectedAppointment.totalAmount).toLocaleString(
                  "vi-VN"
                )}{" "}
                VND
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Đã đặt cọc">
              {Number(selectedAppointment.depositAmount).toLocaleString(
                "vi-VN"
              )}{" "}
              VND
            </Descriptions.Item>

            <Descriptions.Item label="Ghi chú" span={2}>
              {selectedAppointment.note || (
                <Text type="secondary">Không có ghi chú</Text>
              )}
            </Descriptions.Item>

            {selectedAppointment.cancelReason && (
              <Descriptions.Item label="Lý do hủy" span={2}>
                <Text type="danger">{selectedAppointment.cancelReason}</Text>
              </Descriptions.Item>
            )}

            <Descriptions.Item label="Ngày tạo">
              {dayjs(selectedAppointment.createdAt).format("DD/MM/YYYY HH:mm")}
            </Descriptions.Item>
            <Descriptions.Item label="Cập nhật gần nhất">
              {dayjs(selectedAppointment.updatedAt).format("DD/MM/YYYY HH:mm")}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </>
  );
}
