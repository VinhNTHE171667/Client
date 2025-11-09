import { Link, useNavigate } from "react-router-dom";
import styles from "../Auth.module.scss";
import classNames from "classnames/bind";
import { useLoginMutation } from "@/services/auth";
import { Form, Input, Row, Col, Typography } from "antd";
import { useAuthStore } from "@/hooks/UseAuth";
import { RoleEnum, type RoleEnumType } from "@/common/types/auth";
import { configRoutes } from "@/constants/route";
import { showError } from "@/libs/toast";
import { useBreakpoint } from "@/hooks/UseBreakPoint";
import { IoIosArrowBack } from "react-icons/io";
import logo from "@/assets/img/Logo/mainLogo.png";
import FancyButton from "@/components/FancyButton";

const cx = classNames.bind(styles);

interface LoginFormValues {
  email: string;
  password: string;
}

const LoginPage = () => {
  const [form] = Form.useForm<LoginFormValues>();
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();
  const { setCredentials } = useAuthStore();

  const handleSubmit = async (values: LoginFormValues) => {
    try {
      const res = (await login({
        email: values.email.trim(),
        password: values.password.trim(),
      })) as {
        data?: {
          id: string;
          username: string;
          fullName?: string;
          name?: string;
          email?: string;
          phone?: string;
          address?: string;
          image?: string;
          role?: string;
          avatar?: string | null;
        };
        error?: { data?: { message?: string[] } };
      };

      if (res.data) {
        setCredentials({
          accountId: res.data.id ?? "",
          username: res.data.username ?? "",
          fullName: res.data.fullName || res.data.name || "",
          email: res.data.email || "",
          phone: res.data.phone || "",
          address: res.data.address || "",
          image: res.data.image || "",
          roles: res.data.role ? (res.data.role as RoleEnumType) : null,
          avatar: res.data.avatar || null,
        });

        if (res.data.role === RoleEnum.Admin) {
          navigate(configRoutes.adminDashboard, { replace: true });
        } else if (res.data.role === RoleEnum.Customer) {
          navigate(configRoutes.home);
        } else if (res.data.role === RoleEnum.Staff) {
          navigate(configRoutes.staffOrders, { replace: true });
        } else if (res.data.role === RoleEnum.Doctor) {
          navigate(configRoutes.doctorOrderManagement, { replace: true });
        } else if (res.data.role === RoleEnum.Casher) {
          navigate(configRoutes.casherOrderManagement, { replace: true });
        } else {
          navigate(configRoutes.home);
        }
      } else if (res.error) {
        const message = res.error.data?.message;
        const msg = Array.isArray(message)
          ? message.join(", ")
          : message || "Đăng nhập thất bại";
        showError("Lỗi khi đăng nhập", msg);
      }
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const { up } = useBreakpoint();

  return (
    <>
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
              "flex-grow-1 d-flex flex-column justify-content-center",
              "text-center"
            )}
          >
            <div className="d-flex justify-content-center">
              <div
                className={cx(
                  "back-btn",
                  "max-w-md",
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

            <div className="flex-grow-1 d-flex justify-content-center align-items-center">
              <div className={cx("auth-header", "max-w-md", "w-100")}>
                <h2>{"Đăng nhập"}</h2>

                <div>
                  <p className="text-gray-500">
                    Chào mừng bạn đến với Spa Management System
                  </p>
                </div>

                {/* <div className="py-3">
                  <button className={cx("btn-google")}>
                    <img
                      src="https://www.svgrepo.com/show/475656/google-color.svg"
                      alt="Google"
                    />
                    <span>Đăng nhập bằng Google</span>
                  </button>
                </div>

                <div className={cx("divider", "my-4", "text-gray-500")}>
                  Hoặc đăng nhập bằng email
                </div> */}

                <div>
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    validateMessages={{
                      required: "Không được để trống",
                      types: { email: "Email không hợp lệ!" },
                    }}
                  >
                    <Form.Item
                      label="Email"
                      name="email"
                      rules={[
                        { required: true, message: "Vui lòng nhập email!" },
                        { type: "email" },
                      ]}
                    >
                      <Input placeholder="Nhập email của bạn" size="large" />
                    </Form.Item>

                    <Form.Item
                      label="Mật khẩu"
                      name="password"
                      rules={[
                        { required: true, message: "Vui lòng nhập mật khẩu!" },
                      ]}
                    >
                      <Input.Password
                        placeholder="Nhập mật khẩu"
                        size="large"
                      />
                    </Form.Item>
                    <div
                      style={{
                        marginTop: 10,
                        textAlign: "right",
                      }}
                    >
                      <Typography.Text>
                        <Link
                          to={configRoutes.forgotPassword}
                          className="fw-bold cus-text-primary text-decoration-none"
                        >
                          Quên mật khẩu?
                        </Link>
                      </Typography.Text>
                    </div>

                    <FancyButton
                      icon={<></>}
                      label="Đăng nhập"
                      variant="primary"
                      size="middle"
                      loading={isLoading}
                      className="w-100"
                      htmlType="submit"
                    />

                    <div className="text-start mt-4">
                      <span>Bạn chưa có tài khoản? </span>
                      <Link
                        to="/register"
                        className="fw-bold cus-text-primary text-decoration-none"
                      >
                        Đăng ký ngay
                      </Link>
                    </div>
                  </Form>
                </div>
              </div>
            </div>
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

      {/* <div className={cx("auth-wrapper")}>
        <div className={cx("auth-card-login")}>
          <h2 className="text-center mb-4">Đăng nhập</h2>

          

          <div className="text-center mt-4">
            <span>Bạn chưa có tài khoản? </span>
            <Link to="/register" className="fw-bold text-primary">
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div> */}
    </>
  );
};

export default LoginPage;
