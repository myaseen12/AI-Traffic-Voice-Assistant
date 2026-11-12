import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../src/context/LanguageContext';
import { HeaderBar } from '../../src/components/HeaderBar';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const { t, isRTL, dirStyle } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: 'qr-code-outline' as const,
      color: '#00F0FF',
      title: t.onboardingTitle1,
      desc: t.onboardingDesc1,
    },
    {
      icon: 'mic-outline' as const,
      color: '#2563EB',
      title: t.onboardingTitle2,
      desc: t.onboardingDesc2,
    },
    {
      icon: 'card-outline' as const,
      color: '#10B981',
      title: t.onboardingTitle3,
      desc: t.onboardingDesc3,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.replace('/(auth)/login');
    }
  };

  const handleSkip = () => {
    router.replace('/(auth)/login');
  };

  const activeStep = steps[currentStep];

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBar showLanguageToggle={true} />

      <View style={styles.contentContainer}>
        {/* Visual Icon Halo */}
        <View style={styles.iconWrapper}>
          <View style={[styles.haloRing, { borderColor: `${activeStep.color}40` }]} />
          <View style={[styles.haloCenter, { backgroundColor: `${activeStep.color}1A`, borderColor: activeStep.color }]}>
            <Ionicons name={activeStep.icon} size={64} color={activeStep.color} />
          </View>
        </View>

        {/* Text Details */}
        <View style={styles.textSection}>
          <Text style={[styles.title, { textAlign: dirStyle.textAlign }]}>
            {activeStep.title}
          </Text>
          <Text style={[styles.desc, { textAlign: dirStyle.textAlign }]}>
            {activeStep.desc}
          </Text>
        </View>

        {/* Step Indicator Dots */}
        <View style={[styles.dotsRow, { flexDirection: dirStyle.flexDirection }]}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentStep ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>

        {/* Action Controls */}
        <View style={[styles.bottomRow, { flexDirection: dirStyle.flexDirection }]}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleSkip}
            style={styles.skipBtn}
          >
            <Text style={styles.skipBtnText}>{t.skip}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleNext}
            style={styles.nextBtn}
          >
            <Text style={styles.nextBtnText}>
              {currentStep === steps.length - 1 ? t.getStarted : t.next}
            </Text>
            <Ionicons
              name={isRTL ? 'arrow-back' : 'arrow-forward'}
              size={18}
              color="#FFFFFF"
              style={{ marginHorizontal: 6 }}
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A192F',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
    paddingVertical: 36,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  haloRing: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  haloCenter: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  textSection: {
    marginVertical: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 34,
    marginBottom: 12,
  },
  desc: {
    fontSize: 15,
    color: '#94A3B8',
    lineHeight: 24,
  },
  dotsRow: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: '#00F0FF',
  },
  inactiveDot: {
    width: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  bottomRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  skipBtnText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
  },
  nextBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 14,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 6,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
