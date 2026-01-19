"use client";

import classNames from "classnames/bind";
import styles from "./MultiVideoBackground.module.scss";
import { configRoutes } from "@/constants/route";

const cx = classNames.bind(styles);

const videos = [
  { id: "dlZzfKLmU0M", title: "Relaxing Spa Music" },
  { id: "upnA8Fg4eSo", title: "Nature & Waterfall" },
  { id: "DjCFi8NRWvs", title: "Peaceful Ambience" },
];

const MultiVideoBackground = () => {
  return (
    <section className={cx("videoBackground")}>
      <div className={cx("videoGrid")}>
        {videos.map((video) => (
          <div key={video.id} className={cx("videoItem")}>
            <iframe
              src={`https://www.youtube.com/embed/${video.id}?autoplay=1&mute=1&loop=1&playlist=${video.id}&controls=0&showinfo=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&fs=0&playsinline=1&enablejsapi=1`}
              title={video.title}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className={cx("videoFrame")}
            />
          </div>
        ))}
      </div>

      <div className={cx("overlay")}>
        <div className={cx("content")}>
          <h1 className={cx("mainTitle")}>
            Chào Mừng Đến Với
            <br />
            <span className={cx("highlight")}>Spa</span>
          </h1>
          <p className={cx("subtitle")}>
            Nơi vẻ đẹp và sự thư giãn hòa quyện hoàn hảo
          </p>
          <div className={cx("ctaButtons")}>
            <button
              onClick={() => {
                window.location.href = configRoutes.services;
              }}
              className={cx("btn", "btnPrimary")}
            >
              Đặt Lịch Ngay
            </button>
            <button
              onClick={() => {
                window.location.href = configRoutes.services;
              }}
              className={cx("btn", "btnSecondary")}
            >
              Khám Phá Dịch Vụ
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MultiVideoBackground;
