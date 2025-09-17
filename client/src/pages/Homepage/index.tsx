import img_carousel_1 from "@/assets/img/carousel-1.jpg";
import img_carousel_2 from "@/assets/img/carousel-2.jpg";
import img_carousel_3 from "@/assets/img/carousel-3.jpg";
import AboutSection from "../About";

const Homepage = () => {

  return (
    <>
      <section>
        <div className="container-fluid carousel-header px-0">
          <div
            id="carouselId"
            className="carousel slide"
            data-bs-ride="carousel"
          >
            <ol className="carousel-indicators">
              {/* <li
                data-bs-target="#carouselId"
                data-bs-slide-to="0"
                className="active"
              ></li>
              <li data-bs-target="#carouselId" data-bs-slide-to="1"></li>
              <li data-bs-target="#carouselId" data-bs-slide-to="2"></li> */}
            </ol>
            <div className="carousel-inner" role="listbox">
              <div className="carousel-item active">
                <img src={img_carousel_1} className="img-fluid" alt="Image" />
                <div className="carousel-caption">
                  <div className="p-3" style={{ maxWidth: 900 }}>
                    <h4 className="text-primary text-uppercase mb-3">
                      Spa & Beauty Center
                    </h4>
                    <h1 className="display-1 text-capitalize text-dark mb-3">
                      Massage Treatment
                    </h1>
                    <p className="mx-md-5 fs-4 px-4 mb-5 text-dark">
                      Lorem rebum magna dolore amet lorem eirmod magna erat diam
                      stet. Sadips duo stet amet amet ndiam elitr ipsum
                    </p>
                    <div className="d-flex align-items-center justify-content-center">
                      <a
                        className="btn btn-light btn-light-outline-0 rounded-pill py-3 px-5 me-4"
                        href="#"
                      >
                        Get Start
                      </a>
                      <a
                        className="btn btn-primary btn-primary-outline-0 rounded-pill py-3 px-5"
                        href="#"
                      >
                        Book Now
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              <div className="carousel-item">
                <img src={img_carousel_2} className="img-fluid" alt="Image" />
                <div className="carousel-caption">
                  <div className="p-3" style={{ maxWidth: 900 }}>
                    <h4
                      className="text-primary text-uppercase mb-3 fw-bold"
                      style={{ letterSpacing: "3px" }}
                    >
                      Spa & Beauty Center
                    </h4>
                    <h1 className="display-1 text-capitalize text-dark mb-3">
                      Facial Treatment
                    </h1>
                    <p className="mx-md-5 fs-4 px-5 mb-5 text-dark">
                      Lorem rebum magna dolore amet lorem eirmod magna erat diam
                      stet. Sadips duo stet amet amet ndiam elitr ipsum
                    </p>
                    <div className="d-flex align-items-center justify-content-center">
                      <a
                        className="btn btn-light btn-light-outline-0 rounded-pill py-3 px-5 me-4"
                        href="#"
                      >
                        Get Start
                      </a>
                      <a
                        className="btn btn-primary btn-primary-outline-0 rounded-pill py-3 px-5"
                        href="#"
                      >
                        Book Now
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              <div className="carousel-item">
                <img src={img_carousel_3} className="img-fluid" alt="Image" />
                <div className="carousel-caption">
                  <div className="p-3" style={{ maxWidth: "900px" }}>
                    <h4
                      className="text-primary text-uppercase mb-3"
                      style={{ letterSpacing: "3px" }}
                    >
                      Spa & Beauty Center
                    </h4>
                    <h1 className="display-1 text-capitalize text-dark">
                      Cellulite Treatment
                    </h1>
                    <p className="mx-md-5 fs-4 px-5 mb-5 text-dark">
                      Lorem rebum magna dolore amet lorem eirmod magna erat diam
                      stet. Sadips duo stet amet amet ndiam elitr ipsum
                    </p>
                    <div className="d-flex align-items-center justify-content-center">
                      <a
                        className="btn btn-light btn-light-outline-0 rounded-pill py-3 px-5 me-4"
                        href="#"
                      >
                        Get Start
                      </a>
                      <a
                        className="btn btn-primary btn-primary-outline-0 rounded-pill py-3 px-5"
                        href="#"
                      >
                        Book Now
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>


      <AboutSection />

    </>
  );
};

export default Homepage;
