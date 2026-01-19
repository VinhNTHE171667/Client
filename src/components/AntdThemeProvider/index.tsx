import { ConfigProvider } from "antd";
import type { ReactNode } from "react";

type AntdThemeProviderProps = {
  children: ReactNode;
};

const AntdThemeProvider = ({ children }: AntdThemeProviderProps) => {
  return (
    <ConfigProvider
      theme={{
        token: {
          fontFamily: "BeVietNamPro,Poppins, sans-serif",
          fontWeightStrong: 500,
          colorText: "#1d2939",
        },
        components: {
          Card: {
            boxShadow:
              "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
            borderRadius: 16,
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
};

export default AntdThemeProvider;
