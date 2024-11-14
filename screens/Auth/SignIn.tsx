import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button, TouchableOpacity } from "react-native";
import { t } from "react-native-tailwindcss";
import { useNavigation } from "@react-navigation/native";
import { loginUser } from "../../api/auth";
const token = localStorage.getItem("token");

const SignInScreen = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null); // Add a message state to store error messages
  const navigation = useNavigation();
  const handleSignIn = async () => {
    if (email === "" || password === "") {
      setMessage("Please fill in all fields");
      return;
    }
    try {
      const data = await loginUser(email, password);
      if (data.ok) {
        localStorage.setItem("token", data.token);
        navigation.navigate("Home");
      } else {
        setMessage(data); // Update the message state with error
      }
    } catch (error) {}
  };

  useEffect(() => {
    if (token) {
      navigation.navigate("Home");
    }
    if (message) {
      alert(message);
      setMessage("");
    }
  }, [token, message]);

  return (
    <View
      style={[
        t.flex1,
        t.justifyCenter,
        t.p4,
        { width: "500px", alignSelf: "center" },
      ]}
    >
      <View style={[t.bgWhite, t.p6, t.rounded, t.shadowMd]}>
        <Text style={[t.text2xl, t.fontBold, t.mB4]}>Sign In</Text>
        <TextInput
          style={[t.border, t.p3, t.mB4, t.rounded]}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={[t.border, t.p3, t.mB4, t.rounded]}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        <Button title="Sign In" onPress={handleSignIn} />
        <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
          <Text style={[t.textBlue500, t.mT4, t.textCenter]}>
            Don't have an account? Sign Up
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SignInScreen;
