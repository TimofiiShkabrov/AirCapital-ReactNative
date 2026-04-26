import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

interface Props {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  shadow?: boolean;
}

export default function LiquidSurface({ children, style, radius = 20, shadow = true }: Props) {
  return (
    <View style={[shadow && styles.shadow, { borderRadius: radius }, style]}>
      <BlurView
        intensity={18}
        tint="dark"
        style={[styles.blur, { borderRadius: radius }]}
      >
        <View style={[styles.overlay, { borderRadius: radius }]}>
          {children}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30,
    shadowRadius: 16,
    elevation: 8,
  },
  blur: {
    overflow: 'hidden',
  },
  overlay: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },
});
