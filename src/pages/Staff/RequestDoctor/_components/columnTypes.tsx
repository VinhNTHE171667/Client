import { Button, Space } from "antd";
import type { DoctorRequestCancelPropsModel } from "./type";
import type { ColumnsType } from "antd/es/table";

export const DoctorCancelRequestColumn =
  (): ColumnsType<DoctorRequestCancelPropsModel> => [
    {
      title: "Bác sĩ",
      dataIndex: ["doctor", "full_name"],
      key: "doctor",
    },
    {
      title: "Lịch hẹn",
      dataIndex: ["appointment", "appointment_date"],
      key: "appointment_date",
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: "Lý do",
      dataIndex: "reason",
      key: "reason",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) =>
        status === "pending"
          ? "Chờ duyệt"
          : status === "approved"
          ? "Đã duyệt"
          : "Đã từ chối",
    },
    {
      title: "Thời gian yêu cầu",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) =>
        date ? new Date(date).toLocaleString("vi-VN") : "",
    },

    {
      title: "Hành động",
      key: "action",
      render: (_, record: DoctorRequestCancelPropsModel) => {
        const isExpired = new Date(record.appointment.endTime) < new Date();

        if (record.status !== "pending") return null;

        return (
          <Space direction="vertical">
            {isExpired && (
              <span style={{ color: "red", fontWeight: 500 }}>Đã quá hạn</span>
            )}

            <Space>
              <Button
                type="primary"
                onClick={record.onApprove}
                disabled={isExpired}
              >
                Duyệt
              </Button>

              <Button danger onClick={record.onReject}>
                Từ chối
              </Button>
            </Space>
          </Space>
        );
      },
    },
  ];
