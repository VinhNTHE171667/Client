import { Button, Dropdown, Space, Tag, message, type MenuProps } from "antd";
import {
  EllipsisOutlined,
  CheckOutlined,
  ScanOutlined,
  BellOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { AppointmentTableProps } from "./type";
import dayjs from "dayjs";
import AvatarTable from "@/components/AvatarTable";
import NoAvatarImage from "@/assets/img/defaultAvatar.jpg";
import { statusTagColor, translateStatus } from "@/utils/format";
import { appointmentStatusEnum } from "@/common/types/auth";
import { useRequestCompleteAppointmentMutation } from "@/services/appointment";
import { useAuthStore } from "@/hooks/UseAuth";
import { showError, showSuccess } from "@/libs/toast";

export const AppointmentColumn = (): ColumnsType<AppointmentTableProps> => {
  const [requestComplete] = useRequestCompleteAppointmentMutation();
  const { auth } = useAuthStore();
  const staffName = auth?.fullName || "Nhân viên lễ tân";

  const handleRequestComplete = async (appointmentId: string) => {
    try {
      await requestComplete({
        appointmentId,
        staffName,
      }).unwrap();
      showSuccess("Đã gửi nhắc nhở đến bác sĩ thành công!");
    } catch (err) {
      showError("Gửi thất bại, vui lòng thử lại");
    }
  };

  return [
    {
      title: "STT",
      dataIndex: "index",
      width: 70,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Khách hàng",
      dataIndex: "full_name",
      render: (_, record) => (
        <Space size={12}>
          <AvatarTable
            src={record.customer?.avatar ?? NoAvatarImage}
            alt="avatar"
            fallback={NoAvatarImage}
          />
          <div>
            <div style={{ fontWeight: 600 }}>{record.customer?.full_name}</div>
            <div style={{ color: "#8c8c8c", fontSize: 12 }}>
              {record.customer?.phone || record.customer?.email}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Bác sĩ",
      dataIndex: "doctor",
      render: (_, record) =>
        record.doctor ? (
          <Space size={8}>
            <AvatarTable src={record.doctor.avatar ?? NoAvatarImage} />
            <span>{record.doctor.full_name}</span>
          </Space>
        ) : (
          <em style={{ color: "#999" }}>Chưa phân công</em>
        ),
    },
    {
      title: "Ngày hẹn",
      dataIndex: "appointment_date",
      align: "center",
      width: 120,
      render: (value) => dayjs(value).format("DD/MM/YYYY"),
    },
    {
      title: "Giờ",
      align: "center",
      render: (_, record) => (
        <Tag color="blue">
          {dayjs(record.startTime).format("HH:mm")} -{" "}
          {dayjs(record.endTime).format("HH:mm")}
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      align: "center",
      width: 130,
      render: (status) => (
        <Tag color={statusTagColor(status)}>{translateStatus(status)}</Tag>
      ),
    },
    {
      title: "Tổng tiền",
      dataIndex: "totalAmount",
      align: "right",
      width: 140,
      render: (value: number) =>
        value.toLocaleString("vi-VN", { style: "currency", currency: "VND" }),
    },
    {
      title: "Đặt cọc",
      dataIndex: "depositAmount",
      align: "right",
      width: 140,
      render: (value: number) =>
        value.toLocaleString("vi-VN", { style: "currency", currency: "VND" }),
    },
    {
      title: "",
      key: "operation",
      fixed: "right",
      width: 70,
      align: "center",
      render: (_, record) => {
        // Không hiển thị nút actions nếu đã thanh toán
        if (record.status === appointmentStatusEnum.Paid) {
          return <span>—</span>;
        }

        const items: MenuProps["items"] = [];

        // Nút: Nhắc bác sĩ hoàn thành
        const canRemindDoctor =
          record.doctorId && // có bác sĩ
          record.status !== appointmentStatusEnum.Completed &&
          [
            appointmentStatusEnum.Paid,
            appointmentStatusEnum.Deposited,
            appointmentStatusEnum.Approved,
          ].includes(record.status);

        if (canRemindDoctor) {
          items.push({
            key: "remind",
            label: (
              <Space onClick={() => handleRequestComplete(record.id)}>
                <BellOutlined style={{ color: "#fa8c16" }} />
                <span>Nhắc bác sĩ hoàn thành</span>
              </Space>
            ),
          });
        }

        // Nút thanh toán khi đã hoàn thành dịch vụ
        if (record.status === appointmentStatusEnum.Completed) {
          items.push(
            {
              key: "cash",
              label: (
                <Space onClick={record.onPaymentByCash}>
                  <CheckOutlined />
                  Tiền mặt
                </Space>
              ),
            },
            {
              key: "qr",
              label: (
                <Space onClick={record.onPaymentByQR}>
                  <ScanOutlined />
                  QR Code
                </Space>
              ),
            }
          );
        }

        return items.length > 0 ? (
          <Dropdown
            menu={{ items }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<EllipsisOutlined style={{ fontSize: 20 }} />}
            />
          </Dropdown>
        ) : (
          <span>—</span>
        );
      },
    },
  ];
};
