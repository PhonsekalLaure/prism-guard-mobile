import {
    PrismColors,
    PrismShadows,
    PrismSpacing,
    PrismTypography,
} from "@/constants/prismTheme";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const ReviewModal = ({
  visible,
  location,
  time,
  narrative,
  onEdit,
  onConfirm,
}) => (
  <Modal
    transparent
    animationType="fade"
    visible={visible}
    onRequestClose={onEdit}
  >
    <View style={styles.overlay}>
      <View style={styles.sheet}>
        <Text style={styles.title}>Confirm Report</Text>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>LOCATION</Text>
          <Text style={styles.fieldValue}>{location}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>TIME</Text>
          <Text style={styles.fieldValue}>{time}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>NARRATIVE</Text>
          <ScrollView style={styles.narrativeBox} nestedScrollEnabled>
            <Text style={styles.narrativeText}>{narrative}</Text>
          </ScrollView>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btn, styles.btnEdit]}
            onPress={onEdit}
          >
            <Text style={styles.btnEditText}>EDIT</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.btnSubmit]}
            onPress={onConfirm}
          >
            <Text style={styles.btnSubmitText}>SUBMIT</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: PrismColors.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: PrismSpacing.lg,
    paddingBottom: 36,
    ...PrismShadows.card,
  },
  title: {
    fontSize: 18,
    fontWeight: PrismTypography.bold,
    color: PrismColors.navy,
    textAlign: "center",
    marginBottom: PrismSpacing.md,
  },
  field: {
    marginBottom: PrismSpacing.md,
  },
  fieldLabel: {
    fontSize: PrismTypography.xs,
    color: PrismColors.textSecondary,
    fontWeight: PrismTypography.bold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: PrismTypography.bold,
    color: PrismColors.navy,
  },
  narrativeBox: {
    maxHeight: 100,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: PrismSpacing.sm,
    marginTop: 4,
  },
  narrativeText: {
    fontSize: 13,
    color: PrismColors.textDark,
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: PrismSpacing.sm,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnEdit: {
    backgroundColor: "#f0f0f0",
  },
  btnEditText: {
    fontSize: 14,
    fontWeight: PrismTypography.bold,
    color: PrismColors.textSecondary,
    letterSpacing: 1,
  },
  btnSubmit: {
    backgroundColor: PrismColors.gold,
    ...PrismShadows.button,
  },
  btnSubmitText: {
    fontSize: 14,
    fontWeight: PrismTypography.bold,
    color: PrismColors.navy,
    letterSpacing: 1,
  },
});

export default ReviewModal;
