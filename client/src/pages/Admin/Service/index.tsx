import { Button, Card, Col, Divider, Input, Row, Space, Table } from "antd";
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
                  style={{ width: 250 }}
                />
                <Divider type="vertical" />
                <Button
                  type="primary"
                  onClick={() => setCreateState(true)}
                  // disabled={isAdmin}
                >
                  {"Tạo dịch vụ"}
                </Button>
                <AddService
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
