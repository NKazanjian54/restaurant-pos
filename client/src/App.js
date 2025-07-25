import { useState, useEffect } from "react";
import LoginPage from "./components/Login/LoginPage";
import POSInterface from "./components/POS/POSInterface";

const App = () => {
  const [user, setUser] = useState(null);
  const [terminal, setTerminal] = useState(null);

  const handleLoginSuccess = (userData, terminalId) => {
    setUser(userData);
    setTerminal(terminalId);
  };

  const handleLogout = () => {
    setUser(null);
    setTerminal(null);
  };

  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <POSInterface user={user} terminal={terminal} onLogout={handleLogout} />
  );
};

export default App;
