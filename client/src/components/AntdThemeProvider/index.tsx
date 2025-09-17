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
          fontFamily: "Poppins",
          fontWeightStrong: 500,
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
};

export default AntdThemeProvider;
