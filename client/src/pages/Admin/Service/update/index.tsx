/* eslint-disable @typescript-eslint/no-unused-vars */
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
  useUpdateServiceMutation,
  useGetServiceByIdQuery,
  useGetCategoriesMutation,
} from "@/services/services";
import { useAuthStore } from "@/hooks/useAuth";
import type { categoriesModelTable } from "@/pages/Admin/Categories/_components/type";

interface UpdateServiceProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  onReload: () => void;
}

export default function UpdateService(props: UpdateServiceProps) {
  const { id, isOpen, onClose, onReload } = props;

  const [form] = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const { auth } = useAuthStore();

  const [updateService] = useUpdateServiceMutation();
  const { data: serviceData, refetch } = useGetServiceByIdQuery(id, {
    skip: !isOpen || !id,
  });

  const [getCategories] = useGetCategoriesMutation();
  const [categories, setCategories] = useState<categoriesModelTable[]>([]);

  const handleGetCategories = async () => {
    try {
      const res = await getCategories();
      const tempRes = res.data;
      setCategories((tempRes ?? []).map((category: any) => ({ ...category })));
    } catch (error) {
      showError("Error", "Không thể tải danh mục.");
    }
  };

  useEffect(() => {
    if (isOpen) {
      // form.resetFields();
      // setFileList([]);
      refetch();
      handleGetCategories();
    }
  }, [isOpen]);

  useEffect(() => {
    if (serviceData) {
      form.setFieldsValue(serviceData);
      if (serviceData.images?.length) {
        setFileList(
          serviceData.images.map((img: { url: string }, index: number) => ({
            uid: String(index),
            name: `Ảnh ${index + 1}`,
            url: img.url,
            status: "done",
          }))
        );
      }
    }
  }, [serviceData]);

  const onFinish = async (values: any) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("price", values.price);
      formData.append("categoryId", values.categoryId);
      formData.append("spaId", auth?.spaId || serviceData?.spaId || "");
      formData.append("isActive", values.isActive ? "true" : "false");
      formData.append("description", values.description ?? "");

      // fileList.forEach((file) => {
      //   if (file.originFileObj) {
      //     formData.append("images", file.originFileObj);
      //   }
      // });

      const oldImageUrls =
        serviceData?.images?.map((img: { url: string }) => img.url) ?? [];

      const currentImageUrls = fileList
        .filter((f) => !f.originFileObj && f.url)
        .map((f) => f.url!);

      const deletedImages = oldImageUrls.filter(
        (url) => !currentImageUrls.includes(url)
      );

      deletedImages.forEach((url) => formData.append("deletedImages", url));

      fileList.forEach((file) => {
        if (file.originFileObj) {
          formData.append("images", file.originFileObj);
        }
      });

      const res = await updateService({ id, data: formData });

      if (!res.error) {
        onReload();
        showSuccess("Cập nhật dịch vụ thành công");
        onClose();
      } else {
        showError("Cập nhật thất bại", extractErrorMessage(res.error));
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
      width={800}
      onCancel={onClose}
      footer={null}
      closable={false}
    >
      <Spin spinning={isLoading}>
        <h3 className="text-center">Cập nhật dịch vụ</h3>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          style={{ margin: "16px" }}
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
              options={categories.map((category) => ({
                label: category.name,
                value: category.id,
              }))}
            />
          </Form.Item>

          <Form.Item label="Ảnh dịch vụ">
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              beforeUpload={() => false}
            >
              {fileList.length >= 5 ? null : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item label="Kích hoạt" name="isActive" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Row justify="center">
            <Space size="large">
              <Button onClick={onClose}>Huỷ</Button>
              <Button type="primary" htmlType="submit">
                Cập nhật dịch vụ
              </Button>
            </Space>
          </Row>
        </Form>
      </Spin>
    </Modal>
  );
}
