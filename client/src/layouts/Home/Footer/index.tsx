const Footer = () => {
  return (
    <>
      <div className="container-fluid footer py-5">
        <div className="container py-5">
          <div className="row g-5">
            <div className="col-md-6 col-lg-6 col-xl-3">
              <div className="footer-item">
                <h4 className="mb-4 text-white">Newsletter</h4>
                <p className="text-white">
                  Dolor amet sit justo amet elitr clita ipsum elitr est.Lorem
                  ipsum dolor sit amet, consectetur adipiscing elit. Nullam in
                  tempor dui, non consectetur enim.
                </p>
                <div className="position-relative mx-auto rounded-pill">
                  <input
                    className="form-control rounded-pill border-0 w-100 py-3 ps-4 pe-5"
                    type="text"
                    placeholder="Enter your email"
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-primary-outline-0 rounded-pill position-absolute top-0 end-0 py-2"
                  >
                    SignUp
                  </button>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-6 col-xl-3">
              <div className="footer-item d-flex flex-column">
                <h4 className="mb-4 text-white">Our Services</h4>
                <a href="">
                  <i className="fas fa-angle-right me-2"></i> Facials
                </a>
                <a href="">
                  <i className="fas fa-angle-right me-2"></i> Waxing
                </a>
                <a href="">
                  <i className="fas fa-angle-right me-2"></i> Message
                </a>
                <a href="">
                  <i className="fas fa-angle-right me-2"></i> Minarel baths
                </a>
                <a href="">
                  <i className="fas fa-angle-right me-2"></i> Body treatments
                </a>
                <a href="">
                  <i className="fas fa-angle-right me-2"></i> Aroma Therapy
                </a>
                <a href="">
                  <i className="fas fa-angle-right me-2"></i> Stone Spa
                </a>
              </div>
            </div>
            <div className="col-md-6 col-lg-6 col-xl-3">
              <div className="footer-item d-flex flex-column">
                <h4 className="mb-4 text-white">Address</h4>
                <p className="mb-0">
                  Lorem ipsum dolor sit amet, consectetur adipisicing elit. Modi
                  deserunt iusto necessitatibus eveniet placeat nam eum labore,
                  illum tempora sit vitae voluptates, ad deleniti dignissimos!
                  Totam harum culpa ut ipsa?
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-6 col-xl-3">
              <div className="footer-item d-flex flex-column">
                <h4 className="mb-4 text-white">Follow Us</h4>
                <a href="">
                  <i className="fas fa-angle-right me-2"></i>Faceboock
                </a>

                <h4 className="my-4 text-white">Contact Us</h4>
                <p className="mb-0">
                  <i className="fas fa-envelope text-secondary me-2"></i>
                  info@example.com
                </p>
                <p className="mb-0">
                  <i className="fas fa-phone text-secondary me-2"></i> (+012)
                  3456 7890 123
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid copyright py-4">
        <div className="container">
          <div className="row g-4 align-items-center">
            <div className="col-md-12 text-center text-md-center mb-md-0">
              <span className="text-light text-center">
                <a href="#">
                  <i className="fas fa-copyright text-light me-2"></i>GenSpa
                </a>
                , All right reserved.
              </span>
            </div>
            {/* <div className="col-md-4">
              <div className="d-flex justify-content-center">
                <a
                  href=""
                  className="btn btn-light btn-light-outline-0 btn-sm-square rounded-circle me-2"
                >
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a
                  href=""
                  className="btn btn-light btn-light-outline-0 btn-sm-square rounded-circle me-2"
                >
                  <i className="fab fa-twitter"></i>
                </a>
                <a
                  href=""
                  className="btn btn-light btn-light-outline-0 btn-sm-square rounded-circle me-2"
                >
                  <i className="fab fa-instagram"></i>
                </a>
                <a
                  href=""
                  className="btn btn-light btn-light-outline-0 btn-sm-square rounded-circle me-0"
                >
                  <i className="fab fa-linkedin-in"></i>
                </a>
              </div>
            </div>
            <div className="col-md-4 text-center text-md-end text-white"></div> */}
          </div>
        </div>
      </div>
    </>
  );
};

export default Footer;
