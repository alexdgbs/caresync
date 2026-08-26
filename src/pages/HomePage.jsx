import { motion as Motion } from "framer-motion";
import HeroSection from "../components/home/HeroSection";
import CareSteps from "../components/home/CareSteps";
import AboutSection from "../components/home/AboutSection";
import DoctorDirectory from "../components/doctors/DoctorDirectory";

export default function HomePage({ doctorsState, onSelectDoctor, auth }) {
  return (
    <Motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
    >
      <HeroSection />
      <CareSteps />
      <DoctorDirectory
        {...doctorsState}
        onSelectDoctor={onSelectDoctor}
        auth={auth}
      />
      <AboutSection />
    </Motion.div>
  );
}
