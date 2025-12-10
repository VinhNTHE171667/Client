/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
import {
  Button,
  Dropdown,
  Space,
  Tag,
  Tooltip,
  Modal,
  type MenuProps,
} from "antd";
import {
  EllipsisOutlined,
  EditOutlined,
  CheckOutlined,
  BellFilled,
  EyeOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { AppointmentTableProps } from "./type";
import dayjs from "dayjs";
import AvatarTable from "@/components/AvatarTable";
import NoAvatarImage from "@/assets/img/defaultAvatar.jpg";
import { statusTagColor, translateStatus } from "@/utils/format";
import { appointmentStatusEnum } from "@/common/types/auth";

const translateStatusHandle = (value) => {
  switch (value) {
    case "pending":
      return "Xử lí: Đang chờ";
    case "rejected":
      return "Xử lí: Từ chối";
    case "approved":
      return "Xử lí: Chấp nhận";
    default:
      return null;
  }
};

const showReminderDetail = (record: AppointmentTableProps) => {
  if (!record.reminderDoctor) return;
  console.log("Showing reminder detail for:", record);

  Modal.info({
    title: (
      <div className="flex items-center gap-3">
        <BellFilled className="text-2xl text-orange-500" />
        <span className="text-xl font-bold text-orange-600">
          LỄ TÂN ĐANG NHẮC BẠN HOÀN THÀNH!
        </span>
      </div>
    ),
    width: 580,
    centered: true,
    icon: null,
    maskClosable: true,
    closable: true,
    content: (
      <div className="mt-4 space-y-5">
        {/* Avatar + tên khách */}
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <AvatarTable
            src={record.customer?.avatar ?? NoAvatarImage}
            size={70}
            className="ring-4 ring-blue-200"
          />
          <div>
            <div className="text-xl font-bold text-blue-900">
              {record.customer?.full_name}
            </div>
            <div className="text-sm text-gray-600">
              {record.customer?.phone || record.customer?.email}
            </div>
          </div>
        </div>

        {/* Thời gian hẹn */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-200">
            <div className="text-gray-600 font-medium">Ngày hẹn</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {dayjs(record.appointment_date).format("DD/MM/YYYY")}
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-200">
            <div className="text-blue-700 font-medium">Giờ hẹn</div>
            <div className="text-2xl font-bold text-blue-800 mt-1">
              {dayjs(record.startTime).format("HH:mm")} →{" "}
              {dayjs(record.endTime).format("HH:mm")}
            </div>
          </div>
        </div>

        {/* Dịch vụ */}
        {record.details?.length > 0 && (
          <div>
            <div className="font-semibold text-gray-700 mb-2">Dịch vụ:</div>
            <Space size={[8, 8]} wrap>
              {record.details.map((item: any) => (
                <Tag
                  key={item.id}
                  color="purple"
                  className="text-sm font-medium py-1 px-3"
                >
                  {item.service.name}
                </Tag>
              ))}
            </Space>
          </div>
        )}

        {/* NỘI DUNG NHẮC NHỞ – NỔI BẬT NHẤT */}
        <div className="p-6 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 border-4 border-red-400 rounded-2xl shadow-2xl">
          <div className="flex items-start gap-4">
            <EyeOutlined className="text-4xl text-red-600 mt-1 animate-pulse" />
            <div className="flex-1">
              <div className="text-xl font-bold text-red-700 mb-3">
                Nội dung nhắc nhở từ lễ tân:
              </div>
              <div className="bg-white p-5 rounded-xl shadow-inner border-2 border-red-200">
                <p className="text-lg font-medium text-red-900 italic leading-relaxed">
                  "{record.reminderDoctor}"
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <Tag
            color="red"
            className="text-xl px-8 py-3 font-bold border-2 border-red-600"
          >
            Vui lòng hoàn thành ngay để tránh làm khách chờ lâu!
          </Tag>
        </div>
      </div>
    ),
    okText: "ĐÃ HIỂU – TÔI SẼ LÀM NGAY!",
    okButtonProps: {
      size: "large",
      type: "primary",
      danger: true,
      className: "font-bold text-lg px-8",
    },
  });
};

export const AppointmentColumn = (): ColumnsType<AppointmentTableProps> => {
  return [
    {
      title: "STT",
      dataIndex: "index",
      width: 70,
      align: "center",
      render: (_, __, index) => (
        <span className="font-medium">{index + 1}</span>
      ),
    },

    {
      title: "Khách hàng",
      render: (_, record) => (
        <Space size={12}>
          <AvatarTable
            src={record.customer?.avatar ?? NoAvatarImage}
            alt="avatar"
            fallback={NoAvatarImage}
          />
          <div>
            <div className="font-semibold text-gray-900">
              {record.customer?.full_name}
            </div>
            <div className="text-xs text-gray-500">
              {record.customer?.phone || record.customer?.email}
            </div>
          </div>
        </Space>
      ),
    },

    {
      title: "Dịch vụ",
      width: 240,
      render: (_, record) => (
        <Space size={[6, 6]} wrap>
          {record.details?.length > 0 ? (
            record.details.map((item: any) => (
              <Tag color="blue" key={item.id} className="font-medium">
                {item.service.name}
              </Tag>
            ))
          ) : (
            <Tag color="default">Chưa chọn</Tag>
          )}
        </Space>
      ),
    },

    {
      title: "Ngày hẹn",
      dataIndex: "appointment_date",
      align: "center",
      width: 120,
      render: (value) => (
        <span className="font-medium">{dayjs(value).format("DD/MM/YYYY")}</span>
      ),
    },

    {
      title: "Thời gian",
      align: "center",
      width: 140,
      render: (_, record) => (
        <Tag color="blue" className="font-bold px-4 py-1.5">
          {dayjs(record.startTime).format("HH:mm")} -{" "}
          {dayjs(record.endTime).format("HH:mm")}
        </Tag>
      ),
    },
    {
      title: "Nhắc bác sĩ",
      dataIndex: "reminderDoctor",
      align: "center",
      width: 160,
      render: (value, record) =>
        value ? (
          <Button
            type="primary"
            danger={record.status === appointmentStatusEnum.Deposited}
            size="middle"
            className="font-bold shadow-md hover:shadow-lg transition-all"
            onClick={() => showReminderDetail(record)}
          >
            {record?.reminderDoctor}
          </Button>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },

    {
      title: "Trạng thái",
      dataIndex: "status",
      align: "center",
      width: 150,
      render: (status, record) => {
        console.log(record);
        const hasReminder = !!record.reminderDoctor;
        const statusHandle = record?.statusHanle;
        return (
          <Tooltip>
            <div style={{ display: "inline-block" }}>
              <Tag
                color={statusTagColor(status)}
                className={`font-bold text-sm px-2 py-1 rounded-full shadow-md    
              `}
              >
                {hasReminder && <BellFilled className="mr-2 animate-bounce" />}
                {translateStatus(status)}
              </Tag>

              {statusHandle && (
                <div>
                  <Tag className="mt-2 font-bold text-sm px-2 py-1 rounded-full shadow-md">
                    {translateStatusHandle(statusHandle)}
                  </Tag>
                </div>
              )}
            </div>
          </Tooltip>
        );
      },
    },

    {
      title: "",
      key: "operation",
      fixed: "right",
      width: 70,
      align: "center",
      render: (_, record) => {
        const isDeposited = record.status === appointmentStatusEnum.Deposited;
        const isArrived = record.status === appointmentStatusEnum.Arrived;
        const isInService = record.status === appointmentStatusEnum.InService;
        const isRequestCancel =
          record.statusHanle === "pending" || record.statusHanle === "approved";
        const hasReminder = !!record.reminderDoctor;

        const items: MenuProps["items"] = [];

        // Always add view details
        items.push({
          key: "view-details",
          label: (
            <Space onClick={record.onViewDetails}>
              <EyeOutlined /> Xem chi tiết
            </Space>
          ),
        });

        if (isDeposited && !isRequestCancel) {
          items.push({
            key: "update",
            label: (
              <Space onClick={record.onUpdate}>
                <EditOutlined /> Cập nhật
              </Space>
            ),
          });
        }

        if (isArrived && !isRequestCancel) {
          items.push({
            key: "start-service",
            label: (
              <Space onClick={record.onStartService}>
                <PlayCircleOutlined /> Bắt đầu phục vụ
              </Space>
            ),
          });
        }

        if (isInService && !isRequestCancel) {
          items.push({
            key: "complete",
            label: (
              <Space onClick={record.onComplete}>
                <CheckOutlined /> Hoàn thành
              </Space>
            ),
          });
        }

        if (hasReminder) {
          items.unshift({
            key: "reminder",
            label: (
              <Space className="text-red-600 font-bold">
                <BellFilled /> BỊ NHẮC!
              </Space>
            ),
            disabled: true,
          });
        }

        return items.length > 0 ? (
          <Dropdown
            menu={{ items }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<EllipsisOutlined className="text-2xl" />}
              className={hasReminder ? "text-red-600 animate-pulse" : ""}
            />
          </Dropdown>
        ) : (
          <span className="text-gray-300">—</span>
        );
      },
    },

    {
      key: "rowStyle",
      render: (_, record) => ({
        props: {
          className: record.reminderDoctor
            ? "bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 border-l-6 border-red-600 shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer"
            : "hover:bg-gray-50",
        },
        children: undefined,
      }),
    } as any,
  ];
};
