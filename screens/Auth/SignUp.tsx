import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, TouchableOpacity } from "react-native";
import { t } from "react-native-tailwindcss";
import { useNavigation } from "@react-navigation/native";
import { registerUser } from "../../api/auth";

const SignUnScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigation = useNavigation();
  const token = localStorage.getItem("token");
  const [message, setMessage] = useState<string | null>(null); // Add a message state to store error messages

  const handleSignUp = async () => {
    // Handle sign-in logic here (e.g., API call)
    if (email === "" || password === "") {      
      setMessage("Please fill in all fields");
      return;
    }
    try {
      const data = await registerUser(email, password);
      if (data.ok) {
        navigation.navigate("SignIn");
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
      setMessage('')
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
        <Text style={[t.text2xl, t.fontBold, t.mB4]}>Sign Up</Text>
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
        <Button title="Sign Up" onPress={handleSignUp} />
        <TouchableOpacity onPress={() => navigation.navigate("SignIn")}>
          <Text style={[t.textBlue500, t.mT4, t.textCenter]}>
            If you've already have an account? Sign In
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SignUnScreen;
