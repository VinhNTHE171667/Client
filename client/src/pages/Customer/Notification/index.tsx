import { Badge, Button, Col, Row, Space, Table, Divider, Card } from "antd";
import { useEffect, useState } from "react";
import { showError, showSuccess } from "@/libs/toast";
import {
  useGetNotificationsByUserQuery,
  useGetUnreadNotificationsByUserQuery,
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
  type NotificationProps
} from "@/services/auth";
import { useAuthStore } from "@/hooks/UseAuth";
import { NotificationColumn } from "./_components/columnTypes";

export default function NotificationCustomer() {
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { auth } = useAuthStore();
  const userId = auth.accountId || "";
  const userType = "customer" as const;

  const {
    data: paginatedData,
    isFetching: isFetchingNotifications,
    error: notificationsError,
    refetch: refetchNotifications, 
  } = useGetNotificationsByUserQuery(
    { userId, userType },
    { skip: !userId }
  );

  const {
    data: unreadData,
    isFetching: isFetchingUnread,
    error: unreadError,
    refetch: refetchUnread, 
  } = useGetUnreadNotificationsByUserQuery(
    { userId, userType },
    { skip: !userId }
  );

  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [markAllAsRead] = useMarkAllNotificationsAsReadMutation();

  // Xử lý error
  useEffect(() => {
    if (notificationsError) {
      showError(
        "Lỗi",
        notificationsError instanceof Error ? notificationsError.message : "Lỗi tải thông báo"
      );
    }
    if (unreadError) {
      showError(
        "Lỗi",
        unreadError instanceof Error ? unreadError.message : "Lỗi tải thông báo chưa đọc"
      );
    }
  }, [notificationsError, unreadError]);

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
      showSuccess("Thành công", "Đã đánh dấu thông báo là đã đọc");
      await refetchNotifications();
      await refetchUnread();
    } catch (error) {
      showError("Lỗi", error instanceof Error ? error.message : "Không thể đánh dấu đã đọc");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    setIsLoading(true);
    try {
      await markAllAsRead({ userId, userType }).unwrap();
      showSuccess("Thành công", "Đã đánh dấu tất cả thông báo là đã đọc");
      await refetchNotifications();
      await refetchUnread();
    } catch (error) {
      showError("Lỗi", error instanceof Error ? error.message : "Không thể đánh dấu tất cả đã đọc");
    } finally {
      setIsLoading(false);
    }
  };

  const loading = isFetchingNotifications || isFetchingUnread || isLoading;

  return (
    <div className="container my-3">
      <Row className="mx-2 my-2">
        <Col>
          <h4 className="cus-text-primary">
            <strong>Thông báo của tôi</strong>
          </h4>
        </Col>
        <Col style={{ marginLeft: "auto" }}>
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
              <span>Tổng thông báo: {notifications.length}</span>
              <Divider type="vertical" />
              <span>Chưa đọc: {unreadCount}</span>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                onClick={() => {
                  refetchNotifications();
                  refetchUnread();
                }}
                disabled={loading}
                loading={loading}
              >
                Làm mới
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          loading={loading}
          rowKey="id"
          columns={NotificationColumn({ handleMarkAsRead, isLoading })} 
          dataSource={notifications}
          scroll={{ x: "max-content" }}
          tableLayout="fixed"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            position: ["bottomRight"],
            showTotal: (total, range) =>
              `Hiển thị ${range[0]}-${range[1]} trong ${total} thông báo`,
            onChange: () => {}, 
          }}
          locale={{
            emptyText: "Không có thông báo nào",
          }}
        />
      </Card>
    </div>
  );
}