import React from "react";
import { View } from "react-native";
import { t } from "react-native-tailwindcss";
import LeftSide from "./left-side";
import RightSide from "./right-side";

const Header: React.FC = () => {
  return (
    <View
      style={[
        t.bgGray800,
        t.pY3,
        t.pX8,
        t.flexRow,
        t.justifyBetween,
      ]}
    >
      <LeftSide />
      <RightSide />
    </View>
  );
};

export default Header;
