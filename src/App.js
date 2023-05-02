import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.scss';
import HomePage from "./components/HomePage/HomePage";
import CallPage from "./components/CallPage/CallPage";
import Check from "./Context/Check";

function App() {
  return (
    <Router>
      <Routes>
        <Route  
          path="/:id" 
          element={
            <Check >
              <CallPage />
            </Check>
          } 
        />
        <Route  path="/" element={<HomePage />} />
        <Route  path="*" element={<h1>no match </h1>} />
      
      </Routes>
    </Router>
  );
}

export default App;
