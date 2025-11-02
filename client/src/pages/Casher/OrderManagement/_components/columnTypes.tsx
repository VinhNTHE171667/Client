/* eslint-disable @typescript-eslint/no-unused-vars */
import { Button, Dropdown, Space, Tag, type MenuProps } from "antd";
import {
  EllipsisOutlined,
  EditOutlined,
  // DeleteOutlined,
  CheckOutlined,
  ScanOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { AppointmentTableProps } from "./type";
import dayjs from "dayjs";
import AvatarTable from "@/components/AvatarTable";
import NoAvatarImage from "@/assets/img/defaultAvatar.jpg";
import { statusTagColor, translateStatus } from "@/utils/format";
import { appointmentStatusEnum } from "@/common/types/auth";

export const AppointmentColumn = (): ColumnsType<AppointmentTableProps> => [
  {
    title: "STT",
    dataIndex: "index",
    width: 70,
    align: "center",
    render: (_, __, index) => <span>{index + 1}</span>,
  },
  // {
  //   title: "Mã cuộc hẹn",
  //   dataIndex: "id",
  //   ellipsis: true,
  //   width: 240,
  // },
  {
    title: "Khách hàng",
    dataIndex: "full_name",
    render: (_, record) => (
      <Space size={12}>
        <AvatarTable
          src={record.customer.avatar ?? NoAvatarImage}
          alt="avatar"
          fallback={NoAvatarImage}
        />
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            {record.customer.full_name}
          </div>
          <div style={{ color: "#8c8c8c", fontSize: 12 }}>
            {record.customer.email}
          </div>
        </div>
      </Space>
    ),
  },
  {
    title: "Bác sĩ",
    dataIndex: "doctor",
    render: (_, record) => {
      if (record.doctor) {
        return (
          <Space size={12}>
            <AvatarTable
              src={record.doctor.avatar ?? NoAvatarImage}
              alt="avatar"
              fallback={NoAvatarImage}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                {record.customer.full_name}
              </div>
              <div style={{ color: "#8c8c8c", fontSize: 12 }}>
                {record.customer.email}
              </div>
            </div>
          </Space>
        );
      }
      return <em>Chưa có bác sĩ phụ trách</em>;
    },
  },
  {
    title: "Ngày hẹn",
    dataIndex: "appointment_date",
    align: "center",
    width: 150,
    render: (value) => dayjs(value).format("DD/MM/YYYY"),
    sorter: (a, b) =>
      dayjs(a.appointment_date).unix() - dayjs(b.appointment_date).unix(),
  },
  {
    title: "Thời gian",
    align: "center",
    sorter: (a, b) => dayjs(a.startTime).unix() - dayjs(b.startTime).unix(),
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
    render: (_, record) => {
      return (
        <Tag color={statusTagColor(record.status)}>
          {translateStatus(record.status)}
        </Tag>
      );
    },
  },
  {
    title: "Tổng tiền (VNĐ)",
    dataIndex: "totalAmount",
    align: "right",
    width: 150,
    render: (value: number) =>
      value.toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
      }),
  },
  {
    title: "Đã đặt cọc (VNĐ)",
    dataIndex: "depositAmount",
    align: "right",
    width: 150,
    render: (value: number) =>
      value.toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
      }),
  },
  {
    title: "Tiền còn lại (VNĐ)",
    dataIndex: "remainingAmount",
    align: "right",
    width: 150,
    render: (_, record) =>
      (record.totalAmount - record.depositAmount).toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
      }),
  },
  {
    title: "",
    dataIndex: "operation",
    key: "operation",
    fixed: "right",
    align: "right",
    width: 80,
    render: (_, record) => {
      const renderItems = (
        record: AppointmentTableProps,
        onPaymentByCash: () => void,
        onPaymentByQR: () => void
      ): MenuProps["items"] => {
        const items: MenuProps["items"] = [];

        if (record.status === appointmentStatusEnum.Completed) {
          items.push({
            key: "0",
            label: (
              <a onClick={onPaymentByCash}>
                <Space>
                  <CheckOutlined /> Thanh toán bằng tiền mặt
                </Space>
              </a>
            ),
          });
        }

        if (record.status === appointmentStatusEnum.Completed) {
          items.push({
            key: "1",
            label: (
              <a onClick={onPaymentByQR}>
                <Space>
                  <ScanOutlined /> Thanh toán bằng QR
                </Space>
              </a>
            ),
          });
        }

        // Nếu cần thêm hành động xoá:
        // items.push({
        //   key: "2",
        //   label: (
        //     <div onClick={onRemove}>
        //       <Space>
        //         <DeleteOutlined /> Xóa
        //       </Space>
        //     </div>
        //   ),
        // });

        return items;
      };

      return (
        <Dropdown
          menu={{
            items: renderItems(
              record,
              record.onPaymentByCash!,
              record.onPaymentByQR!
            ),
          }}
          trigger={["click"]}
          placement="bottomRight"
        >
          <Button
            type="text"
            icon={<EllipsisOutlined style={{ fontSize: 18 }} />}
            disabled={
              !(record.status === appointmentStatusEnum.Completed)
              // || record.onRemove
            }
          />
        </Dropdown>
      );
    },
  },
];
