import {
    PrismColors,
    PrismShadows,
    PrismSpacing,
    PrismTypography,
} from "@/constants/prismTheme";
import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const NarrativeInput = ({ value, onChangeText }) => {
  const [isListening, setIsListening] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef(null);

  const startPulse = () => {
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );
    pulseLoop.current.start();
  };

  const stopPulse = () => {
    pulseLoop.current?.stop();
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const toggleRecording = () => {
    if (!isListening) {
      setIsListening(true);
      startPulse();
      // TODO: hook up real Speech-to-Text (e.g. expo-speech or @react-native-voice/voice)
    } else {
      setIsListening(false);
      stopPulse();
      // Simulated NLP output — replace with real STT result
      onChangeText(
        (value ? value + " " : "") +
          "Suspect was wearing a black hoodie and seen running towards the East Exit.",
      );
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Incident Narrative</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.textArea}
          multiline
          value={value}
          onChangeText={onChangeText}
          placeholder={
            isListening
              ? "Listening… (speak now)"
              : "Describe the incident here. You can write in Tagalog, English, or Taglish…"
          }
          placeholderTextColor={PrismColors.textSecondary}
          textAlignVertical="top"
        />
        <Animated.View
          style={[styles.micBtnWrapper, { transform: [{ scale: pulseAnim }] }]}
        >
          <TouchableOpacity
            style={[styles.micBtn, isListening && styles.micBtnActive]}
            onPress={toggleRecording}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isListening ? "stop" : "mic"}
              size={20}
              color={PrismColors.white}
            />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: PrismColors.cardBg,
    borderRadius: 15,
    padding: PrismSpacing.md,
    marginBottom: PrismSpacing.md,
    ...PrismShadows.card,
  },
  label: {
    fontSize: 14,
    fontWeight: PrismTypography.bold,
    color: PrismColors.navy,
    marginBottom: PrismSpacing.sm,
  },
  inputWrapper: {
    position: "relative",
  },
  textArea: {
    height: 160,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    padding: PrismSpacing.sm,
    paddingRight: 55,
    fontSize: 15,
    color: PrismColors.textDark,
    backgroundColor: "#fcfcfc",
    lineHeight: 22,
  },
  micBtnWrapper: {
    position: "absolute",
    bottom: 12,
    right: 12,
  },
  micBtn: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: PrismColors.navy,
    alignItems: "center",
    justifyContent: "center",
    ...PrismShadows.button,
  },
  micBtnActive: {
    backgroundColor: "#C0392B",
  },
});

export default NarrativeInput;
