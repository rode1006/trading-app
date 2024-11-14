import React from 'react'
import { View, Text } from 'react-native';
import { t } from "react-native-tailwindcss";

const Futureprice:React.FC = () => {
  return (
    <View style={[t.pY3, t.pX8, t.bgWhite, t.roundedLg, t.shadowMd]}>
      <Text>Future Price</Text>
    </View>
  )
}

export default Futureprice
