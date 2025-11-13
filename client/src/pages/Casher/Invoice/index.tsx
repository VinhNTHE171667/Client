import {
  Card,
  Col,
  DatePicker,
  Input,
  Row,
  Space,
  Table,
  Divider,
  Select,
} from "antd";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { showError } from "@/libs/toast";
import { InvoiceColumn } from "./_components/columnTypes";
import {
  useGetInvoiceMutation,
  type InvoiceProps,
} from "@/services/appointment";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Button } from "antd";

const { RangePicker } = DatePicker;

export default function InvoiceCasher() {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<InvoiceProps[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceProps[]>([]);

  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null
  );

  const [getInvoice] = useGetInvoiceMutation();

  const [statusFilter, setStatusFilter] = useState<string[] | null>(null);

  const handleGetInvoices = async () => {
    setIsLoading(true);
    try {
      const res = await getInvoice();
      const tempRes = res.data ?? [];
      setInvoices(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tempRes.map((invoice: any) => ({
          ...invoice,
        }))
      );
    } catch (error) {
      showError("Error", error instanceof Error ? error.message : "Unknown");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleGetInvoices();
  }, []);

  const filteredInvoices = invoices.filter((a) => {
    const matchSearch =
      search === "" ||
      a.customer.full_name.toLowerCase().includes(search.toLowerCase());

    const matchStatus = !statusFilter || statusFilter.includes(a.invoice_type);

    const matchDate =
      !dateRange ||
      dayjs(a.appointment.appointment_date).isSame(dateRange[0], "day") ||
      dayjs(a.appointment.appointment_date).isSame(dateRange[1], "day") ||
      (dayjs(a.appointment.appointment_date).isAfter(dateRange[0], "day") &&
        dayjs(a.appointment.appointment_date).isBefore(dateRange[1], "day"));

    return matchSearch && matchDate && matchStatus;
  });

  //   const handleEvent = () => {
  //     handleGetInvoices();
  //   };

  const rowSelection = {
    selectedRowKeys,
    onChange: (
      newSelectedRowKeys: React.Key[],
      selectedRows: InvoiceProps[]
    ) => {
      setSelectedRowKeys(newSelectedRowKeys);
      setSelectedInvoices(selectedRows);
    },
  };

  const handleExportExcel = () => {
    if (selectedInvoices.length === 0) {
      showError("Vui lòng chọn ít nhất 1 hoá đơn để xuất Excel");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[] = [];

    selectedInvoices.forEach((invoice) => {
      rows.push({
        "Mã Hóa Đơn": invoice.id,
        "Khách Hàng": invoice.customer?.full_name || "",
        Email: invoice.customer?.email || "",
        "Ngày Hẹn": dayjs(invoice.appointment?.appointment_date).format(
          "DD/MM/YYYY"
        ),
        "Loại Hóa Đơn": invoice.invoice_type || "",
        // "Trạng Thái": invoice.status || "",
        "Tổng Tiền": invoice.total || 0,
        "Giảm Giá": invoice.discount || 0,
        "Thành Tiền": invoice.finalAmount || 0,
        "Ghi chú": "",
      });

      if (invoice.details && invoice.details.length > 0) {
        invoice.details.forEach((d) => {
          rows.push({
            "Mã Hóa Đơn": "",
            "Khách Hàng": "",
            Email: "",
            "Ngày Hẹn": "",
            "Loại Hóa Đơn": "",
            // "Trạng Thái": "",
            "Tổng Tiền": "",
            "Giảm Giá": "",
            "Thành Tiền": "",
            "Ghi chú": `→ ${d.service?.name || ""} - SL: ${d.quantity} - Giá: ${
              d.price
            }`,
          });
        });
      }

      rows.push({});
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoices");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, `Invoices_${dayjs().format("YYYYMMDD_HHmm")}.xlsx`);
  };

  return (
    <>
      <Row className="mx-2 my-2">
        <Col>
          <h4 className="cus-text-primary">
            <strong>Hoá đơn</strong>
          </h4>
        </Col>
        <Col style={{ marginLeft: "auto" }}></Col>
      </Row>

      <Card className="mt-2">
        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: 16 }}
        >
          <Col>
            <Space>
              <Input.Search
                placeholder="Tìm theo tên khách hàng..."
                allowClear
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 250 }}
              />
              <RangePicker
                onChange={(val) =>
                  setDateRange(val as [dayjs.Dayjs, dayjs.Dayjs] | null)
                }
                format="DD/MM/YYYY"
              />
            </Space>
          </Col>
          <Col>
            <Space>
              <Select
                allowClear
                placeholder="Chọn trạng thái"
                value={statusFilter ?? undefined}
                onChange={(value) => setStatusFilter(value)}
                style={{ width: 200 }}
                options={[
                  {
                    label: "Đặt cọc",
                    value: "deposited",
                  },
                  {
                    label: "Cuối cùng",
                    value: "final",
                  },
                ]}
              />
              <Divider type="vertical" />

              <Button
                type="primary"
                onClick={handleExportExcel}
                disabled={selectedInvoices.length === 0}
              >
                Xuất Excel ({selectedInvoices.length})
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          loading={isLoading}
          rowKey="id"
          rowSelection={rowSelection}
          columns={InvoiceColumn()}
          dataSource={filteredInvoices}
          scroll={{ x: "max-content" }}
          tableLayout="fixed"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            position: ["bottomRight"],
            showTotal: (total, range) =>
              `Hiển thị ${range[0]}-${range[1]} trong ${total} hoá đơn`,
          }}
        />
      </Card>
    </>
  );
}
