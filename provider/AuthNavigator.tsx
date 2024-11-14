import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SignUnScreen from '../screens/Auth/SignUp';
import SignInScreen from '../screens/Auth/SignIn';
import Trading from '../screens/Trading/Trading';


const Stack = createNativeStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="SignIn">
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUnScreen} />
      <Stack.Screen name="Home" component={Trading} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
