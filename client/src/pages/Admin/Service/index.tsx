import { Button, Card, Col, Divider, Row, Space, Table } from "antd";
import { useEffect, useState } from "react";
import { showError, showSuccess } from "@/libs/toast";
import {
  useDeleteServiceMutation,
  useGetServicesMutation,
} from "@/services/services";
import { servicesColumn } from "./_components/columnTypes";
import type { servicesModelTable } from "./_components/type";
import UpdateService from "./update";
import AddService from "./add";
export default function Services() {
  //   const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [createState, setCreateState] = useState<boolean>(false);
  const [updateState, setUpdateState] = useState<boolean>(false);

  const [updateId, setUpdateId] = useState<string>("");
  const [categories, setCategpries] = useState<servicesModelTable[]>([]);

  const handleUpdate = (id: string) => {
    setUpdateId(id);
    setUpdateState(true);
  };

  useEffect(() => {
    handleGetServices();
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

      setCategpries(
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
            columns={servicesColumn()}
            dataSource={
              Array.isArray(categories) && categories.length > 0
                ? categories.map((categoryy) => ({
                    ...categoryy,
                    onUpdate: () => handleUpdate(categoryy.id),
                    onRemove: () => handleDelete(categoryy.id),
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
