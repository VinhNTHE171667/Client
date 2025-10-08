import { showError, showSuccess } from "@/libs/toast";
import { extractErrorMessage } from "@/utils/func";
import { Button, Form, Input, Modal, Row, Space, Spin, Switch } from "antd";
import { useForm } from "antd/es/form/Form";
import { useEffect, useState } from "react";
import {
  useGetCategoryByIdQuery,
  useUpdateCategoryMutation,
  type CreateCategory,
} from "@/services/services";

interface SpaModalProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  onReload: () => void;
}

export default function UpdateSpa(props: SpaModalProps) {
  const { id, isOpen, onClose, onReload } = props;
  const [form] = useForm();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { data: staffData, refetch } = useGetCategoryByIdQuery(id, {
    skip: !isOpen || !id,
  });

  useEffect(() => {
    if (staffData) {
      form.setFieldsValue(staffData);
    }
  }, [staffData]);

  useEffect(() => {
    if (isOpen && id) {
      form.resetFields();
      if (staffData) {
        form.setFieldsValue(staffData);
      }
    }
  }, [isOpen, id, staffData]);

  useEffect(() => {
    if (isOpen && id) {
      form.resetFields();
      refetch();
      // fetchData(); // Removed undefined function call
    }
  }, [isOpen, id]);

  const [updateCategory] = useUpdateCategoryMutation();

  const onFinish = async (values: CreateCategory) => {
    setIsLoading(true);
    try {
      const res = await updateCategory({
        id,
        data: values,
      });

      if (!res.error) {
        showSuccess("Cập nhật danh mục thành công");
        onReload();
        onClose();
      } else {
        const err = res.error as {
          data?: { message?: string | string[] };
        };
        showError(
          "Cập nhật danh mục thất bại",
          extractErrorMessage(err) || "Đã xảy ra lỗi khi cập nhật danh mục."
        );
      }
    } catch (error) {
      showError(
        "Đã có lỗi xảy ra",
        extractErrorMessage(
          error as { data?: { message?: string | string[] } }
        ) || "Vui lòng kiểm tra lại thông tin và thử lại"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Modal
        open={isOpen}
        width={700}
        onCancel={onClose}
        footer={null}
        closable={false}
      >
        <Spin spinning={isLoading}>
          <h3 className="text-center">Cập nhật thông tin danh mục</h3>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            style={{ margin: "16px" }}
            initialValues={{ isActive: true }}
          >
            <Form.Item
              label="Tên danh mục"
              name="name"
              rules={[
                { required: true, message: "Vui lòng nhập tên danh mục" },
              ]}
            >
              <Input placeholder="Nhập tên danh mục" />
            </Form.Item>

            <Form.Item label="Mô tả" name="description">
              <Input.TextArea
                placeholder="Nhập mô tả"
                autoSize={{ minRows: 3, maxRows: 5 }}
              />
            </Form.Item>

            <Form.Item
              label="Hoạt động"
              name="isActive"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Row justify="center">
              <Space size="large">
                <Button onClick={onClose}>Huỷ</Button>
                <Button type="primary" htmlType="submit">
                  Cập nhật danh mục
                </Button>
              </Space>
            </Row>
          </Form>
        </Spin>
      </Modal>
    </>
  );
}
