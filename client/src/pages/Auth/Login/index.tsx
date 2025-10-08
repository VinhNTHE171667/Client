import { Link, useNavigate } from "react-router-dom";
import styles from "../Auth.module.scss";
import classNames from "classnames/bind";
import { useLoginMutation } from "@/services/auth";
import { Form, Input, Button } from "antd";
import { useAuthStore } from "@/hooks/UseAuth";
import { RoleEnum, type RoleEnumType } from "@/common/types/auth";
import { configRoutes } from "@/constants/route";

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
          spaId?: string;
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
          spaId: res.data.spaId || null,
        });

        console.log("Login successful:", res);

        if (res.data.role === RoleEnum.Admin) {
          navigate(configRoutes.adminDashboard, { replace: true });
        } else if (res.data.role === RoleEnum.Customer) {
          navigate(configRoutes.home);
        } else {
          navigate("/");
        }
      } else if (res.error) {
        const msg = res.error.data?.message?.join(", ") || "Đăng nhập thất bại";
        console.error(msg);
      }
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  return (
    <div className={cx("auth-wrapper")}>
      <div className={cx("auth-card-login")}>
        <h2 className="text-center mb-4">Đăng nhập</h2>

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
            // rules={[{ required: true, type: "email" }]}
          >
            <Input placeholder="Nhập email của bạn" size="large" />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
          >
            <Input.Password placeholder="Nhập mật khẩu" size="large" />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={isLoading}
            className="rounded-pill"
          >
            Đăng nhập
          </Button>
        </Form>

        <div className="text-center mt-4">
          <span>Bạn chưa có tài khoản? </span>
          <Link to="/register" className="fw-bold text-primary">
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
