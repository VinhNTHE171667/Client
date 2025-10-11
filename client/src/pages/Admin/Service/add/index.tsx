/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Button,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Upload,
  type UploadFile,
} from "antd";
import { useForm } from "antd/es/form/Form";
import { useEffect, useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import { showError, showSuccess } from "@/libs/toast";
import { extractErrorMessage } from "@/utils/func";
import {
  useCreateServiceMutation,
  useGetCategoriesMutation,
} from "@/services/services";
import type { categoriesModelTable } from "@/pages/Admin/Categories/_components/type";

interface SpaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReload: () => void;
}

export default function AddService(props: SpaModalProps) {
  const { isOpen, onClose, onReload } = props;

  const [form] = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [createService] = useCreateServiceMutation();

  const [getCategories] = useGetCategoriesMutation();
  const [categories, setCategpries] = useState<categoriesModelTable[]>([]);

  const handleGetCategories = async () => {
    setIsLoading(true);
    try {
      const res = await getCategories();

      const tempRes = res.data;

      setCategpries(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (tempRes ?? []).map((category: any) => ({
          ...category,
        }))
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        showError("Error", error.message);
      } else {
        showError("Error", "An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      form.resetFields();
      setFileList([]);
      handleGetCategories();
    }
  }, [isOpen]);

  const onFinish = async (values: any) => {
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("price", values.price);
      formData.append("categoryId", values.categoryId);
      formData.append("isActive", values.isActive ? "true" : "false");

      fileList.forEach((file) => {
        if (file.originFileObj) {
          formData.append("images", file.originFileObj);
        }
      });

      const res = await createService(formData);

      if (!res.error) {
        onReload();
        showSuccess("Tạo dịch vụ thành công");
        onClose();
      } else {
        showError("Tạo thất bại", extractErrorMessage(res.error));
      }
    } catch {
      showError("Đã xảy ra lỗi", "Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Modal
        open={isOpen}
        width={800}
        onCancel={onClose}
        footer={null}
        closable={false}
      >
        <Spin spinning={isLoading}>
          <h3 className="text-center">Tạo dịch vụ mới</h3>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            style={{ margin: "16px" }}
            initialValues={{ isActive: true }}
          >
            <Form.Item
              label="Tên dịch vụ"
              name="name"
              rules={[{ required: true, message: "Vui lòng nhập tên dịch vụ" }]}
            >
              <Input placeholder="Tên dịch vụ" />
            </Form.Item>

            <Form.Item
              label="Giá"
              name="price"
              rules={[{ required: true, message: "Vui lòng nhập giá" }]}
            >
              <Input type="number" placeholder="Nhập giá dịch vụ" />
            </Form.Item>

            <Form.Item label="Mô tả" name="description">
              <Input.TextArea rows={4} placeholder="Nhập mô tả dịch vụ" />
            </Form.Item>

            <Form.Item
              label="Danh mục"
              name="categoryId"
              rules={[{ required: true, message: "Chọn danh mục" }]}
            >
              <Select
                placeholder="Chọn danh mục"
                options={categories?.map((category) => {
                  return {
                    label: category.name,
                    value: category.id,
                  };
                })}
              />
            </Form.Item>

            <Form.Item label="Ảnh dịch vụ">
              <Upload
                listType="picture-card"
                fileList={fileList}
                onChange={({ fileList }) => setFileList(fileList)}
                beforeUpload={() => false} // 👈
              >
                {fileList.length >= 5 ? null : (
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                )}
              </Upload>
            </Form.Item>

            <Form.Item
              label="Kích hoạt"
              name="isActive"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Row justify="center">
              <Space size="large">
                <Button onClick={onClose}>Huỷ</Button>
                <Button type="primary" htmlType="submit">
                  Tạo dịch vụ
                </Button>
              </Space>
            </Row>
          </Form>
        </Spin>
      </Modal>
    </>
  );
}
