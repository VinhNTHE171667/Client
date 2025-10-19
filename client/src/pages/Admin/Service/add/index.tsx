/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Button,
  Col,
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
import { LoadingOutlined, PlusOutlined } from "@ant-design/icons";
import { showError, showSuccess } from "@/libs/toast";
import { extractErrorMessage } from "@/utils/func";
import {
  useCreateServiceMutation,
  useGetCategoriesMutation,
} from "@/services/services";
import type { categoriesModelTable } from "@/pages/Admin/Categories/_components/type";
import FancyButton from "@/components/FancyButton";

interface AddServiceProps {
  isOpen: boolean;
  onClose: () => void;
  onReload: () => void;
}

export default function AddService({
  isOpen,
  onClose,
  onReload,
}: AddServiceProps) {
  const [form] = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const [createService] = useCreateServiceMutation();
  const [getCategories] = useGetCategoriesMutation();
  const [categories, setCategories] = useState<categoriesModelTable[]>([]);

  const handleGetCategories = async () => {
    try {
      const res = await getCategories();
      setCategories(
        (res.data ?? []).map((category: any) => ({
          ...category,
          onUpdate: () => {},
          onRemove: () => {},
        }))
      );
    } catch {
      showError("Không thể tải danh mục");
    }
  };

  useEffect(() => {
    if (isOpen) {
      form.resetFields();
      setFileList([]);
      handleGetCategories();
    }
  }, [isOpen]);

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      showError("Chỉ được upload hình ảnh!");
      return Upload.LIST_IGNORE;
    }
    return false;
  };

  const onFinish = async (values: any) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("price", values.price);
      formData.append("categoryId", values.categoryId);
      formData.append("description", values.description ?? "");
      formData.append("isActive", values.isActive ? "true" : "false");

      fileList.forEach((file) => {
        if (file.originFileObj) {
          formData.append("images", file.originFileObj);
        }
      });

      const res = await createService(formData);

      if (!res.error) {
        showSuccess("Tạo dịch vụ thành công");
        onReload();
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
    <Modal
      open={isOpen}
      width={900}
      onCancel={onClose}
      footer={null}
      closable={false}
    >
      <Spin spinning={isLoading} indicator={<LoadingOutlined spin />}>
        <h3 className="text-center mb-6">Tạo dịch vụ mới</h3>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ isActive: true }}
          style={{ padding: "0 20px" }}
        >
          <Row gutter={[24, 8]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Tên dịch vụ"
                name="name"
                rules={[
                  { required: true, message: "Vui lòng nhập tên dịch vụ" },
                ]}
              >
                <Input placeholder="Nhập tên dịch vụ" />
              </Form.Item>

              <Form.Item
                label="Giá (VNĐ)"
                name="price"
                rules={[
                  { required: true, message: "Vui lòng nhập giá dịch vụ" },
                ]}
              >
                <Input type="number" placeholder="Nhập giá dịch vụ" min={0} />
              </Form.Item>

              <Form.Item
                label="Danh mục"
                name="categoryId"
                rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
              >
                <Select
                  placeholder="Chọn danh mục"
                  options={categories.map((category) => ({
                    label: category.name,
                    value: category.id,
                  }))}
                />
              </Form.Item>

              <Form.Item
                label="Kích hoạt"
                name="isActive"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Mô tả" name="description">
                <Input.TextArea
                  placeholder="Nhập mô tả dịch vụ"
                  autoSize={{ minRows: 5, maxRows: 8 }}
                />
              </Form.Item>

              <Form.Item label="Ảnh dịch vụ">
                <Upload
                  listType="picture-card"
                  fileList={fileList}
                  onChange={({ fileList }) => setFileList(fileList)}
                  beforeUpload={beforeUpload}
                >
                  {fileList.length >= 5 ? null : (
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </Col>
          </Row>

          <Row justify="center" className="mt-6">
            <Space size="large">
              <Button onClick={onClose}>Huỷ</Button>
              <FancyButton
                onClick={() => form.submit()}
                icon={<></>}
                label="Tạo dịch vụ"
                variant="primary"
                size="small"
                loading={isLoading}
                className="w-100"
              />
            </Space>
          </Row>
        </Form>
      </Spin>
    </Modal>
  );
}
