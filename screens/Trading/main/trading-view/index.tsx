import React from "react";
import { Text, View } from "react-native";
import { t } from "react-native-tailwindcss";

const TradingView: React.FC = () => {
  return (
    <View style={[t.pY3, t.pX8]}>
      <Text>TradingView</Text>
    </View>
  );
};

export default TradingView;
