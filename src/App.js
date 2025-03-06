import "./App.css";
import ToiletSchedule from "./components/ToiletSchedule";
import { ToastContainer } from "react-toastify";

function App() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <ToiletSchedule />
    </>
  );
}

export default App;
