import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: Error };

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: "20px",
          textAlign: "center",
          fontFamily: "Arial, sans-serif",
          backgroundColor: "#f5f5f5",
          border: "1px solid #ddd",
          borderRadius: "8px",
          margin: "20px"
        }}>
          <h2>Đã xảy ra lỗi</h2>
          <p>Xin lỗi, ứng dụng đã gặp sự cố. Vui lòng thử tải lại trang.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 20px",
              backgroundColor: "#1890ff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Tải lại trang
          </button>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <details style={{ marginTop: "20px", textAlign: "left" }}>
              <summary>Chi tiết lỗi (chỉ hiển thị trong development)</summary>
              <pre style={{ backgroundColor: "#f0f0f0", padding: "10px", overflow: "auto" }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}