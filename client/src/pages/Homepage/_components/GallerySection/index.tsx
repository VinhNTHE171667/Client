import React from "react";
import classNames from "classnames/bind";
import styles from "./GallerySection.module.scss";
import img1 from "@/assets/img/gallery-1.jpg";
import img2 from "@/assets/img/gallery-2.jpg";
import img3 from "@/assets/img/gallery-3.jpg";
import img4 from "@/assets/img/gallery-4.jpg";
import img5 from "@/assets/img/gallery-5.jpg";
import img6 from "@/assets/img/gallery-6.jpg";

const cx = classNames.bind(styles);

const galleryImages: string[] = [img1, img2, img3, img4, img5, img6];

const GallerySection = () => {
  return (
    <section className={cx("gallerySection")}>
      <div className="container">
        <div className={cx("headingWrapper")}>
          <span className={cx("tagline")}>Khoảnh khắc đáng nhớ</span>
          <h2 className={cx("heading")}>Thư Viện Hình Ảnh</h2>
          <p className={cx("subHeading")}>
            GenSpa tự hào ghi lại những trải nghiệm thư giãn và dịch vụ chăm sóc
            sắc đẹp đẳng cấp.
          </p>
        </div>

        <div className="row g-4">
          {galleryImages.map((img, i) => (
            <div key={i} className="col-lg-4 col-md-6">
              <div className={cx("galleryItem")}>
                <img src={img} alt={`gallery-${i}`} />
                <div className={cx("overlay")}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GallerySection;
