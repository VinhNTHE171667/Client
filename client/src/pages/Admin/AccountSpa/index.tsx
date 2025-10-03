import { Button, Card, Col, Divider, Row, Space, Table } from "antd";
import { useEffect, useState } from "react";
import type { SpaModelTable } from "./_components/type";
import { spaColumn } from "./_components/columnTypes";
import AddSpa from "./add";
import UpdateSpa from "./update";
import { useDeleteSpaMutation, useGetSpasMutation } from "@/services/account";
import { showError, showSuccess } from "@/libs/toast";

export default function AccountSpa() {
  //   const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  //   const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [createState, setCreateState] = useState<boolean>(false);
  const [updateState, setUpdateState] = useState<boolean>(false);

  const [updateId, setUpdateId] = useState<string>("");
  const [spas, setSpas] = useState<SpaModelTable[]>([]);

  const handleUpdate = (id: string) => {
    setUpdateId(id);
    setUpdateState(true);
  };

  const [deleteSpa] = useDeleteSpaMutation();

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await deleteSpa(id);
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

  const [getSpas] = useGetSpasMutation();

  const handleGetSpas = async () => {
    setIsLoading(true);
    try {
      const res = await getSpas();

      const tempRes = res.data;

      setSpas(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (tempRes ?? []).map((spa: any) => ({
          ...spa,
          onUpdate: () => handleUpdate(spa.id),
          onRemove: () => handleDelete(spa.id),
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
    handleGetSpas();
  }, []);

  const handleEvent = () => {
    handleGetSpas();
  };

  return (
    <>
      <Card>
        <div>
          <Row justify={"space-between"} style={{ marginBottom: 16 }}>
            <Col>
              <h4>
                <strong>{"Tài khoản SPA"}</strong> <br />
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
                <AddSpa
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
            columns={spaColumn()}
            dataSource={
              Array.isArray(spas) && spas.length > 0
                ? spas.map((spa) => ({
                    ...spa,
                    onUpdate: () => handleUpdate(spa.id),
                    onRemove: () => handleDelete(spa.id),
                  }))
                : []
            }
            scroll={{ x: "max-content" }}
            tableLayout="fixed"
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
