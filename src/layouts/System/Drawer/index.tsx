// import classNames from "classnames/bind";
// import styles from "../Header/Header.module.scss";
// import { Drawer, Select, Space } from "antd";
// import { BiCalendar, BiSolidSchool } from "react-icons/bi";

// const cx = classNames.bind(styles);

// interface DrawerRightProps {
//   onClose: () => void;
//   visible: boolean;
// }

// const DrawerRight = ({ onClose, visible }: DrawerRightProps) => {
//   return (
//     <Drawer
//       title={<h1>Cài đặt</h1>}
//       placement="right"
//       onClose={onClose}
//       open={visible}
//     >
//       {/* <Space direction="vertical" size={"large"}>
//         <div>
//           <BiSolidSchool className={cx("school-icon", "pe-2")} />{" "}
//           <Select
//             value={{
//               value: selectedSchool,
//               label:
//                 schoolList?.find((s) => s.id === selectedSchool)?.schoolName ||
//                 "Chọn trường",
//             }}
//             options={schoolList?.map((school: any) => {
//               return {
//                 value: school.id,
//                 label: school.schoolName,
//               };
//             })}
//             placeholder="Chọn trường"
//             onChange={handleSetSchool}
//             style={{ width: 250 }}
//             labelInValue
//             disabled={!isSuperAdmin}
//           />
//         </div>

//         {!isStudent && (
//           <div>
//             <BiCalendar className={cx("school-icon", "pe-2")} />{" "}
//             <Select
//               value={{
//                 value: selectedAcademic,
//                 label:
//                   academics?.find((a) => a.academicYearID === selectedAcademic)
//                     ?.academicYearName || "Chọn năm học",
//               }}
//               options={academics?.map((academic: AcademicYears) => {
//                 return {
//                   value: academic.academicYearID,
//                   label: academic.academicYearName,
//                 };
//               })}
//               placeholder="Chọn năm học"
//               onChange={handleSetAcademic}
//               style={{ width: 150 }}
//               labelInValue
//             />
//           </div>
//         )}
//       </Space> */}
//     </Drawer>
//   );
// };

// export default DrawerRight;
