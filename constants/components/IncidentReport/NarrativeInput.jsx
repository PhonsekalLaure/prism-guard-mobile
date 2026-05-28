import {
  PrismColors,
  PrismShadows,
  PrismSpacing,
  PrismTypography,
} from "@/constants/prismTheme";
import { StyleSheet, Text, TextInput, View } from "react-native";

const NarrativeInput = ({ value, onChangeText }) => (
  <View style={styles.card}>
    <Text style={styles.label}>Incident Narrative</Text>
    <TextInput
      style={styles.textArea}
      multiline
      value={value}
      onChangeText={onChangeText}
      placeholder="Describe the incident here. You can write in Tagalog, English, or Taglish."
      placeholderTextColor={PrismColors.textSecondary}
      textAlignVertical="top"
    />
  </View>
);

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
  textArea: {
    height: 160,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    padding: PrismSpacing.sm,
    fontSize: 15,
    color: PrismColors.textPrimary,
    backgroundColor: "#fcfcfc",
    lineHeight: 22,
  },
});

export default NarrativeInput;
