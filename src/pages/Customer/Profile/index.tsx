import { useEffect, useState } from "react";
import {
  Card,
  Tabs,
  Upload,
  Button,
  Form,
  Input,
  DatePicker,
  message,
  Avatar,
  Spin,
  Select,
} from "antd";
import {
  UploadOutlined,
  SaveOutlined,
  UserOutlined,
  LockOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import styles from "./Profile.module.scss";
import {
  useChangePasswordCustomerMutation,
  useGetCustomerProfileMutation,
  useUpdateAvatarCustomerMutation,
  useUpdateCustomerProfileMutation,
  type CustomerProfileProps,
} from "@/services/auth";
import { useAuthStore } from "@/hooks/UseAuth";
import type { UploadChangeParam, UploadFile } from "antd/es/upload";
import { showError, showSuccess } from "@/libs/toast";

const { TabPane } = Tabs;
const { Option } = Select;

const Profile = () => {
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerProfileProps | null>(null);

  const [getProfile] = useGetCustomerProfileMutation();
  const [updateAvatar] = useUpdateAvatarCustomerMutation();
  const [updateProfile] = useUpdateCustomerProfileMutation();
  const [updatePassword] = useChangePasswordCustomerMutation();
  const { auth, setCredentials } = useAuthStore();
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const handleGetProfile = async () => {
    try {
      const customerId = auth.accountId || "";
      const response: CustomerProfileProps = await getProfile(
        customerId
      ).unwrap();
      return response;
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      message.error("Không thể tải thông tin hồ sơ!");
      return null;
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const profileData = await handleGetProfile();
      if (profileData) {
        setCustomer(profileData);
        form.setFieldsValue({
          full_name: profileData.full_name,
          email: profileData.email,
          phone: profileData.phone,
          address: profileData.address,
          gender: profileData.gender,
          birth_date: dayjs(profileData.birth_date),
        });
      }
    };
    fetchProfile();
  }, []);

  const handleAvatarChange = async (info: UploadChangeParam<UploadFile>) => {
    if (info.file.status === "uploading") {
      setLoading(true);
      return;
    }

    if (info.file.status === "done") {
      setLoading(false);
      const originFile = info.file.originFileObj as File;
      if (!originFile) return;

      try {
        const customerId = auth.accountId;
        const res = await updateAvatar({
          id: customerId as string,
          file: originFile,
        }).unwrap();

        setAvatarUrl(res.avatar);

        if (res) {
          setCredentials({
            ...auth,
            avatar: res.avatar,
          });
          showSuccess("Cập nhật ảnh đại diện thành công!");
        }
      } catch {
        showError("Cập nhật ảnh đại diện thất bại!");
      }
    }

    if (info.file.status === "error") {
      setLoading(false);
      message.error("Tải ảnh thất bại!");
    }
  };

  const handleSaveProfile = async (values: CustomerProfileProps) => {
    try {
      const customerId = auth.accountId || "";
      const updatedProfile: Omit<CustomerProfileProps, "avatar"> = {
        birth_date: values.birth_date
          ? dayjs(values.birth_date).format("YYYY-MM-DD")
          : "",
        full_name: values.full_name ? values.full_name.trim() : "",
        email: values.email ? values.email.trim() : "",
        phone: values.phone ? values.phone.trim() : "",
        address: values.address ? values.address.trim() : "",
        gender: values.gender ? values.gender : "",
      };

      await updateProfile({
        id: customerId,
        data: updatedProfile,
      }).unwrap();

      setCredentials({
        accountId: auth.accountId ?? "",
        username: auth.username ?? "",
        fullName: updatedProfile.full_name,
        email: updatedProfile.email || "",
        phone: updatedProfile.phone || "",
        address: updatedProfile.address || "",
        image: auth.image || "",
        roles: auth.roles,
        avatar: auth.avatar,
      });

      showSuccess("Cập nhật hồ sơ thành công!");
    } catch (error) {
      console.error("Failed to update profile:", error);
      showError("Lỗi", "Cập nhật hồ sơ thất bại!");
    }
  };

  const handleChangePassword = async (values: {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    try {
      await updatePassword({
        id: auth.accountId as string,
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      }).unwrap();

      showSuccess("Đổi mật khẩu thành công!");

      passwordForm.resetFields();
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      showError("Đổi mật khẩu thất bại!", (error as any).message);
      // console.error(error);
    }
  };

  if (!customer) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "60vh" }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={`${styles.profilePage} py-5`}>
      <Card
        className={`${styles.profileCard} shadow`}
        title={<h3 className={styles.cardTitle}>Hồ sơ khách hàng</h3>}
      >
        <Tabs defaultActiveKey="1" centered animated>
          <TabPane tab="Ảnh đại diện" key="1">
            <div className="text-center py-4">
              <Avatar
                size={140}
                src={avatarUrl || customer.avatar}
                icon={<UserOutlined />}
                className={styles.avatar}
              />
              <div className="mt-3">
                <Upload
                  name="file"
                  showUploadList={false}
                  onChange={handleAvatarChange}
                  customRequest={({ onSuccess }) =>
                    setTimeout(() => onSuccess?.("ok"), 800)
                  }
                >
                  <Button
                    type="primary"
                    icon={<UploadOutlined />}
                    loading={loading}
                    className={styles.uploadBtn}
                  >
                    Đổi ảnh
                  </Button>
                </Upload>
              </div>
            </div>
          </TabPane>

          <TabPane tab="Thông tin cá nhân" key="2">
            <Form layout="vertical" form={form} onFinish={handleSaveProfile}>
              <Form.Item
                label="Họ và tên"
                name="full_name"
                rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
              >
                <Input placeholder="Nhập họ và tên" />
              </Form.Item>

              <Form.Item label="Giới tính" name="gender" rules={[{ required: true, message: "Vui lòng chọn giới tính" }]}>
                <Select placeholder="Chọn giới tính">
                  <Option value="male">Nam</Option>
                  <Option value="female">Nữ</Option>
                  <Option value="other">Khác</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Email"
                name="email"
                rules={[{ required: true, type: "email", message: "Email không hợp lệ" }]}
              >
                <Input disabled />
              </Form.Item>

              <Form.Item label="Số điện thoại" name="phone" rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}>
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>

              <Form.Item label="Địa chỉ" name="address" rules={[{ required: true, message: "Vui lòng nhập địa chỉ" }]}>
                <Input placeholder="Nhập địa chỉ" />
              </Form.Item>

              <Form.Item label="Ngày sinh" name="birth_date" rules={[{ required: true, message: "Vui lòng chọn ngày sinh" }]}>
                <DatePicker
                  style={{ width: "100" }}
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày sinh"
                />
              </Form.Item>

              <div className="text-center mt-4">
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  className={styles.saveBtn}
                >
                  Lưu thay đổi
                </Button>
              </div>
            </Form>
          </TabPane>

          <TabPane tab="Đổi mật khẩu" key="3">
            <Form
              layout="vertical"
              form={passwordForm}
              onFinish={handleChangePassword}
            >
              <Form.Item
                label="Mật khẩu hiện tại"
                name="oldPassword"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập mật khẩu hiện tại",
                  },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Nhập mật khẩu hiện tại"
                />
              </Form.Item>

              <Form.Item
                label="Mật khẩu mới"
                name="newPassword"
                rules={[
                  { required: true, message: "Vui lòng nhập mật khẩu mới" },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Nhập mật khẩu mới"
                />
              </Form.Item>

              <Form.Item
                label="Xác nhận mật khẩu mới"
                name="confirmPassword"
                dependencies={["newPassword"]}
                hasFeedback
                rules={[
                  {
                    required: true,
                    message: "Vui lòng xác nhận mật khẩu mới",
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("newPassword") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error("Mật khẩu xác nhận không khớp")
                      );
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Nhập lại mật khẩu mới"
                />
              </Form.Item>

              <div className="text-center mt-4">
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  className={styles.saveBtn}
                >
                  Cập nhật mật khẩu
                </Button>
              </div>
            </Form>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default Profile;
