import { configRoutes } from "@/constants/route";
import styles from "./HeroSection.module.scss";
import classNames from "classnames/bind";

const cx = classNames.bind(styles);

interface HeroSectionProps {
  title?: string;
}

const HeroSection = ({ title = "" }: HeroSectionProps) => {
  return (
    <section className={cx("heroSection")}>
      <div className="container text-center">
        <h1 className={cx("heading")}>{title}</h1>

        <ol className={cx("breadcrumb")}>
          <li className="breadcrumb-item">
            <a href={configRoutes.home}>Trang chủ</a>
          </li>
          <li className="breadcrumb-item active">{title}</li>
        </ol>
      </div>
    </section>
  );
};

export default HeroSection;
