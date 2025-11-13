import { useEffect, useState } from "react";
import {
  Card,
  Tabs,
  Upload,
  Button,
  Form,
  Input,
  message,
  Avatar,
  Select,
  InputNumber,
} from "antd";
import {
  UploadOutlined,
  SaveOutlined,
  UserOutlined,
  LockOutlined,
} from "@ant-design/icons";
import styles from "./Profile.module.scss";
import {
  useChangePasswordDoctorMutation,
  useGetDoctorProfileMutation,
  useUpdateAvatarDoctorMutation,
  useUpdateDoctorProfileMutation,
} from "@/services/auth";
import { useAuthStore } from "@/hooks/UseAuth";
import type { UploadChangeParam, UploadFile } from "antd/es/upload";
import { showError, showSuccess } from "@/libs/toast";

const { TabPane } = Tabs;
const { Option } = Select;

interface ProfileProps {
  id: string;
  full_name: string;
  avatar: string;
  email: string;
  phone: string;
  gender: string;
  biography: string;
  specialization: string;
  experience_years: number;
}

interface UpdateProfileDto {
  full_name: string;
  phone: string;
  email: string;
  gender: string;
  biography: string;
  specialization: string;
  experience_years: number;
}

const DoctorProfile = () => {
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [doctor, setDoctor] = useState<ProfileProps | null>(null);

  const [getProfile] = useGetDoctorProfileMutation();
  const [updateAvatar] = useUpdateAvatarDoctorMutation();
  const [updateProfile] = useUpdateDoctorProfileMutation();
  const [updatePassword] = useChangePasswordDoctorMutation();
  const { auth, setCredentials } = useAuthStore();
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const handleGetProfile = async () => {
    try {
      const doctorId = auth.accountId || "";
      const response: ProfileProps = await getProfile(doctorId).unwrap();
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
        setDoctor(profileData);
        form.setFieldsValue({
          full_name: profileData.full_name,
          email: profileData.email,
          phone: profileData.phone,
          gender: profileData.gender,
          biography: profileData.biography,
          specialization: profileData.specialization,
          experience_years: profileData.experience_years,
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

  const handleSaveProfile = async (values: UpdateProfileDto) => {
    try {
      await updateProfile({
        data: {
          full_name: values.full_name,
          gender: values.gender,
          phone: values.phone,
          email: values.email,
          biography: values.biography,
          specialization: values.specialization,
          experience_years: values.experience_years,
        },
        id: auth.accountId as string,
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
                src={avatarUrl || doctor?.avatar}
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

          <TabPane tab="Thông tin nhân viên" key="2">
            <Form layout="vertical" form={form} onFinish={handleSaveProfile}>
              <Form.Item
                label="Tên nhân viên"
                name="full_name"
                rules={[
                  { required: true, message: "Vui lòng nhập tên nhân viên" },
                ]}
              >
                <Input placeholder="Nhập tên nhân viên" />
              </Form.Item>

              <Form.Item label="Giới tính" name="gender">
                <Select placeholder="Chọn giới tính">
                  <Option value="male">Nam</Option>
                  <Option value="female">Nữ</Option>
                  <Option value="other">Khác</Option>
                </Select>
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

              <Form.Item label="Tiểu sử" name="biography">
                <Input.TextArea
                  rows={4}
                  placeholder="Giới thiệu ngắn về bản thân, kinh nghiệm, thành tích..."
                />
              </Form.Item>

              <Form.Item label="Chuyên môn" name="specialization">
                <Input placeholder="Ví dụ: Da liễu, Vật lý trị liệu, Thẩm mỹ..." />
              </Form.Item>

              <Form.Item
                label="Số năm kinh nghiệm"
                name="experience_years"
                rules={[
                  { type: "number", min: 0, message: "Phải là số không âm" },
                ]}
              >
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  placeholder="Nhập số năm"
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

export default DoctorProfile;
