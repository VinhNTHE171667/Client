import { Button, Card, Col, Divider, Row, Space, Table } from "antd";
import { useEffect, useState } from "react";
import {
  useDeleteStaffMutation,
  useGetStaffsMutation,
  type StaffData,
} from "@/services/account";
import { showError, showSuccess } from "@/libs/toast";
import { staffColumn } from "./_components/columnTypes";
import AddStaff from "./add";
import UpdateStaff from "./update";

export default function AccountStaff() {
  //   const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  //   const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [createState, setCreateState] = useState<boolean>(false);
  const [updateState, setUpdateState] = useState<boolean>(false);

  const [updateId, setUpdateId] = useState<string>("");
  const [staffs, setStaffs] = useState<StaffData[]>([]);

  const handleUpdate = (id: string) => {
    setUpdateId(id);
    setUpdateState(true);
  };

  const [deleteStaff] = useDeleteStaffMutation();

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await deleteStaff(id);
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

  const [getStaff] = useGetStaffsMutation();

  const handleGetStaffs = async () => {
    setIsLoading(true);
    try {
      const res = await getStaff();

      const tempRes = res.data;

      setStaffs(
        (tempRes ?? []).map((staff: StaffData) => ({
          ...staff,
          onUpdate: () => handleUpdate(staff.id),
          onRemove: () => handleDelete(staff.id),
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

  useEffect(() => {
    handleEvent();
  }, []);

  const handleEvent = () => {
    handleGetStaffs();
  };

  // const { auth } = useAuthStore();

  return (
    <>
      <Card>
        <div>
          <Row justify={"space-between"} style={{ marginBottom: 16 }}>
            <Col>
              <h4>
                <strong>{"Tài khoản nhân viên SPA"}</strong> <br />
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
                <Divider type="vertical" />
                <Button type="primary" onClick={() => setCreateState(true)}>
                  {"Tạo tài khoản"}
                </Button>
                <AddStaff
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
            columns={staffColumn()}
            dataSource={
              Array.isArray(staffs) && staffs.length > 0
                ? staffs.map((staff) => ({
                    ...staff,
                    onUpdate: () => handleUpdate(staff.id),
                    onRemove: () => handleDelete(staff.id),
                  }))
                : []
            }
            scroll={{ x: "max-content" }}
            tableLayout="fixed"
          />
          <UpdateStaff
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
