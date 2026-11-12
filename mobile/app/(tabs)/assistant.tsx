import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLanguage } from '../../src/context/LanguageContext';
import { HeaderBar } from '../../src/components/HeaderBar';
import { VoicePulseButton } from '../../src/components/VoicePulseButton';
import { voiceService, AssistantResponse, RAGSource } from '../../src/services/voiceService';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  audioBase64?: string;
  ragSources?: RAGSource[];
  isGrounded?: boolean;
}

export default function AssistantScreen() {
  const { t, language, isRTL, dirStyle } = useLanguage();
  const scrollViewRef = useRef<any>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text:
        language === 'ur'
          ? 'السلام علیکم! میں سیف سٹی اے آئی ٹریفک اسسٹنٹ ہوں۔ موٹر وہیکلز آرڈیننس اور ٹریفک قوانین کے بارے میں کوئی بھی سوال پوچھیں۔'
          : language === 'ps'
          ? 'سلام! زه د سیف سټي د ټرافیکو هوښیار غږیز معاون یم. د ټرافیک قوانینو او جریمو په اړه پوښتنه وکړئ.'
          : 'Welcome to the Safe City AI Traffic Assistant. Ask any question regarding traffic fines, penalties, or the Motor Vehicles Ordinance 1965.',
      isGrounded: true,
    },
  ]);

  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeAudioMsgId, setActiveAudioMsgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');

  const sampleQuestions = [
    t.sample1,
    t.sample2,
    t.sample3,
  ];

  const handleStartVoice = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const started = await voiceService.startRecording();
    if (started) {
      setIsRecording(true);
      setStatusMessage(t.listening);
    }
  };

  const handleStopVoice = async () => {
    setIsRecording(false);
    setStatusMessage(t.processingSpeech);
    setLoading(true);

    try {
      const uri = await voiceService.stopRecording();
      if (!uri) {
        setStatusMessage(null);
        setLoading(false);
        return;
      }

      setStatusMessage(t.queryingRAG);
      const res = await voiceService.queryAudioFile(uri, language);
      handleProcessResponse(res);
    } catch (e) {
      console.warn('[Assistant] Voice query error:', e);
      setStatusMessage(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSendText = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || loading) return;

    setInputText('');
    setLoading(true);
    setStatusMessage(t.queryingRAG);

    // Add user message immediately
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
    };
    setMessages((prev) => [...prev, userMsg]);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const res = await voiceService.queryText(query, language);
      handleProcessResponse(res);
    } catch (e) {
      console.warn('[Assistant] Text query error:', e);
      setStatusMessage(null);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessResponse = (res: AssistantResponse | null) => {
    setStatusMessage(null);
    if (!res) return;

    const assistantMsg: ChatMessage = {
      id: `a-${Date.now()}`,
      sender: 'assistant',
      text: res.reply_text,
      audioBase64: res.audio_base64,
      ragSources: res.rag_sources,
      isGrounded: res.is_grounded,
    };

    setMessages((prev) => [...prev, assistantMsg]);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150);

    // Auto-play audio response if available
    if (res.audio_base64) {
      playMsgAudio(assistantMsg.id, res.audio_base64);
    }
  };

  const playMsgAudio = async (msgId: string, base64Audio: string) => {
    if (isPlayingAudio && activeAudioMsgId === msgId) {
      await voiceService.stopAudio();
      setIsPlayingAudio(false);
      setActiveAudioMsgId(null);
      return;
    }

    setIsPlayingAudio(true);
    setActiveAudioMsgId(msgId);
    await voiceService.playBase64Audio(base64Audio, () => {
      setIsPlayingAudio(false);
      setActiveAudioMsgId(null);
    });
  };

  const handleClearHistory = () => {
    setMessages([]);
    voiceService.stopAudio();
    setIsPlayingAudio(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBar title={t.assistantHeader} subtitle={t.assistantSub} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        {/* Messages Stream */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Quick legal question chips */}
          {messages.length <= 2 && (
            <View style={styles.chipsSection}>
              <Text style={[styles.chipsHeading, { textAlign: dirStyle.textAlign }]}>
                {t.sampleQuestions}
              </Text>
              {sampleQuestions.map((q, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.8}
                  onPress={() => handleSendText(q)}
                  style={[styles.chipPill, { flexDirection: dirStyle.flexDirection }]}
                >
                  <Ionicons name="sparkles-outline" size={14} color="#00F0FF" style={{ marginHorizontal: 4 }} />
                  <Text style={[styles.chipText, { textAlign: dirStyle.textAlign }]}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Conversation Bubble Items */}
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isPlayingThis = isPlayingAudio && activeAudioMsgId === msg.id;

            return (
              <View
                key={msg.id}
                style={[
                  styles.msgRow,
                  isUser ? styles.userRow : styles.assistantRow,
                ]}
              >
                <View
                  style={[
                    styles.msgBubble,
                    isUser ? styles.userBubble : styles.assistantBubble,
                  ]}
                >
                  <Text
                    style={[
                      isUser ? styles.userText : styles.assistantText,
                      { textAlign: dirStyle.textAlign },
                    ]}
                  >
                    {msg.text}
                  </Text>

                  {/* Grounded statutory citations */}
                  {msg.ragSources && msg.ragSources.length > 0 && (
                    <View style={styles.citationsBox}>
                      <View style={[styles.citationHeader, { flexDirection: dirStyle.flexDirection }]}>
                        <Ionicons name="book-outline" size={13} color="#00F0FF" />
                        <Text style={styles.citationHeaderText}>
                          {t.groundedCitations}
                        </Text>
                      </View>
                      {msg.ragSources.map((source, i) => (
                        <Text key={i} style={[styles.citationItem, { textAlign: dirStyle.textAlign }]}>
                          • {source.section || source.title || source.source}
                        </Text>
                      ))}
                    </View>
                  )}

                  {/* Audio Controls if audio exists */}
                  {msg.audioBase64 && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => playMsgAudio(msg.id, msg.audioBase64!)}
                      style={[styles.audioPlayBtn, { flexDirection: dirStyle.flexDirection }]}
                    >
                      <Ionicons
                        name={isPlayingThis ? 'stop-circle' : 'play-circle'}
                        size={18}
                        color="#00F0FF"
                      />
                      <Text style={styles.audioPlayText}>
                        {isPlayingThis ? t.stopAudio : t.playingAudio}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}

          {loading && (
            <View style={styles.loadingBubble}>
              <ActivityIndicator size="small" color="#00F0FF" />
              <Text style={styles.loadingText}>
                {statusMessage || t.processingSpeech}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Bottom Bar: Animated Voice Mic + Keyboard Input */}
        <View style={styles.bottomControlBar}>
          {statusMessage && (
            <Text style={styles.liveStatusBadge}>{statusMessage}</Text>
          )}

          <View style={[styles.inputRow, { flexDirection: dirStyle.flexDirection }]}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder={t.typeQuestionPlaceholder}
              placeholderTextColor="#64748B"
              style={[styles.textInput, { textAlign: dirStyle.textAlign }]}
            />

            {inputText.trim().length > 0 ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleSendText()}
                style={styles.sendIconBtn}
              >
                <Ionicons name="send" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Large Center Voice Pulse Button */}
          <View style={styles.micCenterWrapper}>
            <VoicePulseButton
              isRecording={isRecording}
              isPlaying={isPlayingAudio}
              onPress={isRecording ? handleStopVoice : handleStartVoice}
              size={68}
            />
            <Text style={styles.micPromptText}>
              {isRecording ? t.tapToStop : t.tapToSpeak}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A192F',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  chipsSection: {
    marginBottom: 16,
  },
  chipsHeading: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipPill: {
    backgroundColor: '#112240',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
    alignItems: 'center',
  },
  chipText: {
    color: '#CBD5E1',
    fontSize: 13,
    flex: 1,
  },
  msgRow: {
    marginVertical: 6,
    flexDirection: 'row',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  msgBubble: {
    maxWidth: '85%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userBubble: {
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#112240',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  userText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  assistantText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 23,
  },
  citationsBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  citationHeader: {
    alignItems: 'center',
    marginBottom: 4,
  },
  citationHeaderText: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: '700',
    marginHorizontal: 6,
  },
  citationItem: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
  },
  audioPlayBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  audioPlayText: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: 6,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#112240',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    alignSelf: 'flex-start',
    marginVertical: 8,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 12,
    marginHorizontal: 8,
  },
  bottomControlBar: {
    backgroundColor: '#0A192F',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
    alignItems: 'center',
  },
  liveStatusBadge: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputRow: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#112240',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 10,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  sendIconBtn: {
    backgroundColor: '#2563EB',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micCenterWrapper: {
    alignItems: 'center',
  },
  micPromptText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: -8,
  },
});
