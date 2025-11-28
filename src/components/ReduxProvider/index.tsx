import { Provider } from "react-redux";

import { store } from "@/libs/state/store";
import type { ReactNode } from "react";

interface ReduxProviderProps {
  children: ReactNode;
}

const ReduxProvider = ({ children }: ReduxProviderProps) => {
  return <Provider store={store}>{children}</Provider>;
};

export default ReduxProvider;
