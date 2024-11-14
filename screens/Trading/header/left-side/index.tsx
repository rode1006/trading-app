import React, { useContext } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { t } from "react-native-tailwindcss";
import { TradingContext } from "../../main/TradingProvider";

const LeftSide: React.FC = () => {
  const Options = ["Futures", "Spot"];
  const tradingContext = useContext(TradingContext);
  if (!tradingContext) {
    return null;
  }
  const { selectedBalance, setSelectedBalance } = tradingContext;

  return (
    <View style={[t.flexRow, { width: "max-content" }]}>
      {Options.map((option) => (
        <TouchableOpacity
          key={option}
          style={[
            t.pY3,
            t.pX6,
            t.rounded,
            t.selfStart,
            option === selectedBalance ? t.bgGray500 : t.bgGray900,
          ]}
          onPress={() => setSelectedBalance(option)}
        >
          <Text style={[t.textWhite, t.textBase, { fontSize: 17 }]}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default LeftSide;
