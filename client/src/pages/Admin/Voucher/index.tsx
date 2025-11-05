import { Card, Col, Divider, Input, Row, Space, Table } from "antd";
import { useEffect, useMemo, useState } from "react";
import UpdateSpa from "./update";
import { showError, showSuccess } from "@/libs/toast";
import type { VoucherModelTable } from "./_components/type";
import useDebounce from "@/hooks/UseDebounce";
import FancyButton from "@/components/FancyButton";
import { configRoutes } from "@/constants/route";
import { Link } from "react-router-dom";
import FancyBreadcrumb from "@/components/FancyBreadcrumb";
import {
  useDeleteVoucherMutation,
  useGetVouchersMutation,
} from "@/services/voucher";
import { vouchersColumn } from "./_components/columnTypes";
import AddVoucher from "./add";

export default function Vouchers() {
  //   const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [createState, setCreateState] = useState<boolean>(false);
  const [updateState, setUpdateState] = useState<boolean>(false);

  const [updateId, setUpdateId] = useState<string>("");
  const [vouchers, setVouchers] = useState<VoucherModelTable[]>([]);

  const handleUpdate = (id: string) => {
    setUpdateId(id);
    setUpdateState(true);
  };

  useEffect(() => {
    handleGetVouchers();
  }, []);

  const [deleteVoucher] = useDeleteVoucherMutation();

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await deleteVoucher(id);
      console.log("res", res);
      if (res && res.data !== undefined) {
        handleEvent();
        showSuccess("Xoá voucher thành công");
      } else {
        showError("Xoá voucher thất bại", "Đã xảy ra lỗi khi xoá voucher.");
      }
    } catch {
      showError("Xoá voucher thất bại", "Đã xảy ra lỗi khi xoá voucher.");
    } finally {
      setIsLoading(false);
    }
  };

  const [search, setSearch] = useState<string>("");

  const debouncedSearch = useDebounce(search, 500);

  const filteredVouchers = useMemo(() => {
    if (!debouncedSearch) return vouchers;
    return vouchers.filter((voucher) =>
      voucher.code?.toLowerCase().includes(debouncedSearch.trim().toLowerCase())
    );
  }, [vouchers, debouncedSearch]);

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

  const [getVouchers] = useGetVouchersMutation();

  const handleGetVouchers = async () => {
    setIsLoading(true);
    try {
      const res = await getVouchers();

      const tempRes = res.data;

      setVouchers(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (tempRes ?? []).map((voucher: any) => ({
          ...voucher,
          onUpdate: () => handleUpdate(voucher.id),
          onRemove: () => handleDelete(voucher.id),
        }))
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        showError("Error", error.message);
      } else {
        showError("Error", "An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEvent = () => {
    handleGetVouchers();
  };

  return (
    <>
      <Row className="mx-2 my-2">
        <Col>
          <h4 className="cus-text-primary">
            <strong>{"Danh sách voucher"}</strong> <br />
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
                title: <span>{"Danh sách voucher"}</span>,
              },
            ]}
            separator=">"
          />
        </Col>
      </Row>

      <Card className="mt-2">
        <div>
          <Row justify={"space-between"} style={{ marginBottom: 16 }}>
            <Col>
              <h4>
                <strong>{"Danh sách voucher"}</strong> <br />
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
                  placeholder="Tìm theo tên danh mục..."
                  allowClear
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: 300 }}
                  size="large"
                />
                <Divider type="vertical" />
                <FancyButton
                  variant="primary"
                  label="Thêm voucher"
                  size="middle"
                  onClick={() => setCreateState(true)}
                />
                <AddVoucher
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
            columns={vouchersColumn()}
            dataSource={
              Array.isArray(filteredVouchers) && filteredVouchers.length > 0
                ? filteredVouchers.map((voucher) => ({
                    ...voucher,
                    onUpdate: () => handleUpdate(voucher.id),
                    onRemove: () => handleDelete(voucher.id),
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
                `Hiển thị ${range[0]}-${range[1]} trong tổng số ${total} danh mục`,
            }}
          />
          <UpdateSpa
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
