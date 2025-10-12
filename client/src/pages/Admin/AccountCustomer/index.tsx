import { Button, Card, Col, Divider, Input, Row, Space, Table } from "antd";
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

export default function AccountCustomer() {
  //   const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  //   const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [createState, setCreateState] = useState<boolean>(false);
  const [updateState, setUpdateState] = useState<boolean>(false);

  const [updateId, setUpdateId] = useState<string>("");
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

  return (
    <>
      <Card>
        <div>
          <Row justify={"space-between"} style={{ marginBottom: 16 }}>
            <Col>
              <h4>
                <strong>{"Tài khoản khách hàng"}</strong> <br />
              </h4>
              {/* <Breadcrumb
              items={[
                {
                  title: (
                    <Link href={"/admin"}>
                      {"Quản lý tài khoản"}
                    </Link>
                  ),
                },
                {
                  title: t("admin.account.breadCrumb.admin"),
                },
              ]}
            /> */}
            </Col>
            <Col>
              <Space>
                <Input.Search
                  placeholder="Tìm theo tên khách hàng..."
                  allowClear
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: 250 }}
                />
                <Divider type="vertical" />
                <Button type="primary" onClick={() => setCreateState(true)}>
                  {"Tạo tài khoản"}
                </Button>
                <AddCustomer
                  isOpen={createState}
                  onClose={() => setCreateState(false)}
                  onReload={handleEvent}
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
