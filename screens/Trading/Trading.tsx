import React, { useEffect } from "react";
import Header from "./header";
import Main from "./main";
import { useNavigation } from "@react-navigation/native";
import TradingProvider from "./main/TradingProvider";

const Trading = () => {
  const token = localStorage.getItem("token");
  const navigation = useNavigation();
  useEffect(() => {
    if (!token) {
      navigation.navigate("SignIn");
    }
  }, [token]);

  return (
    <TradingProvider>
      <Header />
      <Main />
    </TradingProvider>
  );
};

export default Trading;
