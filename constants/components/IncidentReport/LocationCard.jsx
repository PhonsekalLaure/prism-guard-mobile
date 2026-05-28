import {
    PrismColors,
    PrismShadows,
    PrismSpacing,
    PrismTypography,
} from "@/constants/prismTheme";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

const LocationCard = ({ location = "Assigned site" }) => (
  <View style={styles.card}>
    <View style={styles.iconWrapper}>
      <Ionicons name="location" size={22} color={PrismColors.navy} />
    </View>
    <View>
      <Text style={styles.label}>ASSIGNED SITE</Text>
      <Text style={styles.value}>{location}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: PrismColors.cardBg,
    borderRadius: 15,
    padding: PrismSpacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    borderLeftWidth: 4,
    borderLeftColor: PrismColors.gold,
    marginBottom: PrismSpacing.md,
    ...PrismShadows.card,
  },
  iconWrapper: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "rgba(9, 50, 105, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: PrismTypography.xs,
    color: PrismColors.textSecondary,
    fontWeight: PrismTypography.bold,
    textTransform: "uppercase",
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 15,
    fontWeight: PrismTypography.bold,
    color: PrismColors.navy,
  },
});

export default LocationCard;
