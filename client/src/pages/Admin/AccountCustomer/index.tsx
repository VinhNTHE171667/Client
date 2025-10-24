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

// import styles from "./AccountCustomer.module.scss";
// import classNames from "classnames/bind";

// const cx = classNames.bind(styles);

export default function AccountCustomer() {
  //   const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  //   const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [createState, setCreateState] = useState<boolean>(false);
  const [updateState, setUpdateState] = useState<boolean>(false);

  const [updateId, setUpdateId] = useState<string>("");
  const [allCustomers, setAllCustomers] = useState<CustomerModelTable[]>([]);
  const [customers, setCustomers] = useState<CustomerModelTable[]>([]);

  const handleUpdate = (id: string) => {
    setUpdateId(id);
    setUpdateState(true);
  };

  const [deleteCustomer] = useDeleteCustomerMutation();

  const [search, setSearch] = useState<string>("");

  const debouncedSearch = useDebounce(search, 500);

  const filteredCustomers = useMemo(() => {
    if (!debouncedSearch) return customers;
    return customers.filter((customer) =>
      customer.full_name
        ?.toLowerCase()
        .includes(debouncedSearch.trim().toLowerCase())
    );
  }, [customers, debouncedSearch]);

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await deleteCustomer(id);
      if (res.data) {
        handleEvent();
        showSuccess("Xoá tài khoản thành công");
      } else {
        showError("Xoá tài khoản thất bại", "Đã xảy ra lỗi khi xoá tài khoản.");
      }
    } catch {
      showError("Xoá tài khoản thất bại", "Đã xảy ra lỗi khi xoá tài khoản.");
    } finally {
      setIsLoading(false);
    }
  };

  //   const handleDisable = async (username: string, status: string) => {
  //     setIsLoading(true);
  //     if (status === "ACTIVE") {
  //       try {
  //         const res = await instance.post(
  //           `/account-management/disable-account/${username}`
  //         );
  //         if (res.data.statusCode === 200) {
  //         } else {
  //         }
  //       } catch (error) {}
  //     } else if (status === "") {
  //       try {
  //         const res = await instance.post(
  //           `/account-management/active-account/${username}`
  //         );
  //         if (res.data.statusCode === 200) {
  //         } else {
  //         }
  //       } catch (error) {}
  //     }
  //     setIsLoading(false);
  //   };

  const [getCustomers] = useGetCustomersMutation();

  const handleGetCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await getCustomers();

      const tempRes = res.data;

      if (Array.isArray(tempRes)) {
        setAllCustomers(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tempRes.map((customer: any) => ({
            ...customer,
            isVerified: customer.isVerified ?? false,
          }))
        );

        setCustomers(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tempRes.map((customer: any) => ({
            ...customer,
            isVerified: customer.isVerified ?? false,
          }))
        );
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        showError("Lỗi khi lấy danh sách khách hàng", error.message);
      } else {
        showError(
          "Lỗi khi lấy danh sách khách hàng",
          "Đã xảy ra lỗi không xác định."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleGetCustomers();
  }, []);

  const handleEvent = () => {
    handleGetCustomers();
  };

  const [filter, setFilter] = useState<{
    label: string;
    value: string;
  }>({ label: "Tất cả", value: "all" });

  useEffect(() => {
    if (filter.value === "all") {
      setCustomers(allCustomers);
    } else if (filter.value === CustomerTypeEnum.member) {
      setCustomers(
        allCustomers.filter((c) => c.customer_type === CustomerTypeEnum.member)
      );
    } else if (filter.value === CustomerTypeEnum.vip) {
      setCustomers(
        allCustomers.filter((c) => c.customer_type === CustomerTypeEnum.vip)
      );
    } else if (filter.value === CustomerTypeEnum.regular) {
      setCustomers(
        allCustomers.filter((c) => c.customer_type === CustomerTypeEnum.regular)
      );
    }
  }, [filter]);

  return (
    <>
      <Row className="mx-2 my-2">
        <Col>
          <h4 className="cus-text-primary">
            <strong>{"Tài khoản khách hàng"}</strong> <br />
          </h4>
        </Col>
        <Col style={{ marginLeft: "auto" }}>
          <FancyBreadcrumb
            items={[
              {
                title: (
                  <Link to={configRoutes.adminDashboard}>{"Dashboard"}</Link>
                ),
              },
              {
                title: <span>{"Tài khoản khách hàng"}</span>,
              },
            ]}
            separator=">"
          />
        </Col>
      </Row>
      <Card className="mb-4 p-4" size="small">
        <Row className="mb-3">
          <Col className="d-flex align-items-center">
            <Typography.Title level={4} className="m-0">
              <strong>{"Tổng quan"}</strong>
            </Typography.Title>
          </Col>
          <Col style={{ marginLeft: "auto" }}>
            <Space>
              <FancyButton
                label="Thêm khách hàng"
                size="middle"
                onClick={() => setCreateState(true)}
                variant="primary"
              />
              <AddCustomer
                isOpen={createState}
                onClose={() => setCreateState(false)}
                onReload={handleEvent}
              />
            </Space>
          </Col>
        </Row>

        <Row className="stats-card">
          <Col className="metric">
            <p className="metric-label">{"Tổng số khách hàng"}</p>
            <FancyCounting
              className="metric-value"
              from={0}
              to={customers.length}
              duration={4}
            />
          </Col>
          <Col className="metric">
            <p className="metric-label">{"Tổng tiền đã chi tiêu"}</p>
            <p className="metric-value">
              <FancyCounting
                from={0}
                to={customers.reduce(
                  (acc, c) => acc + Number(c.total_spent || 0),
                  0
                )}
                duration={4}
                format={(value) =>
                  value.toLocaleString("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  })
                }
              />
            </p>
          </Col>
          <Col className="metric">
            <p className="metric-label">{"Khách hàng xác thực"}</p>
            <p className="metric-value">
              <FancyCounting
                from={0}
                to={customers.filter((c) => c.isVerified).length}
                duration={4}
              />
              /{customers.filter((c) => c.isVerified).length}
            </p>
          </Col>
        </Row>
      </Card>

      <Card>
        <div>
          <Row justify={"space-between"} style={{ marginBottom: 16 }}>
            <Col>
              <Typography.Title level={4} className="m-0">
                <strong>{"Danh sách khách hàng"}</strong>
              </Typography.Title>
            </Col>
            <Col>
              <Space>
                <FancySegment
                  options={[
                    { label: "Tất cả", value: "all" },
                    { label: "Thường", value: CustomerTypeEnum.regular },
                    { label: "Thành viên", value: CustomerTypeEnum.member },
                    { label: "VIP", value: CustomerTypeEnum.vip },
                  ]}
                  value={filter}
                  onChange={setFilter}
                  defaultValue={{ label: "Tất cả", value: "all" }}
                  size="small"
                  variant="outline"
                />
                <Input.Search
                  placeholder="Tìm theo tên khách hàng..."
                  allowClear
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: 300 }}
                  size="large"
                />
                {/* <Divider type="vertical" /> */}
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
            //   onRow={(record) => ({
            //     onClick: (event) => {
            //       const target = event.target as HTMLElement;
            //       const isWithinLink =
            //         target.tagName === "A" || target.closest("a");
            //       const isWithinAction =
            //         target.closest("td")?.classList.contains("ant-table-cell") &&
            //         !target
            //           .closest("td")
            //           ?.classList.contains("ant-table-selection-column") &&
            //         !target
            //           .closest("td")
            //           ?.classList.contains("ant-table-cell-fix-right");

            //       if (isWithinAction && !isWithinLink) {
            //         handleUpdate(record.id);
            //       }
            //     },
            //   })}
            columns={customerColumn()}
            dataSource={
              Array.isArray(filteredCustomers) && filteredCustomers.length > 0
                ? filteredCustomers.map((customer) => ({
                    ...customer,
                    onUpdate: () => handleUpdate(customer.id),
                    onRemove: () => handleDelete(customer.id),
                  }))
                : []
            }
            scroll={{ x: "max-content" }}
            tableLayout="fixed"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100"],
              position: ["bottomRight"],
              showTotal: (total, range) =>
                `Hiển thị ${range[0]}-${range[1]} trong tổng số ${total} khách hàng`,
            }}
          />
          <UpdateCustomer
            id={updateId}
            isOpen={updateState}
            onClose={() => setUpdateState(false)}
            onReload={handleEvent}
          />
        </div>
      </Card>
    </>
  );
}
