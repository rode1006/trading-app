import React, { useContext } from "react";
import { Modal, View, Text, TouchableOpacity, TextInput } from "react-native";
import { t } from "react-native-tailwindcss";
import { TradingContext } from "../main/TradingProvider";

const TransferModal = () => {
  const tradingContext = useContext(TradingContext);
  if (!tradingContext) {
    return null;
  }
  const { transferModalVisible, setTransferModalVisible } = tradingContext;
  return (
    <Modal
      transparent={true}
      visible={transferModalVisible}
      animationType="fade"
      onRequestClose={() => setTransferModalVisible(false)}
    >
      <View
        style={[
          t.flex1,
          t.justifyCenter,
          t.itemsCenter,
          t.bgGray900,
          t.opacity75,
        ]}
      >
        <View
          style={[
            t.roundedLg,
            t.p3,
            t.w3_5,
            t.shadowLg,
            t.z10,
            { backgroundColor: "#292775" },
          ]}
        >
          <TouchableOpacity
            onPress={() => setTransferModalVisible(false)}
            style={[t.absolute, { top: 10, right: 15 }]}
          >
            <Text style={[t.text2xl, t.textWhite]}>✖</Text>
          </TouchableOpacity>
          <Text style={[t.text2xl, t.mT4, t.textWhite]}>USDT Transfer</Text>
          <View style={[t.mT4, t.flexRow]}>
            <View style={[t.mX3, t.flexRow]}>
              <Text style={[t.textXl, t.textOrange400]}>
                Est. Futures Balance(USDT):
              </Text>
              <Text style={[t.textXl, t.textBlue400]}>0.00</Text>
            </View>
            <View style={[t.mX3, t.flexRow]}>
              <Text style={[t.textXl, t.textOrange400]}>
                Est. Spot Balance(USDT):
              </Text>
              <Text style={[t.textXl, t.textBlue400]}>0.00</Text>
            </View>
          </View>
          <Text style={[t.text2xl, t.textWhite]}>Mode:</Text>
        </View>
      </View>
    </Modal>
  );
};

export default TransferModal;
