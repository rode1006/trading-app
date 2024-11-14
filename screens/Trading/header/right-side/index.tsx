import React, { useContext } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { t } from "react-native-tailwindcss";
import { TradingContext } from "../../main/TradingProvider";
import GradientButton from "../../../../components/GradientButton";

const RightSide: React.FC = () => {
  const tradingContext = useContext(TradingContext);
  if (!tradingContext) {
    return null;
  }
  const { setTransferModalVisible } = tradingContext;
  const OpenTransferModal = () => {
    setTransferModalVisible(true);
  };

  return (
    <View style={[t.flex, { width: "max-content" }]}>
      <GradientButton title="Transfer" onPress={OpenTransferModal} />
    </View>
  );
};

export default RightSide;
