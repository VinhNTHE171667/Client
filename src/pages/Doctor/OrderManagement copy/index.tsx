import {
  Card,
  Col,
  DatePicker,
  Row,
  Space,
  Table,
  Divider,
  Select,
  Modal,
  Descriptions,
  Tag,
  Typography,
  List,
  Input,
  Empty,
} from "antd";
import { useEffect, useState } from "react";
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
  const [isLoading, setIsLoading] = useState(false);

  // Dữ liệu gốc lấy từ API (luôn giữ nguyên, không lọc ở đây)
  const [rawAppointments, setRawAppointments] = useState<
    AppointmentTableProps[]
  >([]);
  // Dữ liệu hiển thị trong bảng (chỉ có khi đã search)
  const [appointments, setAppointments] = useState<AppointmentTableProps[]>([]);

  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null
  );
  const [statusFilter, setStatusFilter] = useState<string[] | null>(null);

  // Đánh dấu đã thực hiện tìm kiếm ít nhất 1 lần chưa
  const [hasSearched, setHasSearched] = useState(false);

  const [getAppointmentsForManagement] =
    useGetAppointmentsManagedByDoctorMutation();

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDetailAppointment, setSelectedDetailAppointment] =
    useState<AppointmentTableProps | null>(null);

  const { auth } = useAuthStore();

  // Lấy toàn bộ lịch sử (chỉ Completed) từ API 1 lần duy nhất
  const handleGetAppointments = async () => {
    if (!auth?.accountId) return;

    setIsLoading(true);
    try {
      const res = await getAppointmentsForManagement({
        doctorId: auth.accountId,
      }).unwrap();

      const tempRes = (res ?? []).filter(
        (appointment: any) =>
          appointment.status === appointmentStatusEnum.Completed ||
          appointment.status === appointmentStatusEnum.Paid
      );

      const mapped = tempRes.map((appointment: any) => ({
        ...appointment,
        onViewDetails: () => {
          setSelectedDetailAppointment(appointment);
          setDetailModalVisible(true);
        },
      }));

      // Chỉ lưu vào raw, chưa hiển thị
      setRawAppointments(mapped);
      // Nếu chưa từng search → bảng vẫn trống
      if (!hasSearched) {
        setAppointments([]);
      }
    } catch (error) {
      console.error("Lỗi lấy lịch sử:", error);
      setRawAppointments([]);
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Gọi API khi auth thay đổi
  useEffect(() => {
    handleGetAppointments();
  }, [auth]);

  // Hàm thực hiện lọc + hiển thị kết quả
  const performSearch = () => {
    setHasSearched(true);

    const filtered = rawAppointments.filter((a) => {
      const matchSearch =
        search === "" ||
        a.customer.full_name.toLowerCase().includes(search.toLowerCase()) ||
        a.customer.email.toLowerCase().includes(search.toLowerCase()) ||
        a.customer.phone?.toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        !statusFilter ||
        statusFilter.length === 0 ||
        statusFilter.includes(a.status);

      const matchDate =
        !dateRange ||
        (dayjs(a.appointment_date).isSameOrAfter(dateRange[0], "day") &&
          dayjs(a.appointment_date).isSameOrBefore(dateRange[1], "day"));

      return matchSearch && matchStatus && matchDate;
    });

    setAppointments(filtered);
  };

  // Khi bất kỳ filter nào thay đổi → tự động search
  useEffect(() => {
    if (
      hasSearched ||
      search ||
      dateRange ||
      (statusFilter && statusFilter.length > 0)
    ) {
      performSearch();
    }
  }, [search, dateRange, statusFilter, rawAppointments]);

  return (
    <>
      <Row className="mx-2 my-2">
        <Col>
          <h4 className="cus-text-primary">
            <strong>Lịch sử khám bệnh</strong>
          </h4>
        </Col>
      </Row>

      <Card className="mt-2">
        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: 16 }}
        >
          <Col>
            <Space>
              <Input.Search
                placeholder="Tìm theo tên, email, số điện thoại..."
                allowClear
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onSearch={() => setHasSearched(true)} // nhấn Enter hoặc nút search
                style={{ width: 300 }}
              />
              <RangePicker
                onChange={(val) => {
                  setDateRange(val as [dayjs.Dayjs, dayjs.Dayjs] | null);
                  if (val) setHasSearched(true);
                }}
                format="DD/MM/YYYY"
                placeholder={["Từ ngày", "Đến ngày"]}
              />
            </Space>
          </Col>

          <Col>
            <Space>
              <Select
                mode="multiple"
                allowClear
                placeholder="Chọn trạng thái"
                value={statusFilter ?? undefined}
                onChange={(val) => {
                  setStatusFilter(val);
                  if (val && val.length > 0) setHasSearched(true);
                }}
                style={{ width: 300 }}
                options={[
                  { label: "Đã thanh toán", value: appointmentStatusEnum.Paid },
                  {
                    label: "Hoàn thành",
                    value: appointmentStatusEnum.Completed,
                  },
                ]}
              />
            </Space>
          </Col>
        </Row>

        <Table
          loading={isLoading}
          rowKey="id"
          columns={AppointmentColumn()}
          dataSource={appointments}
          locale={{
            emptyText: hasSearched ? (
              <Empty description="Không tìm thấy lịch sử nào phù hợp" />
            ) : (
              <Empty description="Vui lòng thực hiện tìm kiếm để xem lịch sử khám bệnh" />
            ),
          }}
          scroll={{ x: "max-content" }}
          pagination={
            appointments.length > 0
              ? {
                  pageSize: 10,
                  showSizeChanger: true,
                  pageSizeOptions: ["10", "20", "50"],
                  position: ["bottomRight"],
                  showTotal: (total, range) =>
                    `Hiển thị ${range[0]}-${range[1]} trong ${total} lịch hẹn`,
                }
              : false
          }
        />
      </Card>

      {/* Details Modal - giữ nguyên */}
      <Modal
        title="Chi tiết lịch hẹn"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedDetailAppointment && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Mã lịch hẹn">
              {selectedDetailAppointment.id}
            </Descriptions.Item>
            <Descriptions.Item label="Khách hàng">
              <Space>
                <div>
                  <Title level={5}>
                    {selectedDetailAppointment.customer.full_name}
                  </Title>
                  <Text>{selectedDetailAppointment.customer.email}</Text>
                  <br />
                  <Text>{selectedDetailAppointment.customer.phone}</Text>
                </div>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Bác sĩ">
              {selectedDetailAppointment.doctor ? (
                <Space>
                  <div>
                    <Title level={5}>
                      {selectedDetailAppointment.doctor.full_name}
                    </Title>
                    <Text>{selectedDetailAppointment.doctor.email}</Text>
                  </div>
                </Space>
              ) : (
                <Text type="secondary">Chưa phân công bác sĩ</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Nhân viên">
              {selectedDetailAppointment.staff ? (
                <Space>
                  <div>
                    <Title level={5}>
                      {selectedDetailAppointment.staff.full_name}
                    </Title>
                    <Text>{selectedDetailAppointment.staff.email}</Text>
                  </div>
                </Space>
              ) : (
                <Text type="secondary">Chưa có nhân viên</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Dịch vụ">
              <List
                dataSource={selectedDetailAppointment.details}
                renderItem={(item) => (
                  <List.Item>
                    <div>
                      <Title level={5}>{item.service.name}</Title>
                      <Text>
                        Số lượng: {item.quantity} | Giá:{" "}
                        {Number(item.price).toLocaleString("vi-VN")} VND
                      </Text>
                    </div>
                  </List.Item>
                )}
                bordered
              />
            </Descriptions.Item>
            <Descriptions.Item label="Ngày hẹn">
              {dayjs(selectedDetailAppointment.appointment_date).format(
                "DD/MM/YYYY"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian">
              {dayjs(selectedDetailAppointment.startTime).format("HH:mm")} -{" "}
              {dayjs(selectedDetailAppointment.endTime).format("HH:mm")}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={statusTagColor(selectedDetailAppointment.status)}>
                {translateStatus(selectedDetailAppointment.status)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Tổng tiền">
              {Number(selectedDetailAppointment.totalAmount).toLocaleString(
                "vi-VN"
              )}{" "}
              VND
            </Descriptions.Item>
            <Descriptions.Item label="Tiền đặt cọc">
              {Number(selectedDetailAppointment.depositAmount).toLocaleString(
                "vi-VN"
              )}{" "}
              VND
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú">
              {selectedDetailAppointment.note || "Không có"}
            </Descriptions.Item>
            <Descriptions.Item label="Lý do hủy">
              {selectedDetailAppointment.cancelReason || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {dayjs(selectedDetailAppointment.createdAt).format(
                "DD/MM/YYYY HH:mm"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày cập nhật">
              {dayjs(selectedDetailAppointment.updatedAt).format(
                "DD/MM/YYYY HH:mm"
              )}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </>
  );
}
