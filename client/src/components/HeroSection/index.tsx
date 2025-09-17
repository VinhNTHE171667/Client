import { configRoutes } from "@/constants/route";

interface HeroSectionProps {
  title: string;
}

const HeroSection = ({ title = "About Us" }: HeroSectionProps) => {
  return (
    <>
      <div className="container-fluid bg-breadcrumb py-5">
        <div className="container text-center py-5">
          <h3 className="text-white display-3 mb-4">{title}</h3>
          <ol className="breadcrumb justify-content-center mb-0">
            <li className="breadcrumb-item">
              <a href={configRoutes.home}>Home</a>
            </li>
            {/* <li className="breadcrumb-item">
              <a href="#">Pages</a>
            </li> */}
            <li className="breadcrumb-item active text-white">{title}</li>
          </ol>
        </div>
      </div>
    </>
  );
};

export default HeroSection;
