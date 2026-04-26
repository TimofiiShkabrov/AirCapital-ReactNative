import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import LiquidBackground from './LiquidBackground';
import { FontSize, Spacing } from '../../constants/theme';

export default function LoadingView() {
  const { t } = useTranslation();
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1200, useNativeDriver: true }),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse, spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.container}>
      <LiquidBackground />
      <View style={styles.content}>
        <Animated.View style={[styles.ring, { transform: [{ rotate }, { scale: pulse }] }]} />
        <View style={styles.innerRing} />
        <View style={styles.textContainer}>
          <Text style={styles.title}>{t('loading.title')}</Text>
          <Text style={styles.subtitle}>{t('loading.subtitle')}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: Spacing.xl,
  },
  ring: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: 'rgba(0,212,255,0.85)',
    borderRightColor: 'rgba(0,180,160,0.60)',
  },
  innerRing: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(30,80,200,0.40)',
    borderTopColor: 'rgba(30,80,200,0.80)',
  },
  textContainer: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontSize: FontSize.title3,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: FontSize.subheadline,
    color: 'rgba(255,255,255,0.50)',
    textAlign: 'center',
    paddingHorizontal: Spacing.xxl,
  },
});
