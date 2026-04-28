// src/components/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);

          let userData = {
            uid: user.uid,
            email: user.email,
            role: "user",
            isAdmin: false,
            isWorker: false,
            isHead: false,
            emailVerified: user.emailVerified,
          };

          if (docSnap.exists()) {
            const data = docSnap.data();
            const role = data.role?.trim().toLowerCase() || "user";

            userData.role = role;
            userData.isAdmin = role === "admin";
            userData.isWorker = role === "worker";
            userData.isHead = role === "head";
            userData.emailVerified = data.emailVerified ?? user.emailVerified;
          }

          setCurrentUser(userData);
        } catch (err) {
          console.error("Error reading user doc:", err);
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            role: "user",
            isAdmin: false,
            isWorker: false,
            isHead: false,
            emailVerified: user.emailVerified,
          });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
