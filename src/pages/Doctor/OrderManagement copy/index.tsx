import {
  Card,
  Col,
  DatePicker,
  Input,
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
  const [appointments, setAppointments] = useState<AppointmentTableProps[]>([]);

  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null
  );
  const [statusFilter, setStatusFilter] = useState<string[] | null>(null);

  const [getAppointmentsForManagement] =
    useGetAppointmentsManagedByDoctorMutation();

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDetailAppointment, setSelectedDetailAppointment] =
    useState<AppointmentTableProps | null>(null);

  const { auth } = useAuthStore();

  const handleGetAppointments = async () => {
    if (!auth?.accountId) return;

    setIsLoading(true);
    try {
      const res = await getAppointmentsForManagement({
        doctorId: auth.accountId,
      }).unwrap();

      const tempRes = res ?? [];

      const completedAppointments = tempRes.filter(
        (appointment: any) =>
          appointment.status === appointmentStatusEnum.Completed
      );

      setAppointments(
        completedAppointments.map((appointment: any) => ({
          ...appointment,
          onViewDetails: () => {
            setSelectedDetailAppointment(appointment);
            setDetailModalVisible(true);
          },
        }))
      );
    } catch (error) {
      console.error("Lỗi lấy lịch sử:", error);
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleGetAppointments();
  }, [auth]);

  const filteredAppointments = appointments.filter((a) => {
    const matchSearch =
      search === "" ||
      a.customer.full_name.toLowerCase().includes(search.toLowerCase()) ||
      a.customer.email.toLowerCase().includes(search.toLowerCase()) ||
      a.customer.phone?.toLowerCase().includes(search.toLowerCase());

    const matchStatus = !statusFilter || statusFilter.includes(a.status);

    const matchDate =
      !dateRange ||
      (dayjs(a.appointment_date).isSameOrAfter(dateRange[0], "day") &&
        dayjs(a.appointment_date).isSameOrBefore(dateRange[1], "day"));

    return matchSearch && matchStatus && matchDate;
  });

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
                placeholder="Tìm theo tên khách hàng..."
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

          <Col>
            <Space>
              <Select
                mode="multiple"
                allowClear
                placeholder="Chọn trạng thái"
                value={statusFilter ?? undefined}
                onChange={setStatusFilter}
                style={{ width: 300 }}
                options={[
                  {
                    label: "Đã thanh toán",
                    value: appointmentStatusEnum.Paid,
                  },
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
          dataSource={filteredAppointments}
          scroll={{ x: "max-content" }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            position: ["bottomRight"],
            showTotal: (total, range) =>
              `Hiển thị ${range[0]}-${range[1]} trong ${total} lịch hẹn`,
          }}
        />
      </Card>

      {/* Details Modal */}
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
