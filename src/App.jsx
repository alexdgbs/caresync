import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import HomePage from "./pages/HomePage";
import DoctorPage from "./pages/DoctorPage";
import NotFoundPage from "./pages/NotFoundPage";
import { useDoctors } from "./hooks/useDoctors";
import { useAuth } from "./hooks/useAuth";
import AccountPage from "./pages/AccountPage";
import "./styles/index.css";

export default function App() {
  const auth = useAuth();
  const doctorsState = useDoctors();
  const getDoctorIdFromPath = () =>
    decodeURIComponent(
      window.location.pathname.match(/^\/doctores\/(.+)$/)?.[1] || "",
    );
  const [selectedDoctorId, setSelectedDoctorId] = useState(getDoctorIdFromPath);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const selectedDoctor = doctorsState.doctors.find(
    (doctor) => doctor._id === selectedDoctorId,
  );

  useEffect(() => {
    const handleNavigation = () => {
      setSelectedDoctorId(getDoctorIdFromPath());
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", handleNavigation);
    return () => window.removeEventListener("popstate", handleNavigation);
  }, []);

  const openDoctor = (doctor) => {
    window.history.pushState(
      {},
      "",
      `/doctores/${encodeURIComponent(doctor._id)}`,
    );
    setSelectedDoctorId(doctor._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeDoctor = () => {
    window.history.pushState({}, "", "/");
    setSelectedDoctorId("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app-shell">
      <Header user={auth.user} />
      <main>
        <AnimatePresence mode="wait">
          {currentPath === "/cuenta" ? (
            <AccountPage
              key="account"
              auth={auth}
              doctors={doctorsState.doctors}
            />
          ) : selectedDoctor ? (
            <DoctorPage
              key="profile"
              doctor={selectedDoctor}
              onBack={closeDoctor}
              onRate={doctorsState.rateDoctor}
              onComment={doctorsState.addComment}
              onUpdateComment={doctorsState.updateComment}
              onDeleteComment={doctorsState.deleteComment}
              auth={auth}
            />
          ) : selectedDoctorId && !doctorsState.loading ? (
            <NotFoundPage key="not-found" onBack={closeDoctor} />
          ) : (
            <HomePage
              key="directory"
              doctorsState={doctorsState}
              onSelectDoctor={openDoctor}
              auth={auth}
            />
          )}
        </AnimatePresence>
      </main>
      <Footer realtimeStatus={doctorsState.realtimeStatus} />
    </div>
  );
}
