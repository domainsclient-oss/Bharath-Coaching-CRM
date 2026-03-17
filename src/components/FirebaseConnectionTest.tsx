"use client";

import { useEffect } from "react";
import { db } from "@/config/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function FirebaseConnectionTest() {
  useEffect(() => {
    const test = async () => {
      try {
        await getDocs(collection(db, "_connection_test"));
        console.log("✅ Firebase Firestore connected successfully");
      } catch (e: any) {
        console.error("❌ Firebase connection error:", e.message);
      }
    };
    test();
  }, []);

  return null;
}