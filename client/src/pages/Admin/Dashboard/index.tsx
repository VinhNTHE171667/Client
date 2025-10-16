/* eslint-disable @typescript-eslint/no-unused-vars */
import { Container, Row, Col, Card, Form } from "react-bootstrap";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { useEffect, useState } from "react";
import { useGetAdminStatisticsMutation } from "@/services/auth";
import CountUp from "react-countup";

type StatictisAdminProps = {
  month: number;
  totalInvoices: number;
  totalAmount: number;
  finalAmount: number;
  totalCustomers: number;
};

const currentYear = new Date().getFullYear();

const AdminDashboardPage = () => {
  const [month, setMonth] = useState<string | number>("all");
  const [year, setYear] = useState(currentYear);
  const [selectedSpaId, setSelectedSpaId] = useState<string | null>(null);

  const [getStatistics] = useGetAdminStatisticsMutation();
  const [data, setData] = useState<StatictisAdminProps[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getStatistics({ year }).unwrap();
        // const formatted = Array.isArray(res)
        //   ? res
        //   : [{ month: `Tháng ${res.month}`, total: res.total }];
        setData(res.data);
      } catch (err) {
        console.error("Lỗi khi load dữ liệu thống kê:", err);
      }
    };

    fetchData();
  }, [year, month]);

  const [chartSeries, setChartSeries] = useState<number[]>([]);
  const [chartMemberShipSeries, setChartMemberShipSeries] = useState<number[]>(
    []
  );
  const [categories, setCategories] = useState<string[]>([]);

  const [pieSeries, setPieSeries] = useState<number[]>([40, 30, 30]);
  const [pieCategories, setPieCategories] = useState<string[]>([
    "Spa",
    "Clinic",
    "Salon",
  ]);

  const [dataTop, setDataTop] = useState<{
    totalInvoices: number;
    totalAmount: number;
    totalCustomers: number;
  }>({
    totalInvoices: 0,
    totalAmount: 0,
    totalCustomers: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getStatistics({
          spaId: selectedSpaId ? selectedSpaId : undefined,
          year: year,
        });

        if (res.data) {
          const raw: unknown = res.data.data ?? res.data;
          const arr: StatictisAdminProps[] = Array.isArray(raw) ? raw : [raw];

          const sorted = [...arr].sort((a, b) => a.month - b.month);

          const chartData = sorted.map((item) => item.totalAmount);
          const chartCategories = sorted.map((item) => `Tháng ${item.month}`);

          setChartSeries(chartData);
          setCategories(chartCategories);

          const memberShipData = res.data.memberShipData || [];
          const memberShipChartData = memberShipData.map(
            (item) => item.finalAmount
          );
          const memberShipChartCategories = memberShipData.map(
            (item) => `Tháng ${item.month}`
          );

          setChartMemberShipSeries(memberShipChartData);
          setCategories(memberShipChartCategories);

          const pieData = res.data.categories || [];
          const pieAmounts = pieData.map(
            (item: { id: string; name: string; serviceCount: number }) =>
              item.serviceCount || 0
          );

          const pieNames = pieData.map(
            (item: { id: string; name: string; serviceCount: number }) =>
              item.name || "Khác"
          );

          setPieSeries(pieAmounts);
          setPieCategories(pieNames);

          // setData(arr);
        }
      } catch (err) {
        console.error("Lỗi khi load dữ liệu thống kê:", err);
      }
    };

    fetchData();
  }, [year, selectedSpaId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getStatistics({
          spaId: selectedSpaId ? selectedSpaId : undefined,
          year: year,
        });

        if (res.data) {
          const raw: unknown = res.data.data ?? res.data;
          const arr: StatictisAdminProps[] = Array.isArray(raw) ? raw : [raw];

          const sorted = [...arr].sort((a, b) => a.month - b.month);

          if (sorted.length > 0) {
            if (month !== "all") {
              const monthIndex = Number(month) - 1;
              if (monthIndex >= 0 && monthIndex < sorted.length) {
                setDataTop({
                  totalInvoices: sorted[monthIndex].totalInvoices,
                  totalAmount: sorted[monthIndex].totalAmount,
                  totalCustomers: sorted[monthIndex].totalCustomers,
                });
              }
            } else {
              setDataTop(
                sorted.reduce(
                  (acc, item) => {
                    acc.totalAmount += item.totalAmount;
                    acc.totalInvoices += item.totalInvoices;
                    acc.totalCustomers += item.totalCustomers;
                    return acc;
                  },
                  {
                    totalAmount: 0,
                    totalInvoices: 0,
                    totalCustomers: 0,
                  }
                )
              );
            }
          }
        }
      } catch (err) {
        console.error("Lỗi khi load dữ liệu thống kê:", err);
      }
    };

    fetchData();
  }, [year, month, selectedSpaId]);

  const chartOptions = {
    title: {
      text: "Doanh thu theo tháng",
    },
    xAxis: {
      categories: categories,
    },
    yAxis: {
      title: {
        text: "Doanh thu (VND)",
      },
    },
    series: [
      {
        name: "Doanh thu",
        data: chartSeries,
      },
    ],
  };

  const chartMemberShipOptions = {
    title: {
      text: "Doanh thu theo tháng (Thẻ thành viên)",
    },
    xAxis: {
      categories: categories,
    },
    yAxis: {
      title: {
        text: "Doanh thu (VND)",
      },
    },
    series: [
      {
        name: "Doanh thu",
        data: chartMemberShipSeries,
      },
    ],
  };

  const pieOptions = {
    chart: {
      type: "pie",
    },
    title: {
      text: "Tỉ lệ dịch vụ",
    },
    series: [
      {
        name: "Tỉ lệ",
        colorByPoint: true,
        data: pieCategories.map((cat, index) => ({
          name: cat,
          y: pieSeries[index],
        })),
      },
    ],
  };

  return (
    <Container fluid className="mt-4">
      <h2 className="mb-4 text-center">Tổng quan hệ thống</h2>

      <Row className="mb-3">
        <Col md={2}>
          <Form.Group controlId="selectMonth">
            <Form.Label>Tháng</Form.Label>
            <Form.Select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  Tháng {i + 1}
                </option>
              ))}

              <option value="all">Tất cả</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={2}>
          <Form.Group controlId="selectYear">
            <Form.Label>Năm</Form.Label>
            <Form.Select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Khách hàng mới</Card.Title>
              <Card.Text className="fs-2">
                <CountUp end={dataTop.totalCustomers} duration={5} />
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Doanh thu</Card.Title>
              <Card.Text className="fs-2">
                <CountUp end={dataTop.totalAmount} suffix="₫" duration={5} />
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Đơn hàng</Card.Title>
              <Card.Text className="fs-2">
                <CountUp end={dataTop.totalInvoices} duration={5} />
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={8} className="mb-4">
          <Card>
            <Card.Body>
              <HighchartsReact highcharts={Highcharts} options={chartOptions} />
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4} className="mb-4">
          <Card>
            <Card.Body>
              <HighchartsReact highcharts={Highcharts} options={pieOptions} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={12} className="mb-4">
          <Card>
            <Card.Body>
              <HighchartsReact
                highcharts={Highcharts}
                options={chartMemberShipOptions}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDashboardPage;
