import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function LiquidBackground() {
  return (
    <LinearGradient
      colors={['#0D1219', '#0F1720', '#0A0F17']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    >
      <View style={[styles.blob, styles.cyan]} />
      <View style={[styles.blob, styles.teal]} />
      <View style={[styles.blob, styles.blue]} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  cyan: {
    width: 260,
    height: 260,
    backgroundColor: 'rgba(0,212,255,0.14)',
    top: -120,
    left: -100,
    opacity: 0.7,
  },
  teal: {
    width: 320,
    height: 180,
    backgroundColor: 'rgba(0,180,160,0.12)',
    top: 180,
    right: -80,
    opacity: 0.7,
    transform: [{ rotate: '-18deg' }],
  },
  blue: {
    width: 220,
    height: 220,
    backgroundColor: 'rgba(30,80,200,0.12)',
    top: -20,
    right: 60,
    opacity: 0.7,
  },
});
