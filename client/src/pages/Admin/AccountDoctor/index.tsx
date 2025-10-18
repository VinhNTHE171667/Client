import { Card, Col, Input, Row, Space, Table } from "antd";
import { useEffect, useMemo, useState } from "react";
import type { DoctorModelTable } from "./_components/type";
import {
  useDeleteCustomerMutation,
  useGetDoctorsMutation,
} from "@/services/account";
import { showError, showSuccess } from "@/libs/toast";
import useDebounce from "@/hooks/UseDebounce";
import { Link } from "react-router-dom";
import { configRoutes } from "@/constants/route";
import { Typography } from "antd";
import FancyButton from "@/components/FancyButton";
import { PiExportFill } from "react-icons/pi";
// import FancyCounting from "@/components/FancyCounting";
import FancyBreadcrumb from "@/components/FancyBreadcrumb";
import { doctorColumn } from "./_components/columnTypes";
import AddDoctor from "./add";
import UpdateDoctor from "./update";

// import styles from "./AccountCustomer.module.scss";
// import classNames from "classnames/bind";

// const cx = classNames.bind(styles);

export default function AccountDoctor() {
  //   const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  //   const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [createState, setCreateState] = useState<boolean>(false);
  const [updateState, setUpdateState] = useState<boolean>(false);

  const [updateId, setUpdateId] = useState<string>("");
  const [doctors, setDoctors] = useState<DoctorModelTable[]>([]);

  const handleUpdate = (id: string) => {
    setUpdateId(id);
    setUpdateState(true);
  };

  const [deleteCustomer] = useDeleteCustomerMutation();

  const [search, setSearch] = useState<string>("");

  const debouncedSearch = useDebounce(search, 500);

  const filteredDoctors = useMemo(() => {
    if (!debouncedSearch) return doctors;
    return doctors.filter((doctor) =>
      doctor.full_name
        ?.toLowerCase()
        .includes(debouncedSearch.trim().toLowerCase())
    );
  }, [doctors, debouncedSearch]);

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

  const [getDoctors] = useGetDoctorsMutation();

  const handleGetDoctors = async () => {
    setIsLoading(true);
    try {
      const res = await getDoctors();

      const tempRes = res.data;

      if (Array.isArray(tempRes)) {
        setDoctors(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tempRes.map((doctor: any) => ({
            ...doctor,
            experience_years: Number(doctor.experience_years),
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
    handleGetDoctors();
  }, []);

  const handleEvent = () => {
    handleGetDoctors();
  };

  return (
    <>
      <Row className="mx-2 my-2">
        <Col>
          <h4>
            <strong>{"Tài khoản bác sĩ"}</strong> <br />
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
                title: <span>{"Tài khoản bác sĩ"}</span>,
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
                label="Thêm bác sĩ"
                size="middle"
                onClick={() => setCreateState(true)}
                variant="primary"
              />
              <AddDoctor
                isOpen={createState}
                onClose={() => setCreateState(false)}
                onReload={handleEvent}
              />
            </Space>
          </Col>
        </Row>

        {/* <Row className="stats-card">
          <Col className="metric">
            <p className="metric-label">{"Tổng số bác sĩ"}</p>
            <FancyCounting
              className="metric-value"
              from={0}
              to={doctors.length}
              duration={4}
            />
          </Col>
          <Col className="metric">
            <p className="metric-label">{"Tổng tiền đã chi tiêu"}</p>
            <p className="metric-value">
              <FancyCounting
                from={0}
                to={doctors.reduce(
                  (acc, d) => acc + Number(d.total_spent || 0),
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
                to={doctors.filter((d) => d.isVerified).length}
                duration={4}
              />
              /{doctors.filter((d) => d.isVerified).length}
            </p>
          </Col>
        </Row> */}
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
                <Input.Search
                  placeholder="Tìm theo tên bác sĩ..."
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
            columns={doctorColumn()}
            dataSource={
              Array.isArray(filteredDoctors) && filteredDoctors.length > 0
                ? filteredDoctors.map((doctor) => ({
                    ...doctor,
                    onUpdate: () => handleUpdate(doctor.id),
                    onRemove: () => handleDelete(doctor.id),
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
          <UpdateDoctor
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
