import { Card, Col, Input, Row, Space, Table, Select } from "antd";
import { useEffect, useState } from "react";
import { showError, showSuccess } from "@/libs/toast";
import { feedbackStatus } from "@/common/types/auth";
import type { FeedbackTableProps } from "./_components/type";
import { FeedbackColumn } from "./_components/columnTypes";
import {
  useApproveFeedbackMutation,
  useGetAllFeedbacksMutation,
  useRejectFeedbackMutation,
} from "@/services/feedback";

export default function FeedbackManagementStaff() {
  const [isLoading, setIsLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState<FeedbackTableProps[]>([]);

  const [search, setSearch] = useState("");
  const [getFeedbacks] = useGetAllFeedbacksMutation();

  const [approveFeedback] = useApproveFeedbackMutation();
  const [rejectFeedback] = useRejectFeedbackMutation();
  const [statusFilter, setStatusFilter] = useState<string[] | null>(null);

  const handleGetAppointments = async () => {
    setIsLoading(true);
    try {
      const res = await getFeedbacks();
      const tempRes = res.data ?? [];
      setFeedbacks(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tempRes.map((feedback: any) => ({
          ...feedback,
          rating: Number(feedback.rating),
          onApprove: () => handleUpdateStatus(feedback.id, "approve"),
          onReject: () => handleUpdateStatus(feedback.id, "reject"),
        }))
      );
    } catch (error) {
      showError("Error", error instanceof Error ? error.message : "Unknown");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleGetAppointments();
  }, []);

  const handleUpdateStatus = async (
    id: string,
    status: "approve" | "reject"
  ) => {
    setIsLoading(true);
    try {
      switch (status) {
        case "approve":
          await approveFeedback(id);
          break;
        case "reject":
          await rejectFeedback(id);
          break;
        default:
          throw new Error("Unknown status");
      }
      showSuccess("Cập nhật trạng thái thành công");
      handleEvent();
    } catch (error) {
      showError("Error", error instanceof Error ? error.message : "Unknown");
    } finally {
      setIsLoading(false);
    }
  };

  // const handleRejectAppointment = async (values: { cancelReason: string }) => {
  //   try {
  //     const res = await updateRejected({
  //       appointmentId: selectedAppointment?.id || "",
  //       reason: values.cancelReason || "Nhân viên từ chối lịch hẹn",
  //     });

  //     if (res) {
  //       showSuccess("Từ chối lịch hẹn thành công.");
  //       handleEvent();
  //     } else {
  //       showError("Từ chối lịch hẹn thất bại.");
  //     }

  //     setRejectModal(false);
  //   } catch (err) {
  //     const msg =
  //       err instanceof Error
  //         ? err.message
  //         : "Đã xảy ra lỗi khi từ chối lịch hẹn.";
  //     showError(msg);
  //   }
  // };

  const filteredFeedbacks = feedbacks.filter((a) => {
    const matchSearch =
      search === "" ||
      a.customer.full_name.toLowerCase().includes(search.toLowerCase());

    const matchStatus = !statusFilter || statusFilter.includes(a.status);

    return matchSearch && matchStatus;
  });

  const handleEvent = () => {
    handleGetAppointments();
  };

  return (
    <>
      <Row className="mx-2 my-2">
        <Col>
          <h4 className="cus-text-primary">
            <strong>Lịch hẹn</strong>
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
            </Space>
          </Col>
          <Col>
            <Space>
              <Select
                allowClear
                placeholder="Chọn trạng thái"
                value={statusFilter ?? undefined}
                onChange={(value) => setStatusFilter(value)}
                style={{ width: 200 }}
                options={[
                  {
                    label: "Chờ xác nhận",
                    value: feedbackStatus.Pending,
                  },
                  {
                    label: "Đã xác nhận",
                    value: feedbackStatus.Approved,
                  },
                  {
                    label: "Đã từ chối",
                    value: feedbackStatus.Rejected,
                  },
                ]}
              />
            </Space>
          </Col>
        </Row>

        <Table
          loading={isLoading}
          rowKey="id"
          columns={FeedbackColumn()}
          dataSource={filteredFeedbacks}
          scroll={{ x: "max-content" }}
          tableLayout="fixed"
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
    </>
  );
}
