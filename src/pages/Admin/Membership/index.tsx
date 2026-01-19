import { Card, Col, Row, Table } from "antd";
import { useEffect, useState } from "react";
import { showError } from "@/libs/toast";
import { configRoutes } from "@/constants/route";
import { Link } from "react-router-dom";
import FancyBreadcrumb from "@/components/FancyBreadcrumb";
import { membershipsColumn } from "./_components/columnTypes";
import { useGetMembershipsMutation } from "@/services/membership";
import type { MembershipModelTable } from "./_components/type";
import UpdateMembership from "./update";

export default function Membership() {
  //   const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [updateState, setUpdateState] = useState<boolean>(false);

  const [updateId, setUpdateId] = useState<string>("");
  const [memberships, setMemberships] = useState<MembershipModelTable[]>([]);

  const handleUpdate = (id: string) => {
    setUpdateId(id);
    setUpdateState(true);
  };

  useEffect(() => {
    handleGetMemberships();
  }, []);

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

  const [getMemberships] = useGetMembershipsMutation();

  const handleGetMemberships = async () => {
    setIsLoading(true);
    try {
      const res = await getMemberships();

      const tempRes = res.data;

      setMemberships(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (tempRes ?? []).map((voucher: any) => ({
          ...voucher,
          onUpdate: () => handleUpdate(voucher.id),
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
    handleGetMemberships();
  };

  return (
    <>
      <Row className="mx-2 my-2">
        <Col>
          <h4 className="cus-text-primary">
            <strong>{"Danh sách thành viên"}</strong> <br />
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
                title: <span>{"Danh sách thành viên"}</span>,
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
                <strong>{"Danh sách thành viên"}</strong> <br />
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
            <Col></Col>
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
            columns={membershipsColumn()}
            dataSource={
              Array.isArray(memberships) && memberships.length > 0
                ? memberships.map((membership) => ({
                    ...membership,
                    onUpdate: () => handleUpdate(membership.id),
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
          <UpdateMembership
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
