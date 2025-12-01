import { Card, Col, Input, Row, Space, Table } from "antd";
import { useEffect, useMemo, useState } from "react";
import type { CustomerModelTable } from "./_components/type";
import { customerColumn } from "./_components/columnTypes";
import AddCustomer from "./add";
import UpdateCustomer from "./update";
import {
  useDeleteCustomerMutation,
  useGetCustomersMutation,
} from "@/services/account";
import { showError, showSuccess } from "@/libs/toast";
import useDebounce from "@/hooks/UseDebounce";
import { Link } from "react-router-dom";
import { configRoutes } from "@/constants/route";
import { Typography } from "antd";
import FancyButton from "@/components/FancyButton";
import { PiExportFill } from "react-icons/pi";
import FancySegment from "@/components/FancySegment";
import { CustomerTypeEnum } from "@/common/types/auth";
import FancyCounting from "@/components/FancyCounting";
import FancyBreadcrumb from "@/components/FancyBreadcrumb";
import { useGetInvoiceMutation } from "@/services/appointment";

const { Text } = Typography;

export default function AccountCustomer() {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [createState, setCreateState] = useState<boolean>(false);
  const [updateState, setUpdateState] = useState<boolean>(false);
  const [updateId, setUpdateId] = useState<string>("");

  const [allCustomers, setAllCustomers] = useState<CustomerModelTable[]>([]);
  const [customers, setCustomers] = useState<CustomerModelTable[]>([]);

  const [getInvoice] = useGetInvoiceMutation();
  const [invoices, setInvoices] = useState<any[]>([]);

  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);

  const [deleteCustomer] = useDeleteCustomerMutation();
  const [getCustomers] = useGetCustomersMutation();

  const handleUpdate = (id: string) => {
    setUpdateId(id);
    setUpdateState(true);
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      await deleteCustomer(id).unwrap();
      showSuccess("Xoá tài khoản thành công");
      handleEvent();
    } catch {
      showError("Xoá thất bại", "Đã xảy ra lỗi khi xoá tài khoản.");
    } finally {
      setIsLoading(false);
    }
  };

  // LẤY DANH SÁCH KHÁCH HÀNG
  const handleGetCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await getCustomers().unwrap();
      if (Array.isArray(res)) {
        const formatted = res.map((c: any) => ({
          ...c,
          isVerified: c.isVerified ?? false,
          total_spent: "0", // sẽ được tính lại bên dưới
        }));
        setAllCustomers(formatted);
        setCustomers(formatted);
      }
    } catch (error) {
      showError("Lỗi", "Không thể tải danh sách khách hàng");
    } finally {
      setIsLoading(false);
    }
  };

  // LẤY HOÁ ĐƠN ĐỂ TÍNH TỔNG CHI TIÊU
  const fetchInvoices = async () => {
    try {
      const res = await getInvoice().unwrap();
      setInvoices(res ?? []);
    } catch (error) {
      console.error("Lỗi lấy hóa đơn:", error);
    }
  };

  const customersWithRealSpent = useMemo(() => {
    const spentMap = new Map<string, number>();

    invoices.forEach((inv: any) => {
      const customerId = inv.customerId;
      const amount = Number(inv.finalAmount || 0);
      if (customerId && amount > 0) {
        spentMap.set(customerId, (spentMap.get(customerId) || 0) + amount);
      }
    });

    return customers.map((customer) => ({
      ...customer,
      total_spent: (spentMap.get(customer.id) || 0).toString(),
    }));
  }, [customers, invoices]);

  const totalRealSpent = useMemo(() => {
    return customersWithRealSpent.reduce(
      (sum, c) => sum + Number(c.total_spent || 0),
      0
    );
  }, [customersWithRealSpent]);

  const filteredCustomers = useMemo(() => {
    if (!debouncedSearch) return customersWithRealSpent;
    return customersWithRealSpent.filter((c) =>
      c.full_name?.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [customersWithRealSpent, debouncedSearch]);

  const [filter, setFilter] = useState<{
    label: string;
    value: string;
  }>({ label: "Tất cả", value: "all" });

  useEffect(() => {
    if (filter.value === "all") {
      setCustomers(allCustomers);
    } else {
      setCustomers(
        allCustomers.filter((c) => c.customer_type === filter.value)
      );
    }
  }, [filter, allCustomers]);

  const handleEvent = () => {
    handleGetCustomers();
    fetchInvoices();
  };

  useEffect(() => {
    handleGetCustomers();
    fetchInvoices();
  }, []);

  return (
    <>
      <Row className="mx-2 my-2">
        <Col>
          <h4 className="cus-text-primary">
            <strong>Tài khoản khách hàng</strong>
          </h4>
        </Col>
        <Col style={{ marginLeft: "auto" }}>
          <FancyBreadcrumb
            items={[
              {
                title: <Link to={configRoutes.adminDashboard}>Dashboard</Link>,
              },
              { title: <span>Tài khoản khách hàng</span> },
            ]}
            separator=">"
          />
        </Col>
      </Row>

      {/* TỔNG QUAN - HIỂN THỊ SỐ LIỆU THỰC */}
      <Card className="mb-4 p-4" size="small">
        <Row className="mb-3">
          <Col className="d-flex align-items-center">
            <Typography.Title level={4} className="m-0">
              <strong>Tổng quan</strong>
            </Typography.Title>
          </Col>
          <Col style={{ marginLeft: "auto" }}>
            <FancyButton
              label="Thêm khách hàng"
              size="middle"
              onClick={() => setCreateState(true)}
              variant="primary"
            />
          </Col>
        </Row>

        <Row className="stats-card">
          <Col className="metric">
            <p className="metric-label">Tổng số khách hàng</p>
            <FancyCounting
              from={0}
              to={customersWithRealSpent.length}
              duration={2}
            />
          </Col>
          <Col className="metric">
            <p className="metric-label">Tổng tiền đã chi tiêu (thực tế)</p>
            <p className="metric-value text-green-600 font-bold">
              <FancyCounting
                from={0}
                to={totalRealSpent}
                duration={3}
                format={(v) =>
                  v.toLocaleString("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  })
                }
              />
            </p>
          </Col>
          <Col className="metric">
            <p className="metric-label">Khách hàng xác thực</p>
            <FancyCounting
              from={0}
              to={customersWithRealSpent.filter((c) => c.isVerified).length}
              duration={2}
            />
          </Col>
        </Row>
      </Card>

      <Card>
        <Row justify="space-between" style={{ marginBottom: 16 }}>
          <Col>
            <Typography.Title level={4} className="m-0">
              <strong>Danh sách khách hàng</strong>
            </Typography.Title>
          </Col>
          <Col>
            <Space>
              <FancySegment
                options={[
                  { label: "Tất cả", value: "all" },
                  { label: "Thường", value: CustomerTypeEnum.Regular },
                  { label: "Thành viên", value: CustomerTypeEnum.Member },
                  { label: "VIP", value: CustomerTypeEnum.Vip },
                ]}
                value={filter}
                onChange={setFilter}
                defaultValue={{ label: "Tất cả", value: "all" }}
                size="small"
              />
              <Input.Search
                placeholder="Tìm theo tên..."
                allowClear
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 300 }}
                size="large"
              />
              <FancyButton
                size="small"
                variant="outline"
                icon={<PiExportFill />}
                label="Xuất file"
              />
            </Space>
          </Col>
        </Row>

        <Table
          loading={isLoading}
          rowKey="id"
          columns={customerColumn()}
          dataSource={filteredCustomers.map((c) => ({
            ...c,
            onUpdate: () => handleUpdate(c.id),
            onRemove: () => handleDelete(c.id),
          }))}
          scroll={{ x: "max-content" }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total) => `Tổng ${total} khách hàng`,
          }}
        />

        <AddCustomer
          isOpen={createState}
          onClose={() => setCreateState(false)}
          onReload={handleEvent}
        />
        <UpdateCustomer
          id={updateId}
          isOpen={updateState}
          onClose={() => setUpdateState(false)}
          onReload={handleEvent}
        />
      </Card>
    </>
  );
}
