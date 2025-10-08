import { Button, Card, Col, Divider, Row, Space, Table } from "antd";
import { useEffect, useState } from "react";
import AddSpa from "./add";
import UpdateSpa from "./update";
import { showError, showSuccess } from "@/libs/toast";
import {
  useDeleteCategoryMutation,
  useGetCategoriesMutation,
} from "@/services/services";
import type { categoriesModelTable } from "./_components/type";
import { categoriesColumn } from "./_components/columnTypes";

export default function Categories() {
  //   const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [createState, setCreateState] = useState<boolean>(false);
  const [updateState, setUpdateState] = useState<boolean>(false);

  const [updateId, setUpdateId] = useState<string>("");
  const [categories, setCategpries] = useState<categoriesModelTable[]>([]);

  const handleUpdate = (id: string) => {
    setUpdateId(id);
    setUpdateState(true);
  };

  useEffect(() => {
    handleGetCategories();
  }, []);

  const [deleteCategory] = useDeleteCategoryMutation();

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await deleteCategory(id);
      console.log("res", res);
      if (res && res.data !== undefined) {
        handleEvent();
        showSuccess("Xoá danh mục thành công");
      } else {
        showError("Xoá danh mục thất bại", "Đã xảy ra lỗi khi xoá danh mục.");
      }
    } catch {
      showError("Xoá danh mục thất bại", "Đã xảy ra lỗi khi xoá danh mục.");
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

  const [getCategories] = useGetCategoriesMutation();

  const handleGetCategories = async () => {
    setIsLoading(true);
    try {
      const res = await getCategories();

      const tempRes = res.data;

      setCategpries(
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

  const handleEvent = () => {
    handleGetCategories();
  };

  return (
    <>
      <Card>
        <div>
          <Row justify={"space-between"} style={{ marginBottom: 16 }}>
            <Col>
              <h4>
                <strong>{"Danh muc"}</strong> <br />
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
                  {"Tạo danh mục"}
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
            columns={categoriesColumn()}
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
