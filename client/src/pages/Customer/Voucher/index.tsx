import { Card, Col, Row, Space, Table, Divider } from "antd";
import { useEffect, useState } from "react";
import { showError } from "@/libs/toast";
import { VoucherColumn } from "./_components/columnTypes";
import {
  useFindVouchersByCustomerMutation,
  type voucherData,
} from "@/services/voucher";
import { useAuthStore } from "@/hooks/UseAuth";

export default function VoucherCustomer() {
  const [isLoading, setIsLoading] = useState(false);
  const [vouchers, setVouchers] = useState<voucherData[]>([]);

  const [getVouchersByCustomer] = useFindVouchersByCustomerMutation();

  const { auth } = useAuthStore();

  const handleGetInvoices = async () => {
    setIsLoading(true);
    try {
      const res = await getVouchersByCustomer(auth.accountId!);
      const tempRes = res.data ?? [];
      setVouchers(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tempRes.map((invoice: any) => ({
          ...invoice,
        }))
      );
    } catch (error) {
      showError("Error", error instanceof Error ? error.message : "Unknown");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleGetInvoices();
  }, []);

  //   const handleEvent = () => {
  //     handleGetInvoices();
  //   };

  return (
    <div className="container my-3">
      <Row className="mx-2 my-2">
        <Col>
          <h4 className="cus-text-primary">
            <strong>Voucher của tôi</strong>
          </h4>
        </Col>
        <Col style={{ marginLeft: "auto" }}></Col>
      </Row>

      <Card className="mt-2">
        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: 16 }}
        >
          <Col>
            <Space></Space>
          </Col>
          <Col>
            <Space>
              <Divider type="vertical" />
            </Space>
          </Col>
        </Row>

        <Table
          loading={isLoading}
          rowKey="id"
          columns={VoucherColumn()}
          dataSource={vouchers}
          scroll={{ x: "max-content" }}
          tableLayout="fixed"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            position: ["bottomRight"],
            showTotal: (total, range) =>
              `Hiển thị ${range[0]}-${range[1]} trong ${total} voucher`,
          }}
        />
      </Card>
    </div>
  );
}
