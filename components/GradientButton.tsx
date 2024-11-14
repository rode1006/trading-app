import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { t } from "react-native-tailwindcss";
import { Icon } from 'react-native-elements';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
}

const GradientButton: React.FC<GradientButtonProps> = ({ title, onPress }) => {
  return (
    <View
      style={[
        {
          borderRadius: 10,
          overflow: "hidden", // Ensures children fit within the rounded border
          backgroundColor: "transparent", // Transparent to apply gradient-like effect using colors
        },
        t.pX4, // padding-left and padding-right (adjust as needed)
        t.pY3, // padding-top and padding-bottom (adjust as needed)
        t.flexRow, // align children horizontally if needed
        t.itemsCenter, // center children vertically within the button
        {
          background: `linear-gradient(90deg, rgb(142, 131, 251) 0%, #5d52ee 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      ]}
    >
      <TouchableOpacity
        style={[
          { borderRadius: 10 },
          t.flexRow,
          t.itemsCenter,
          { borderWidth: 0 },
        ]}
        onPress={onPress}
      >
        <Icon name="swap-vert" type="ionicon" size={20} color="#900" />

        <Text style={[t.textWhite, t.textBase, t.fontMedium]}>{title}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default GradientButton;
