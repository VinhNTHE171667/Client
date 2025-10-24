import { Card, Col, Input, Row, Space, Table, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import {
  useDeleteStaffMutation,
  useGetStaffsMutation,
  type StaffData,
} from "@/services/account";
import { showError, showSuccess } from "@/libs/toast";
import { staffColumn } from "./_components/columnTypes";
import AddStaff from "./add";
import UpdateStaff from "./update";
import useDebounce from "@/hooks/UseDebounce";
import { Link } from "react-router-dom";
import { configRoutes } from "@/constants/route";
import FancyButton from "@/components/FancyButton";
import { RoleEnum } from "@/common/types/auth";
import FancySegment from "@/components/FancySegment";
import { PiExportFill } from "react-icons/pi";
import FancyCounting from "@/components/FancyCounting";
import FancyBreadcrumb from "@/components/FancyBreadcrumb";

export default function AccountStaff() {
  //   const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  //   const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [createState, setCreateState] = useState<boolean>(false);
  const [updateState, setUpdateState] = useState<boolean>(false);

  const [updateId, setUpdateId] = useState<string>("");
  const [staffs, setStaffs] = useState<StaffData[]>([]);
  const [allStaffs, setAllStaffs] = useState<StaffData[]>([]);

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

  const [search, setSearch] = useState<string>("");

  const debouncedSearch = useDebounce(search, 500);

  const filteredStaffs = useMemo(() => {
    if (!debouncedSearch) return staffs;
    return staffs.filter((staff) =>
      staff.full_name
        ?.toLowerCase()
        .includes(debouncedSearch.trim().toLowerCase())
    );
  }, [staffs, debouncedSearch]);

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

      setAllStaffs(
        (tempRes ?? []).map((staff: StaffData) => ({
          ...staff,
          onUpdate: () => handleUpdate(staff.id),
          onRemove: () => handleDelete(staff.id),
        }))
      );

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

  const [filter, setFilter] = useState<{
    label: string;
    value: string;
  }>({ label: "Tất cả", value: "all" });

  useEffect(() => {
    if (filter.value === "all") {
      setStaffs(allStaffs);
    } else if (filter.value === RoleEnum.Admin) {
      setStaffs(
        allStaffs.filter(
          (c) =>
            c.role?.name.toLocaleLowerCase() ===
            RoleEnum.Admin.toLocaleLowerCase()
        )
      );
    } else if (filter.value === RoleEnum.Staff) {
      setStaffs(
        allStaffs.filter(
          (c) =>
            c.role?.name.toLocaleLowerCase() ===
            RoleEnum.Staff.toLocaleLowerCase()
        )
      );
    } else if (filter.value === RoleEnum.Casher) {
      setStaffs(
        allStaffs.filter(
          (c) =>
            c.role?.name.toLocaleLowerCase() ===
            RoleEnum.Casher.toLocaleLowerCase()
        )
      );
    }

    console.log("filter", filter);
  }, [filter]);

  return (
    <>
      <Row className="mx-2 my-2">
        <Col>
          <h4 className="cus-text-primary">
            <strong>{"Tài khoản hệ thống"}</strong> <br />
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
                title: <span>{"Tài khoản nhân viên"}</span>,
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
                label="Thêm nhân viên"
                size="middle"
                onClick={() => setCreateState(true)}
                variant="primary"
              />
              <AddStaff
                isOpen={createState}
                onClose={() => setCreateState(false)}
                onReload={handleEvent}
              />
            </Space>
          </Col>
        </Row>

        <Row className="stats-card">
          <Col className="metric">
            <p className="metric-label">
              <strong>{"Tổng số nhân viên"}</strong>
            </p>
            <FancyCounting
              className="metric-value"
              from={0}
              to={staffs.length}
              duration={4}
            />
          </Col>
          <Col className="metric">
            <p className="metric-label">
              <strong>{"Tổng số admin"}</strong>
            </p>
            <FancyCounting
              className="metric-value"
              from={0}
              to={
                staffs.filter(
                  (c) =>
                    c.role?.name.toLocaleLowerCase() ===
                    RoleEnum.Admin.toLocaleLowerCase()
                ).length
              }
              duration={4}
            />
          </Col>

          <Col className="metric">
            <p className="metric-label">
              <strong>{"Tổng số nhân viên"}</strong>
            </p>
            <FancyCounting
              className="metric-value"
              from={0}
              to={
                staffs.filter(
                  (c) =>
                    c.role?.name.toLocaleLowerCase() ===
                    RoleEnum.Staff.toLocaleLowerCase()
                ).length
              }
              duration={4}
            />
          </Col>

          <Col className="metric">
            <p className="metric-label">
              <strong>{"Tổng số thu ngân"}</strong>
            </p>
            <FancyCounting
              className="metric-value"
              from={0}
              to={
                staffs.filter(
                  (c) =>
                    c.role?.name.toLocaleLowerCase() ===
                    RoleEnum.Casher.toLocaleLowerCase()
                ).length
              }
              duration={4}
            />
          </Col>
        </Row>
      </Card>

      <Card>
        <div>
          <Row justify={"space-between"} style={{ marginBottom: 16 }}>
            <Col>
              <Typography.Title level={4} className="m-0">
                <strong>{"Danh sách hệ thống"}</strong>
              </Typography.Title>
            </Col>
            <Col>
              <Space>
                <FancySegment
                  options={[
                    { label: "Tất cả", value: "all" },
                    { label: "Admin", value: RoleEnum.Admin },
                    { label: "Nhân viên", value: RoleEnum.Staff },
                    { label: "Thu ngân", value: RoleEnum.Casher },
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
            columns={staffColumn()}
            dataSource={
              Array.isArray(filteredStaffs) && filteredStaffs.length > 0
                ? filteredStaffs.map((staff) => ({
                    ...staff,
                    onUpdate: () => handleUpdate(staff.id),
                    onRemove: () => handleDelete(staff.id),
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
                `Hiển thị ${range[0]}-${range[1]} trong tổng số ${total} nhân viên`,
            }}
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
