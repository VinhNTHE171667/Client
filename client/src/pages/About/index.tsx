import about_1 from "@/assets/img/about-1.jpg";
import about_2 from "@/assets/img/about-2.jpg";

const AboutSection = () => {
  return (
    <>
      <section>
        <div className="container-fluid about py-5">
          <div className="container py-5">
            <div className="row g-5 align-items-center">
              <div className="col-lg-5">
                <div className="video position-relative">
                  <img
                    src={about_1}
                    className="img-fluid rounded"
                    alt="Ảnh spa chính"
                  />
                  <div
                    className="position-absolute rounded border-5 border-top border-start border-white"
                    style={{ bottom: 0, right: 0 }}
                  >
                    <img
                      src={about_2}
                      className="img-fluid rounded"
                      alt="Ảnh spa phụ"
                    />
                  </div>
                  {/* <button
              type="button"
              className="btn btn-play"
              data-bs-toggle="modal"
              data-src="https://www.youtube.com/embed/DWRcNpR6Kdc"
              data-bs-target="#videoModal"
            >
              <span></span>
            </button> */}
                </div>
              </div>
              <div className="col-lg-7">
                <p className="fs-4 text-uppercase text-primary">Về Chúng Tôi</p>
                <h1 className="display-4 mb-4">
                  Trung Tâm Chăm Sóc Sắc Đẹp & Thư Giãn Hàng Đầu
                </h1>
                <p className="mb-4">
                  Tại đây, chúng tôi kết hợp tinh hoa của thiên nhiên với công
                  nghệ hiện đại để mang đến những liệu trình chăm sóc toàn diện
                  nhất cho làn da và sức khỏe tinh thần của bạn.
                </p>
                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="d-flex align-items-center">
                      <i className="fab fa-gitkraken fa-3x text-primary"></i>
                      <div className="ms-4">
                        <h5 className="mb-2">Ưu Đãi Đặc Biệt</h5>
                        <p className="mb-0">
                          Nhiều chương trình khuyến mãi hấp dẫn được cập nhật
                          liên tục dành riêng cho khách hàng thân thiết.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-gift fa-3x text-primary"></i>
                      <div className="ms-4">
                        <h5 className="mb-2">Quà Tặng Trị Liệu</h5>
                        <p className="mb-0">
                          Nhận ngay gói liệu trình thử miễn phí hoặc quà tặng
                          chăm sóc da khi đăng ký lần đầu.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="my-4">
                  Với đội ngũ chuyên viên tận tâm và giàu kinh nghiệm, mỗi liệu
                  trình được cá nhân hóa để phù hợp với nhu cầu riêng biệt của
                  từng khách hàng.
                </p>
                <p className="mb-4">
                  Hãy để chúng tôi đồng hành cùng bạn trên hành trình làm đẹp –
                  từ làn da đến tinh thần, giúp bạn tìm lại sự cân bằng và vẻ
                  đẹp tự nhiên vốn có.
                </p>
                <a
                  href="#"
                  className="btn btn-primary btn-primary-outline-0 rounded-pill py-3 px-5"
                >
                  Khám Phá Thêm
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Modal video */}
        <div
          className="modal fade"
          id="videoModal"
          tabIndex={-1}
          aria-labelledby="exampleModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog">
            <div className="modal-content rounded-0">
              <div className="modal-header">
                <h5 className="modal-title" id="exampleModalLabel">
                  Video Giới Thiệu
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <div className="ratio ratio-16x9">
                  <iframe
                    className="embed-responsive-item"
                    src=""
                    id="video"
                    allowFullScreen
                    allow="autoplay"
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
export default AboutSection;
