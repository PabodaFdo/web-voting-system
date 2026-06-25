import { createContext, useContext, useEffect, useState } from "react";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const raw = localStorage.getItem("admin_auth");
    return raw ? JSON.parse(raw) : null;
  });
  useEffect(() => {
    auth ? localStorage.setItem("admin_auth", JSON.stringify(auth))
         : localStorage.removeItem("admin_auth");
  }, [auth]);
  return <AuthCtx.Provider value={{ auth, setAuth }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
