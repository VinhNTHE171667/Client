import { toast } from "react-toastify";

const renderContent = (message: string, desc?: string) => (
  <div>
    <strong>{message}</strong>
    {desc && <div style={{ fontSize: 12, marginTop: 4 }}>{desc}</div>}
  </div>
);

export const showSuccess = (message: string, desc?: string) => {
  toast.success(renderContent(message, desc), {
    position: "top-right",
    autoClose: 3000,
    pauseOnHover: true,
    draggable: true,
  });
};

export const showError = (message: string, desc?: string) => {
  toast.error(renderContent(message, desc), {
    position: "top-right",
    autoClose: 3000,
    pauseOnHover: true,
    draggable: true,
  });
};

export const showInfo = (message: string) => toast.info(message);
export const showWarning = (message: string) => toast.warn(message);
