import { Link, useNavigate } from "react-router-dom";
import styles from "../Auth.module.scss";
import classNames from "classnames/bind";
import { useForgotPasswordMutation } from "@/services/auth";
import { Form, Input, Row, Col, Modal } from "antd";
import { configRoutes } from "@/constants/route";
import { useBreakpoint } from "@/hooks/UseBreakPoint";
import { IoIosArrowBack } from "react-icons/io";
import logo from "@/assets/img/Logo/mainLogo.png";
import FancyButton from "@/components/FancyButton";
import { useState } from "react";
import { handleError } from "@/utils/format";

const cx = classNames.bind(styles);

interface ForgotPasswordFormValues {
  email: string;
}

const ForgotPasswordPage = () => {
  const [form] = Form.useForm<ForgotPasswordFormValues>();
  const navigate = useNavigate();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmitEmail = async (values: ForgotPasswordFormValues) => {
    try {
      await forgotPassword({
        email: values.email.trim(),
      }).unwrap();

      setIsModalOpen(true);
    } catch (err) {
      handleError(err, "Gửi yêu cầu khôi phục mật khẩu thất bại");
    }
  };

  const { up } = useBreakpoint();

  return (
    <>
      <Row className="h-100">
        {up("xl") && (
          <Col xl={12} className="p-0">
            <div className={cx("auth-banner")}>
              <div className={cx("logo-container")}>
                <img src={logo} alt="Background" />
              </div>
            </div>
          </Col>
        )}

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
                <h2>{"Yêu cầu đặt lại mật khẩu"}</h2>

                <div>
                  <p className="text-gray-500">
                    Vui lòng điền email để tiếp tục.
                  </p>
                </div>

                <div className="mt-4">
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmitEmail}
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

                    <FancyButton
                      icon={<></>}
                      label="Gửi"
                      variant="primary"
                      size="middle"
                      loading={isLoading}
                      className="w-100"
                      htmlType="submit"
                    />
                  </Form>
                </div>

                <div className="text-start mt-4">
                  <Link
                    to="/login"
                    className="fw-bold cus-text-primary text-decoration-none"
                  >
                    Quay lại đăng nhập
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Col>
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

      <Modal
        open={isModalOpen}
        centered
        footer={null}
        closable={false}
        bodyStyle={{
          textAlign: "center",
          padding: "32px 24px",
          borderRadius: "16px",
        }}
        className={cx("custom-modal")}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              background: "#E6F4EA",
              color: "#16a34a",
              borderRadius: "50%",
              width: 64,
              height: 64,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: 32,
            }}
          >
            ✓
          </div>

          <h3 style={{ marginTop: 12, fontWeight: 600, fontSize: 20 }}>
            Đã gửi yêu cầu thành công
          </h3>

          <p style={{ color: "#667085", lineHeight: 1.6 }}>
            Chúng tôi đã gửi liên kết đặt lại mật khẩu đến email của bạn.
            <br /> Vui lòng kiểm tra hộp thư (kể cả thư rác).
          </p>

          <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
            <button
              onClick={() => setIsModalOpen(false)}
              style={{
                padding: "8px 20px",
                border: "1px solid #D0D5DD",
                borderRadius: 8,
                background: "white",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Đóng
            </button>
            <button
              onClick={() => {
                setIsModalOpen(false);
                navigate(configRoutes.login);
              }}
              style={{
                padding: "8px 20px",
                border: "none",
                borderRadius: 8,
                background: "#16a34a",
                color: "white",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Đăng nhập ngay
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ForgotPasswordPage;
