import React from "react";
import { View, Text } from "react-native";
import { t } from "react-native-tailwindcss";

const OrderPanel: React.FC = () => {
  return (
    <View style={[t.pY3, t.pX8]}>
      <Text>OrderPanel</Text>
    </View>
  );
};

export default OrderPanel;
