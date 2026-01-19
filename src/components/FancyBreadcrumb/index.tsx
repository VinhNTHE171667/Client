import { Breadcrumb as AntdBreadcrumb, type BreadcrumbProps } from "antd";

import styles from "./FancyBreadcrumb.module.scss";
import classNames from "classnames/bind";

const cx = classNames.bind(styles);

export default function FancyBreadcrumb(props: BreadcrumbProps) {
  //   return <AntdBreadcrumb separator=">" {...props} />;

  return (
    <div className={cx("breadcrumb")}>
      <AntdBreadcrumb separator=">" {...props} />
    </div>
  );
}
