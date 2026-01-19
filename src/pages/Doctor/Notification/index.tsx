import {
  Badge,
  Button,
  Col,
  Row,
  Space,
  Table,
  Divider,
  Card,
  Modal,
  Tag,
  Typography,
  Spin,
} from "antd";
import { useEffect, useState } from "react";
import { showError, showSuccess } from "@/libs/toast";
import {
  useGetNotificationsByUserQuery,
  useGetUnreadNotificationsByUserQuery,
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
  type NotificationProps,
} from "@/services/auth";
import { useAuthStore } from "@/hooks/UseAuth";
import { NotificationColumn } from "./_components/columnTypes";
import {
  InfoCircleOutlined,
  LinkOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Paragraph, Text } = Typography;

export default function NotificationDoctor() {
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedNoti, setSelectedNoti] = useState<NotificationProps | null>(
    null
  );

  const { auth } = useAuthStore();
  const userId = auth.accountId || "";
  const userType = "doctor" as const;

  const {
    data: paginatedData,
    isFetching: isFetchingNotifications,
    refetch: refetchNotifications,
  } = useGetNotificationsByUserQuery({ userId, userType }, { skip: !userId });

  const {
    data: unreadData,
    isFetching: isFetchingUnread,
    refetch: refetchUnread,
  } = useGetUnreadNotificationsByUserQuery(
    { userId, userType },
    { skip: !userId }
  );

  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [markAllAsRead] = useMarkAllNotificationsAsReadMutation();

  useEffect(() => {
    if (paginatedData) {
      setNotifications(paginatedData.notifications || []);
    }
  }, [paginatedData]);

  useEffect(() => {
    if (unreadData) {
      setUnreadCount(unreadData.length || 0);
    }
  }, [unreadData]);

  const handleMarkAsRead = async (id: string) => {
    setIsLoading(true);
    try {
      await markAsRead(id).unwrap();
      showSuccess("Thành công", "Đã đánh dấu là đã đọc");
      refetchNotifications();
      refetchUnread();
    } catch (error: any) {
      showError("Lỗi", error?.data?.message || "Không thể đánh dấu đã đọc");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    setIsLoading(true);
    try {
      await markAllAsRead({ userId, userType }).unwrap();
      showSuccess("Thành công", "Đã đánh dấu tất cả là đã đọc");
      refetchNotifications();
      refetchUnread();
    } catch (error: any) {
      showError("Lỗi", error?.data?.message || "Không thể đánh dấu tất cả");
    } finally {
      setIsLoading(false);
    }
  };

  const openDetailModal = (record: NotificationProps) => {
    setSelectedNoti(record);
    setModalOpen(true);
    if (!record.isRead) {
      handleMarkAsRead(record.id);
    }
  };

  const loading = isFetchingNotifications || isFetchingUnread || isLoading;

  return (
    <div className="container my-3">
      <Row className="mx-2 my-2" justify="space-between" align="middle">
        <Col>
          <h4 className="cus-text-primary">
            <strong>Thông báo của tôi</strong>
          </h4>
        </Col>
        <Col>
          <Badge count={unreadCount} size="small">
            <Button
              type="primary"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0 || loading}
              loading={loading}
            >
              Đánh dấu tất cả đã đọc
            </Button>
          </Badge>
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
              <Text strong>Tổng: {notifications.length}</Text>
              <Divider type="vertical" />
              <Text type="danger">Chưa đọc: {unreadCount}</Text>
            </Space>
          </Col>
          <Col>
            <Button
              onClick={() => {
                refetchNotifications();
                refetchUnread();
              }}
              loading={loading}
            >
              Làm mới
            </Button>
          </Col>
        </Row>

        <Table
          loading={loading}
          rowKey="id"
          columns={NotificationColumn({
            handleMarkAsRead,
            isLoading,
            openDetailModal,
          })}
          dataSource={notifications}
          scroll={{ x: "max-content" }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showTotal: (total, range) =>
              `Hiển thị ${range[0]}-${range[1]} trong ${total} thông báo`,
          }}
          locale={{ emptyText: "Không có thông báo nào" }}
        />
      </Card>

      {/* MODAL CHI TIẾT THÔNG BÁO */}
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={600}
        centered
        title={
          <Space>
            <InfoCircleOutlined style={{ color: "#1890ff" }} />
            <strong>Chi tiết thông báo</strong>
          </Space>
        }
      >
        {selectedNoti ? (
          <div style={{ lineHeight: 1.8 }}>
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <div>
                <Text strong>Tiêu đề:</Text>
                <Title level={4} style={{ margin: "8px 0" }}>
                  {selectedNoti.title}
                </Title>
              </div>

              <div>
                <Text strong>Nội dung:</Text>
                <Paragraph
                  style={{
                    marginTop: 8,
                    fontSize: "15px",
                    background: "#f9f9f9",
                    padding: 12,
                    borderRadius: 8,
                  }}
                >
                  {selectedNoti.content || "Không có nội dung"}
                </Paragraph>
              </div>

              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>Loại thông báo:</Text>
                  <br />
                  <Tag
                    color={
                      selectedNoti.type === "Success"
                        ? "green"
                        : selectedNoti.type === "Warning"
                        ? "orange"
                        : selectedNoti.type === "Error"
                        ? "red"
                        : "blue"
                    }
                    style={{ marginTop: 6 }}
                  >
                    {selectedNoti.type}
                  </Tag>
                </Col>
                <Col span={12}>
                  <Text strong>Thời gian:</Text>
                  <br />
                  <Text type="secondary">
                    <ClockCircleOutlined />{" "}
                    {dayjs(selectedNoti.createdAt).format(
                      "DD/MM/YYYY HH:mm:ss"
                    )}
                  </Text>
                </Col>
              </Row>

              {selectedNoti.actionUrl && (
                <div style={{ marginTop: 16, textAlign: "center" }}>
                  <Button
                    type="primary"
                    icon={<LinkOutlined />}
                    href={selectedNoti.actionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="large"
                  >
                    Xem chi tiết (Mở trang mới)
                  </Button>
                </div>
              )}

              <div style={{ textAlign: "right", marginTop: 20 }}>
                <Tag color={selectedNoti.isRead ? "green" : "red"}>
                  {selectedNoti.isRead ? "Đã đọc" : "Chưa đọc"}
                </Tag>
              </div>
            </Space>
          </div>
        ) : (
          <Spin tip="Đang tải..." />
        )}
      </Modal>
    </div>
  );
}
