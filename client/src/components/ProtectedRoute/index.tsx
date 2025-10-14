/* eslint-disable @typescript-eslint/no-unused-vars */
import { Navigate, Outlet } from "react-router-dom";
import { configError } from "@/constants/route";
import { useAuthStore } from "@/hooks/UseAuth";
type RoleType = string;
interface ProtectedRouteProps {
  allowedRoles: RoleType[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isLoggedIn, auth } = useAuthStore();

  // const loading = !auth || !auth.roles;

  // if (loading) {
  //   return (
  //     <div
  //       className="d-flex flex-column justify-content-center align-items-center"
  //       style={{ height: "100vh", backgroundColor: "#f9f9f9" }}
  //     >
  //       <Spin size="large" tip={<Text>Đang xác minh quyền truy cập...</Text>} />
  //       <Text type="secondary" className="mt-3">
  //         Vui lòng chờ trong giây lát
  //       </Text>
  //     </div>
  //   );
  // }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  const hasPermission = allowedRoles.some((role) =>
    auth.roles?.includes(String(role))
  );

  if (!hasPermission) {
    return <Navigate to={configError.UnAuthorize} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
