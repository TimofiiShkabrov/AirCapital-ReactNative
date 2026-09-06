import React from "react";
import { Image } from "react-native";

/** The approved AirCapital mark, shared by every branded app surface. */
export default function BrandIcon({ size = 36 }: { size?: number }) {
  return (
    <Image
      source={require("../../../assets/branding/icon.png")}
      accessible={false}
      resizeMode="contain"
      style={{ width: size, height: size, borderRadius: size * 0.24 }}
    />
  );
}
