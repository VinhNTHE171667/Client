import React, { useState } from "react";
import {
  Card,
  Row,
  Col,
  Avatar,
  Tag,
  List,
  Calendar,
  Progress,
  Button,
} from "antd";
import {
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import styles from "./StaffDashboard.module.scss";

const StaffDashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(dayjs());

  const tasks = [
    { id: 1, title: "Chuẩn bị liệu trình chăm sóc da", status: "Đang làm" },
    { id: 2, title: "Tư vấn khách hàng mới", status: "Hoàn thành" },
    { id: 3, title: "Vệ sinh khu vực làm việc", status: "Chưa bắt đầu" },
  ];

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h2>Xin chào, Nhân viên</h2>
        <p>Chúc bạn một ngày làm việc hiệu quả và vui vẻ</p>
      </div>

      <Row gutter={[20, 20]}>
        <Col xs={24} md={8}>
          <Card className={styles.statCard}>
            <div className={styles.cardContent}>
              <Avatar size={50} icon={<CalendarOutlined />} />
              <div>
                <h3>Lịch hẹn hôm nay</h3>
                <p className={styles.value}>5 cuộc hẹn</p>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className={styles.statCard}>
            <div className={styles.cardContent}>
              <Avatar size={50} icon={<UserOutlined />} />
              <div>
                <h3>Khách hàng phục vụ</h3>
                <p className={styles.value}>12 người</p>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className={styles.statCard}>
            <div className={styles.cardContent}>
              <Avatar size={50} icon={<ClockCircleOutlined />} />
              <div>
                <h3>Giờ làm việc</h3>
                <p className={styles.value}>7 / 8h</p>
                <Progress percent={87} size="small" />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[20, 20]} className="mt-4">
        <Col xs={24} md={12}>
          <Card title="Công việc trong ngày" className={styles.taskCard}>
            <List
              itemLayout="horizontal"
              dataSource={tasks}
              renderItem={(task) => (
                <List.Item
                  actions={[
                    <Button size="small" type="link">
                      Chi tiết
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar src="https://i.pravatar.cc/40" />}
                    title={task.title}
                    description={
                      <Tag
                        color={
                          task.status === "Hoàn thành"
                            ? "green"
                            : task.status === "Đang làm"
                            ? "blue"
                            : "default"
                        }
                      >
                        {task.status}
                      </Tag>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Lịch làm việc">
            <Calendar
              fullscreen={false}
              value={selectedDate}
              onSelect={(val) => setSelectedDate(val)}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StaffDashboard;
