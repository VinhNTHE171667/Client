import { Card, Col, Input, Row, Space, Table, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import { showError, showSuccess } from "@/libs/toast";
import {
  useDeleteServiceMutation,
  useGetCategoriesMutation,
  useGetServicesMutation,
} from "@/services/services";
import { servicesColumn } from "./_components/columnTypes";
import type { servicesModelTable } from "./_components/type";
import UpdateService from "./update";
import AddService from "./add";
import useDebounce from "@/hooks/UseDebounce";
import type { categoriesModelTable } from "../Categories/_components/type";
import { configRoutes } from "@/constants/route";
import { Link } from "react-router-dom";
import FancyButton from "@/components/FancyButton";
import { PiExportFill } from "react-icons/pi";
import FancyCounting from "@/components/FancyCounting";
import FancyBreadcrumb from "@/components/FancyBreadcrumb";
export default function Services() {
  //   const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [createState, setCreateState] = useState<boolean>(false);
  const [updateState, setUpdateState] = useState<boolean>(false);

  const [updateId, setUpdateId] = useState<string>("");
  const [services, setServices] = useState<servicesModelTable[]>([]);

  const [categories, setCategories] = useState<categoriesModelTable[]>([]);

  const [getCategories] = useGetCategoriesMutation();

  const handleGetCategories = async () => {
    setIsLoading(true);
    try {
      const res = await getCategories();

      const tempRes = res.data;

      setCategories(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (tempRes ?? []).map((category: any) => ({
          ...category,
          onUpdate: () => handleUpdate(category.id),
          onRemove: () => handleDelete(category.id),
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

  const handleUpdate = (id: string) => {
    setUpdateId(id);
    setUpdateState(true);
  };

  useEffect(() => {
    handleGetServices();
    handleGetCategories();
  }, []);

  const [deleteService] = useDeleteServiceMutation();

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await deleteService(id);
      console.log("res", res);
      if (res && res.data !== undefined) {
        handleEvent();
        showSuccess("Xoá dịch vụ thành công");
      } else {
        showError("Xoá dịch vụ thất bại", "Đã xảy ra lỗi khi xoá dịch vụ.");
      }
    } catch {
      showError("Xoá dịch vụ thất bại", "Đã xảy ra lỗi khi xoá dịch vụ.");
    } finally {
      setIsLoading(false);
    }
  };

  const [search, setSearch] = useState<string>("");

  const debouncedSearch = useDebounce(search, 500);

  const filteredServices = useMemo(() => {
    if (!debouncedSearch) return services;
    return services.filter((service) =>
      service.name?.toLowerCase().includes(debouncedSearch.trim().toLowerCase())
    );
  }, [services, debouncedSearch]);

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

  const [getServices] = useGetServicesMutation();

  const handleGetServices = async () => {
    setIsLoading(true);
    try {
      const res = await getServices({});

      const tempRes = res.data;

      setServices(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (tempRes ?? []).map((service: any) => ({
          ...service,
          onUpdate: () => handleUpdate(service.id),
          onRemove: () => handleDelete(service.id),
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
    handleGetServices();
  };

  return (
    <>
      <Row className="mx-2 my-2">
        <Col>
          <h4>
            <strong>{"Dịch vụ"}</strong> <br />
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
                title: <span>{"Dịch vụ"}</span>,
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
                label="Thêm dịch vụ"
                size="middle"
                onClick={() => setCreateState(true)}
                variant="primary"
              />
              <AddService
                isOpen={createState}
                onClose={() => setCreateState(false)}
                onReload={handleEvent}
              />
            </Space>
          </Col>
        </Row>

        <Row className="stats-card">
          <Col className="metric">
            <p className="metric-label">{"Tổng số dịch vụ"}</p>
            <FancyCounting
              from={0}
              to={services.length}
              className="metric-value"
              duration={4}
            />
          </Col>
          <Col className="metric">
            <p className="metric-label">{"Tổng tiền"}</p>
            <FancyCounting
              from={0}
              to={services.reduce((acc, c) => acc + Number(c.price || 0), 0)}
              className="metric-value"
              duration={4}
              format={(value) =>
                value.toLocaleString("vi-VN", {
                  style: "currency",
                  currency: "VND",
                })
              }
            />
          </Col>
          <Col className="metric">
            <p className="metric-label">{"Đang hoạt động"}</p>
            <FancyCounting
              from={0}
              to={services.filter((c) => c.isActive).length}
              className="metric-value"
              duration={4}
            />
          </Col>
        </Row>
      </Card>

      <Card>
        <div>
          <Row justify={"space-between"} style={{ marginBottom: 16 }}>
            <Col>
              <h4>
                <strong>{"Dịch vụ"}</strong> <br />
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
                  placeholder="Tìm theo tên dịch vụ..."
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
            columns={servicesColumn(categories)}
            dataSource={
              Array.isArray(filteredServices) && filteredServices.length > 0
                ? filteredServices.map((service) => ({
                    ...service,
                    onUpdate: () => handleUpdate(service.id),
                    onRemove: () => handleDelete(service.id),
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
                `Hiển thị ${range[0]}-${range[1]} trong tổng số ${total} dịch vụ`,
            }}
          />
          <UpdateService
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
