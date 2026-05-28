import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

/**
 * LeaveHeader
 * Props:
 *   onBack  () => void
 */
const LeaveHeader = ({ onBack }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={onBack}
        activeOpacity={0.7}
      >
        <Feather name="chevron-left" size={22} color="#093269" />
      </TouchableOpacity>
      <Text style={styles.title}>Request Leave</Text>
      {/* Spacer to balance the back button */}
      <View style={styles.spacer} />
    </View>
  );
};

export default LeaveHeader;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#F4F6FB",
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1A2340",
    letterSpacing: 0.2,
  },
  spacer: {
    width: 38,
  },
});
