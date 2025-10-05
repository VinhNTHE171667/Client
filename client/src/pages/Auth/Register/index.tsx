/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link, useNavigate } from "react-router-dom";
import styles from "../Auth.module.scss";
import classNames from "classnames/bind";
import { Form, DatePicker, Select, notification } from "antd";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { useState } from "react";
import dayjs from "dayjs";
import { http } from "@/utils/config";
import { configRoutes } from "@/constants/route";

const cx = classNames.bind(styles);

const RegisterPage = () => {
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (values.birth_date) {
        values.birth_date = dayjs(values.birth_date).format("YYYY-MM-DD");
      }

      if (errors) {
        setErrors({});
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
        // setIsLoading(false);

        api.success({
          message: "Đăng ký thành công",
          description: "Bạn đã đăng ký tài khoản khách hàng thành công.",
        });

        setTimeout(() => {
          navigate(configRoutes.login);
        }, 1000);
      } else {
        // setIsLoading(false);
        // setError(res.data.message || "Đăng ký không thành công");
        api.error({
          message: "Đăng ký không thành công",
          description: res.data.message || "Vui lòng thử lại sau.",
        });
      }

      // console.log(" Values:", values);
    } catch (err: any) {
      const errorObj: { [key: string]: string } = {};
      err.errorFields.forEach((e: any) => {
        errorObj[e.name[0]] = e.errors[0];
      });
      setErrors(errorObj);
    }
  };

  return (
    <div className={cx("auth-wrapper")}>
      {contextHolder}

      <div className={cx("auth-card-register")}>
        <h2 className="text-center mb-4">Đăng ký</h2>

        <Form
          form={form}
          initialValues={{ gender: "male" }}
          validateMessages={{
            required: "Không được để trống",
            types: { email: "Email không hợp lệ!" },
          }}
          component={false}
        >
          <div className="mb-3">
            <label className="form-label" htmlFor="full_name">
              Họ và tên
            </label>
            <Form.Item
              name="full_name"
              rules={[{ required: true, message: "Vui lòng nhập họ và tên!" }]}
              noStyle
            >
              <input
                id="full_name"
                type="text"
                className="form-control py-2"
                placeholder="Nhập họ và tên"
              />
            </Form.Item>
            {errors.full_name && (
              <div className="text-danger small">{errors.full_name}</div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="gender">
              Giới tính
            </label>
            <Form.Item
              name="gender"
              rules={[{ required: true, message: "Vui lòng chọn giới tính!" }]}
              noStyle
            >
              <Select
                id="gender"
                className="w-100 rounded-pill"
                options={[
                  { value: "male", label: "Nam" },
                  { value: "female", label: "Nữ" },
                  { value: "other", label: "Khác" },
                ]}
              />
            </Form.Item>
            {errors.gender && (
              <div className="text-danger small">{errors.gender}</div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="birth_date">
              Ngày sinh
            </label>
            <Form.Item name="birth_date" noStyle>
              <DatePicker
                id="birth_date"
                className="form-control w-100 py-2"
                format="DD/MM/YYYY"
                placeholder="Chọn ngày sinh"
              />
            </Form.Item>
            {errors.birth_date && (
              <div className="text-danger small">{errors.birth_date}</div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="phone">
              Số điện thoại
            </label>
            <Form.Item
              name="phone"
              rules={[
                { required: true, message: "Vui lòng nhập số điện thoại!" },
              ]}
              noStyle
            >
              <input
                id="phone"
                type="text"
                className="form-control py-2"
                placeholder="Nhập số điện thoại"
              />
            </Form.Item>
            {errors.phone && (
              <div className="text-danger small">{errors.phone}</div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <Form.Item
              name="email"
              rules={[{ type: "email", message: "Email không hợp lệ!" }]}
              noStyle
            >
              <input
                id="email"
                type="email"
                className="form-control py-2"
                placeholder="Nhập email"
              />
            </Form.Item>
            {errors.email && (
              <div className="text-danger small">{errors.email}</div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="password">
              Mật khẩu
            </label>
            <div className="position-relative">
              <Form.Item
                name="password"
                rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
                noStyle
              >
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="form-control py-2"
                  placeholder="Nhập mật khẩu"
                />
              </Form.Item>
              <span
                className="position-absolute top-50 end-0 translate-middle-y me-3"
                style={{ cursor: "pointer" }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeTwoTone /> : <EyeInvisibleOutlined />}
              </span>
            </div>
            {errors.password && (
              <div className="text-danger small">{errors.password}</div>
            )}
          </div>

          <div className="mb-3 ">
            <label className="form-label" htmlFor="confirmPassword">
              Xác nhận mật khẩu
            </label>
            <div className="position-relative">
              <Form.Item
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
                noStyle
              >
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  className="form-control py-2"
                  placeholder="Nhập lại mật khẩu"
                />
              </Form.Item>
              <span
                className="position-absolute top-50 end-0 translate-middle-y me-3"
                style={{ cursor: "pointer" }}
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? <EyeTwoTone /> : <EyeInvisibleOutlined />}
              </span>
            </div>
            {errors.confirmPassword && (
              <div className="text-danger small">{errors.confirmPassword}</div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="address">
              Địa chỉ
            </label>
            <Form.Item name="address" noStyle>
              <input
                id="address"
                type="text"
                className="form-control py-2"
                placeholder="Nhập địa chỉ"
              />
            </Form.Item>
            {errors.address && (
              <div className="text-danger small">{errors.address}</div>
            )}
          </div>

          {/* <div className="mb-3">
            <label className="form-label" htmlFor="referral_source">
              Nguồn giới thiệu
            </label>
            <Form.Item name="referral_source" noStyle>
              <input
                id="referral_source"
                type="text"
                className="form-control py-2"
                placeholder="Nhập nguồn giới thiệu"
              />
            </Form.Item>
            {errors.referral_source && (
              <div className="text-danger small">{errors.referral_source}</div>
            )}
          </div> */}

          <button
            type="button"
            className="btn cus-btn-primary w-100 py-2 mt-3"
            onClick={handleSubmit}
          >
            Đăng ký ngay
          </button>
        </Form>

        <div className="text-center mt-4">
          <span>Bạn đã có tài khoản? </span>
          <Link to="/login" className="fw-bold text-primary">
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
