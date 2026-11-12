import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface VoicePulseButtonProps {
  isRecording: boolean;
  isPlaying: boolean;
  onPress: () => void;
  size?: number;
}

export const VoicePulseButton: React.FC<VoicePulseButtonProps> = ({
  isRecording,
  isPlaying,
  onPress,
  size = 76,
}) => {
  const pulseAnim1 = useRef(new Animated.Value(1)).current;
  const pulseAnim2 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let animLoop: Animated.CompositeAnimation | null = null;
    if (isRecording) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      animLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim1, {
              toValue: 1.45,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim1, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(pulseAnim2, {
              toValue: 1.7,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim2, {
              toValue: 1,
              duration: 1200,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      animLoop.start();
    } else {
      pulseAnim1.setValue(1);
      pulseAnim2.setValue(1);
    }

    return () => {
      if (animLoop) animLoop.stop();
    };
  }, [isRecording]);

  const handlePress = () => {
    Haptics.selectionAsync();
    onPress();
  };

  return (
    <View style={[styles.container, { width: size * 1.8, height: size * 1.8 }]}>
      {isRecording && (
        <>
          <Animated.View
            style={[
              styles.pulseRing,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                transform: [{ scale: pulseAnim2 }],
                opacity: 0.25,
                backgroundColor: '#EF4444',
              },
            ]}
          />
          <Animated.View
            style={[
              styles.pulseRing,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                transform: [{ scale: pulseAnim1 }],
                opacity: 0.45,
                backgroundColor: '#00F0FF',
              },
            ]}
          />
        </>
      )}

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        style={[
          styles.button,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: isRecording
              ? '#EF4444'
              : isPlaying
              ? '#10B981'
              : '#2563EB',
            shadowColor: isRecording ? '#EF4444' : '#00F0FF',
          },
        ]}
      >
        <Ionicons
          name={isRecording ? 'stop' : isPlaying ? 'volume-high' : 'mic'}
          size={size * 0.45}
          color="#FFFFFF"
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
});
