/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link, useNavigate } from "react-router-dom";
import styles from "../Auth.module.scss";
import classNames from "classnames/bind";
import { Form, DatePicker, Select, Input, Row, Col, Typography } from "antd";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import dayjs from "dayjs";
import { http } from "@/utils/config";
import { configRoutes } from "@/constants/route";
import { IoIosArrowBack } from "react-icons/io";
import logo from "@/assets/img/Logo/mainLogo.png";
import { useBreakpoint } from "@/hooks/UseBreakPoint";
import FancyButton from "@/components/FancyButton";
import { showError } from "@/libs/toast";

const cx = classNames.bind(styles);
const { Title, Text } = Typography;

const RegisterPage = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  // const [showPassword, setShowPassword] = useState(false);
  // const [showConfirm, setShowConfirm] = useState(false);
  const { up } = useBreakpoint();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (values.birth_date) {
        values.birth_date = dayjs(values.birth_date).format("YYYY-MM-DD");
      }

      const res = await http.post("/auth/register-customer", {
        full_name: values.full_name,
        gender: values.gender,
        birth_date: values.birth_date,
        phone: values.phone,
        email: values.email,
        password: values.password,
        address: values.address,
        referral_source: "",
      });

      if (res.status === 201 || res.status === 200) {
        navigate(configRoutes.login);
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Đăng ký thất bại, vui lòng thử lại.";
      showError(
        "Lỗi khi đăng ký",
        Array.isArray(message) ? message.join(", ") : message
      );
    }
  };

  return (
    <Row className="h-100">
      <Col
        xl={12}
        md={24}
        sm={24}
        xs={24}
        className="vh-100 d-flex flex-column"
      >
        <div
          className={cx(
            "auth-left",
            "overflow-auto py-4 px-4 px-md-5"
            // "max-w-md"
          )}
        >
          <div className="d-flex">
            <div
              className={cx(
                "back-btn",
                "d-flex",
                "align-items-center",
                "justify-content-start",
                "gap-2",
                "pt-5"
              )}
              onClick={() => navigate(configRoutes.home)}
            >
              <IoIosArrowBack /> <p className="m-0">{"Trở về trang chủ"}</p>
            </div>
          </div>

          <div className="text-center mb-4">
            <Title level={2} className="m-0">
              Đăng ký
            </Title>
            <Text type="secondary">
              Chào mừng bạn đến với Spa Management System
            </Text>
          </div>

          <div className="py-3">
            <button className={cx("btn-google")}>
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
              />
              <span>Đăng ký bằng Google</span>
            </button>
          </div>

          <div className={cx("divider", "my-4 text-gray-500")}>
            Hoặc đăng ký bằng email
          </div>

          <Form
            form={form}
            layout="vertical"
            initialValues={{ gender: "male" }}
            onFinish={handleSubmit}
          >
            <Form.Item
              label="Họ và tên"
              name="full_name"
              rules={[{ required: true, message: "Vui lòng nhập họ và tên!" }]}
            >
              <Input size="large" placeholder="Nhập họ và tên" />
            </Form.Item>

            <Form.Item
              label="Giới tính"
              name="gender"
              rules={[{ required: true, message: "Vui lòng chọn giới tính!" }]}
            >
              <Select
                size="large"
                options={[
                  { value: "male", label: "Nam" },
                  { value: "female", label: "Nữ" },
                  { value: "other", label: "Khác" },
                ]}
              />
            </Form.Item>

            <Form.Item label="Ngày sinh" name="birth_date">
              <DatePicker
                format="DD/MM/YYYY"
                placeholder="Chọn ngày sinh"
                className="w-100"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="Số điện thoại"
              name="phone"
              rules={[
                { required: true, message: "Vui lòng nhập số điện thoại!" },
              ]}
            >
              <Input size="large" placeholder="Nhập số điện thoại" />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Vui lòng nhập email!" },
                { type: "email", message: "Email không hợp lệ!" },
              ]}
            >
              <Input size="large" placeholder="Nhập email của bạn" />
            </Form.Item>

            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu!" },
                { min: 6, message: "Mật khẩu phải ít nhất 6 ký tự!" },
              ]}
            >
              <Input.Password
                size="large"
                placeholder="Nhập mật khẩu"
                iconRender={(visible) =>
                  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                }
                // type={showPassword ? "text" : "password"}
              />
            </Form.Item>

            <Form.Item
              label="Xác nhận mật khẩu"
              name="confirmPassword"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Vui lòng nhập lại mật khẩu!" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("Mật khẩu nhập lại không khớp!")
                    );
                  },
                }),
              ]}
            >
              <Input.Password
                size="large"
                placeholder="Nhập lại mật khẩu"
                iconRender={(visible) =>
                  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                }
                // type={showConfirm ? "text" : "password"}
              />
            </Form.Item>

            <Form.Item label="Địa chỉ" name="address">
              <Input size="large" placeholder="Nhập địa chỉ của bạn" />
            </Form.Item>

            <FancyButton
              onClick={() => form.submit()}
              icon={<></>}
              label="Đăng ký"
              variant="primary"
              size="middle"
              // loading={isLoading}
              className="w-100"
            ></FancyButton>

            <div className="text-center mt-3">
              <Text>Bạn đã có tài khoản? </Text>
              <Link
                className="fw-bold cus-text-primary text-decoration-none"
                to={configRoutes.login}
              >
                Đăng nhập
              </Link>
            </div>
          </Form>
        </div>
      </Col>

      {up("xl") && (
        <Col xl={12} className="p-0">
          <div className={cx("auth-banner")}>
            <div className={cx("logo-container")}>
              <img src={logo} alt="Background" />
            </div>
          </div>
        </Col>
      )}
    </Row>
  );
};

export default RegisterPage;
