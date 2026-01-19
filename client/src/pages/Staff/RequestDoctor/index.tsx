/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, Col, Input, Row, Space, Table, Select } from "antd";
import { useEffect, useState } from "react";
import { showError, showSuccess } from "@/libs/toast";
import { DoctorCancelRequestColumn } from "./_components/columnTypes";
import {
  useApproveDoctorCancelRequestMutation,
  useGetDoctorCancelRequestsMutation,
  useRejectDoctorCancelRequestMutation,
} from "@/services/appointment";
import type { DoctorRequestCancelPropsModel } from "./_components/type";

export default function DoctorCancelRequestManagementStaff() {
  const [isLoading, setIsLoading] = useState(false);
  const [requests, setRequests] = useState<DoctorRequestCancelPropsModel[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[] | null>(null);

  const [getRequests] = useGetDoctorCancelRequestsMutation();
  const [approveRequest] = useApproveDoctorCancelRequestMutation();
  const [rejectRequest] = useRejectDoctorCancelRequestMutation();

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await getRequests();
      const data = res.data ?? [];
      setRequests(
        data.map((r: any) => ({
          ...r,
          onApprove: () => handleUpdateStatus(r.id, "approve"),
          onReject: () => handleUpdateStatus(r.id, "reject"),
        }))
      );
    } catch (err) {
      showError("Error", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdateStatus = async (
    id: string,
    status: "approve" | "reject"
  ) => {
    setIsLoading(true);
    try {
      switch (status) {
        case "approve":
          await approveRequest({ requestId: id });
          showSuccess("Đã duyệt yêu cầu thành công");
          break;
        case "reject":
          await rejectRequest({ requestId: id });
          showSuccess("Đã từ chối yêu cầu thành công");
          break;
      }
      fetchRequests();
    } catch (err) {
      showError("Error", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchSearch =
      search === "" ||
      r.doctor.full_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || statusFilter.includes(r.status);
    return matchSearch && matchStatus;
  });

  return (
    <>
      <Row className="mx-2 my-2">
        <Col>
          <h4 className="cus-text-primary">
            <strong>Yêu cầu hủy của bác sĩ</strong>
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
                placeholder="Tìm theo tên bác sĩ..."
                allowClear
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 250 }}
              />
            </Space>
          </Col>
          <Col>
            <Select
              allowClear
              placeholder="Chọn trạng thái"
              value={statusFilter ?? undefined}
              onChange={(value) => setStatusFilter(value)}
              style={{ width: 200 }}
              options={[
                { label: "Chờ duyệt", value: "pending" },
                { label: "Đã duyệt", value: "approved" },
                { label: "Đã từ chối", value: "rejected" },
              ]}
            />
          </Col>
        </Row>

        <Table
          loading={isLoading}
          rowKey="id"
          columns={DoctorCancelRequestColumn()}
          dataSource={filteredRequests}
          scroll={{ x: "max-content" }}
          tableLayout="fixed"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            position: ["bottomRight"],
            showTotal: (total, range) =>
              `Hiển thị ${range[0]}-${range[1]} trong ${total} yêu cầu`,
          }}
        />
      </Card>
    </>
  );
}
