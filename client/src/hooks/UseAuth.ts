import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/libs/state/store";
import { useNavigate } from "react-router-dom";
import { configRoutes } from "@/constants/route";
import { RoleEnum } from "@/common/types/auth";
import {
  logout,
  setCredentials,
  type AuthState,
} from "@/libs/features/auth/authSlice";

export const useAuthStore = () => {
  const auth = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return {
    auth,
    isLoggedIn: !!auth.accountId,
    setCredentials: (data: AuthState) => dispatch(setCredentials(data)),
    logout: () => {
      dispatch(logout());
      navigate(configRoutes.login, { replace: true });
    },
    isAdmin: auth.roles !== null && auth.roles === RoleEnum.Admin,
    isCustomer: auth.roles !== null && auth.roles === RoleEnum.Customer,
    isSpaComp:
      auth.roles !== null &&
      (auth.roles === RoleEnum.Spa || auth.roles === RoleEnum.Staff),
  };
};
