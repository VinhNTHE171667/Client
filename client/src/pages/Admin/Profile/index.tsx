import { useEffect, useState } from "react";
import { Card, Tabs, Upload, Button, Form, Input, message, Avatar } from "antd";
import {
  UploadOutlined,
  SaveOutlined,
  UserOutlined,
  LockOutlined,
} from "@ant-design/icons";
import styles from "./Profile.module.scss";
import {
  useChangePasswordAdminMutation,
  useGetSpaProfileMutation,
  useUpdateSpaProfileMutation,
} from "@/services/auth";
import type { UploadChangeParam, UploadFile } from "antd/es/upload";
import { showError, showSuccess } from "@/libs/toast";
import { useAuthStore } from "@/hooks/UseAuth";

const { TabPane } = Tabs;

interface ProfileProps {
  id: string;
  name: string;
  logo: string;
  address: string;
  phone: string;
  email: string;
}

interface UpdateProfileDto {
  name: string;
  address: string;
  phone: string;
  email: string;
}

const AdminSpaProfile = () => {
  const [loading, setLoading] = useState(false);
  // const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [spa, setSpa] = useState<ProfileProps | null>(null);

  const [getProfile] = useGetSpaProfileMutation();
  // const [updateAvatar] = useUpdateAvatarMutation();
  const [updateProfile] = useUpdateSpaProfileMutation();
  const [updatePassword] = useChangePasswordAdminMutation();
  // const { auth, setCredentials } = useAuthStore();
  const { auth } = useAuthStore();
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const handleGetProfile = async () => {
    try {
      const response: ProfileProps = await getProfile().unwrap();
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
        setSpa(profileData);
        form.setFieldsValue({
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          address: profileData.address,
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
        // const customerId = auth.accountId;
        // const res = await updateAvatar({
        //   id: customerId as string,
        //   file: originFile,
        // }).unwrap();
        // setAvatarUrl(res.avatar);
        // if (res) {
        //   setCredentials({
        //     ...auth,
        //     avatar: res.avatar,
        //   });
        //   showSuccess("Cập nhật ảnh đại diện thành công!");
        // }
      } catch {
        showError("Cập nhật ảnh đại diện thất bại!");
      }
    }

    if (info.file.status === "error") {
      setLoading(false);
      message.error("Tải ảnh thất bại!");
    }
  };

  const handleSaveProfile = async (values: UpdateProfileDto) => {
    try {
      await updateProfile({
        data: {
          name: values.name,
          address: values.address,
          phone: values.phone,
          email: values.email,
        },
      }).unwrap();

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

  return (
    <div className={`${styles.profilePage} py-5`}>
      <Card
        className={`${styles.profileCard} shadow`}
        title={<h3 className={styles.cardTitle}>Hồ sơ Spa</h3>}
      >
        <Tabs defaultActiveKey="1" centered animated>
          <TabPane tab="Ảnh đại diện" key="1">
            <div className="text-center py-4">
              <Avatar
                size={140}
                src={spa?.logo}
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
                    disabled={true}
                  >
                    Đổi ảnh
                  </Button>
                </Upload>
              </div>
            </div>
          </TabPane>

          <TabPane tab="Thông tin Spa" key="2">
            <Form layout="vertical" form={form} onFinish={handleSaveProfile}>
              <Form.Item
                label="Tên Spa"
                name="name"
                rules={[{ required: true, message: "Vui lòng nhập tên Spa" }]}
              >
                <Input placeholder="Nhập tên Spa" />
              </Form.Item>

              <Form.Item
                label="Email"
                name="email"
                rules={[{ type: "email", message: "Email không hợp lệ" }]}
              >
                <Input disabled />
              </Form.Item>

              <Form.Item label="Số điện thoại" name="phone">
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>

              <Form.Item label="Địa chỉ" name="address">
                <Input placeholder="Nhập địa chỉ" />
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

export default AdminSpaProfile;
