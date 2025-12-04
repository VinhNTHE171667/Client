import { Card, Col, Input, Row, Space, Table, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
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
import FancyCounting from "@/components/FancyCounting";
import UpdateVoucher from "./update";
import VoucherCategoriesModal from "./category-voucher/voucher-categories-modal";

export default function Vouchers() {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [createState, setCreateState] = useState<boolean>(false);
  const [updateState, setUpdateState] = useState<boolean>(false);

  const [updateId, setUpdateId] = useState<string>("");
  const [vouchers, setVouchers] = useState<VoucherModelTable[]>([]);

  // New state for categories modal
  const [showCategoriesModal, setShowCategoriesModal] =
    useState<boolean>(false);

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

  const avgVoucherValue = useMemo(() => {
    if (!vouchers || vouchers.length === 0) return 0;
    const sum = vouchers.reduce((sumAcc, v) => {
      const val = Number(v.maxDiscount ?? 0);
      return sumAcc + (isNaN(val) ? 0 : val);
    }, 0);
    return Math.round(sum / vouchers.length);
  }, [vouchers]);

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
                variant="primary"
                label="Thêm voucher"
                size="middle"
                onClick={() => setCreateState(true)}
              />
              <FancyButton
                variant="secondary"
                label="Danh mục voucher"
                size="middle"
                onClick={() => setShowCategoriesModal(true)}
              />
              <AddVoucher
                isOpen={createState}
                onClose={() => setCreateState(false)}
                onReload={handleEvent}
              />
            </Space>
          </Col>
        </Row>

        <Row className="stats-card">
          <Col className="metric">
            <p className="metric-label">{"Tổng số voucher"}</p>
            <FancyCounting
              className="metric-value"
              from={0}
              to={vouchers.length}
              duration={4}
            />
          </Col>
          <Col className="metric">
            <p className="metric-label">{"Số voucher đang được sử dụng"}</p>
            <p className="metric-value">
              <FancyCounting
                from={0}
                to={vouchers.reduce((sum, v) => {
                  const now = new Date();
                  if (v.validFrom && v.validTo) {
                    const startDate = new Date(v.validFrom);
                    const endDate = new Date(v.validTo);
                    if (now >= startDate && now <= endDate) {
                      return sum + 1;
                    }
                  }
                  return sum;
                }, 0)}
                duration={4}
              />
            </p>
          </Col>
          <Col className="metric">
            <p className="metric-label">{"Trung bình giá trị của voucher"}</p>
            <p className="metric-value">
              <FancyCounting from={0} to={avgVoucherValue} duration={4} />
            </p>
          </Col>
        </Row>
      </Card>

      <Card className="mt-2">
        <div>
          <Row justify={"space-between"} style={{ marginBottom: 16 }}>
            <Col>
              <h4>
                <strong>{"Danh sách voucher"}</strong> <br />
              </h4>
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
              </Space>
            </Col>
          </Row>
          <Table
            loading={isLoading}
            rowKey="id"
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
          <UpdateVoucher
            id={updateId}
            isOpen={updateState}
            onClose={() => setUpdateState(false)}
            onReload={handleEvent}
          />
        </div>
      </Card>

      <VoucherCategoriesModal
        isOpen={showCategoriesModal}
        onClose={() => setShowCategoriesModal(false)}
        onReload={handleEvent} 
      />
    </>
  );
}
