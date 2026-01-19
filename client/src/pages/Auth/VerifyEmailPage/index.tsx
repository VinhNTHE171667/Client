import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import styles from "../Auth.module.scss";
import classNames from "classnames/bind";
import { useVerifyEmailMutation } from "@/services/auth";
import { Row, Col, Typography, Spin, Alert, Button, message } from "antd";
import { useBreakpoint } from "@/hooks/UseBreakPoint";
import { IoIosArrowBack } from "react-icons/io";
import { configRoutes } from "@/constants/route";
import logo from "@/assets/img/Logo/mainLogo.png";
import { showError } from "@/libs/toast";

const cx = classNames.bind(styles);

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifyEmail, { isLoading, isSuccess, data: verifyData, error: verifyError }] = useVerifyEmailMutation();
  const token = searchParams.get("token");
  const { up } = useBreakpoint();

  useEffect(() => {
    if (token) {
      verifyEmail({ token })
        .unwrap()
        .then((response) => {
          message.success(response.message || "Xác minh email thành công!");
          setTimeout(() => {
            navigate(configRoutes.login, { replace: true });
          }, 3000);
        })
        .catch((err) => {
          const errorMessage = err?.data?.message || "Xác minh email thất bại. Token không hợp lệ hoặc đã hết hạn.";
          showError("Lỗi xác minh email", errorMessage);
        });
    } else {
      showError("Lỗi", "Không tìm thấy token xác minh. Vui lòng kiểm tra liên kết email.");
      navigate(configRoutes.login, { replace: true });
    }
  }, [token, verifyEmail, navigate]);

  const handleBackToHome = () => {
    navigate(configRoutes.home, { replace: true });
  };

  const handleBackToLogin = () => {
    navigate(configRoutes.login, { replace: true });
  };

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
                onClick={handleBackToHome}
              >
                <IoIosArrowBack /> <p className="m-0">{"Trở về trang chủ"}</p>
              </div>
            </div>

            <div className="flex-grow-1 d-flex justify-content-center align-items-center">
              <div className={cx("auth-header", "max-w-md", "w-100")}>
                <h2>{isLoading ? "Đang xác minh..." : "Xác minh Email"}</h2>

                <div>
                  <p className="text-gray-500">
                    {isLoading 
                      ? "Vui lòng chờ trong giây lát..." 
                      : "Chúng tôi đang xác minh liên kết từ email của bạn để kích hoạt tài khoản."
                    }
                  </p>
                </div>

                {isLoading && (
                  <div className="py-4">
                    <Spin size="large" />
                  </div>
                )}

                {isSuccess && verifyData && (
                  <div className="py-3">
                    <Alert
                      message="Thành công"
                      description={verifyData.message || "Email của bạn đã được xác minh thành công. Bạn có thể đăng nhập ngay bây giờ."}
                      type="success"
                      showIcon
                    />
                  </div>
                )}

                {verifyError && !isLoading && (
                  <div className="py-3">
                    <Alert
                      message="Lỗi"
                      description={"Token không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu gửi lại email xác minh."}
                      type="error"
                    />
                  </div>
                )}

                <div className="py-3">
                  <Button 
                    type="primary" 
                    onClick={handleBackToLogin}
                    disabled={isLoading}
                    className="w-100"
                    size="large"
                  >
                    {isSuccess ? "Đi đến Đăng nhập" : "Quay lại Đăng nhập"}
                  </Button>
                </div>

                {!isLoading && !isSuccess && (
                  <div className="text-start mt-4">
                    <span>Nếu bạn gặp vấn đề, </span>
                    <Typography.Text 
                      className="fw-bold cus-text-primary text-decoration-none cursor-pointer"
                      onClick={() => navigate(configRoutes.register)}
                    >
                      quay lại đăng ký
                    </Typography.Text>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Col>

        {up("xl") && (
          <Col xl={12} className="p-0">
            <div className={cx("auth-banner")}>
              <div className={cx("logo-container")}>
                <img src={logo} alt="Spa Management System" />
              </div>
            </div>
          </Col>
        )}
      </Row>
    </>
  );
};

export default VerifyEmailPage;