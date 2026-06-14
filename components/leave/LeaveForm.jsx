import { Feather, FontAwesome5 } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import {
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { LEAVE_TYPE_LABELS } from "@/constants/leaveTypes";
import {
  addDaysToDateKey,
  formatLeaveDate,
  getDateRange,
  getTodayDateKey,
} from "@/utils/leaveDates";
import LeavePicker from "./LeavePicker";
import ScheduledLeaveDatePicker from "./ScheduledLeaveDatePicker";

function getStartDateBounds(formData) {
  const today = getTodayDateKey();
  const { leaveType } = formData;

  if (leaveType === "sick") {
    return { maxDate: today };
  }

  if (leaveType === "paternity" && formData.childBirthDate) {
    return {
      minDate: formData.childBirthDate,
      maxDate: addDaysToDateKey(formData.childBirthDate, 60),
    };
  }

  if (leaveType === "emergency") {
    return { minDate: today, maxDate: today };
  }

  if (leaveType === "service_incentive") {
    return formData.silPurpose === "sick_substitution"
      ? { maxDate: today }
      : { minDate: today };
  }

  return { minDate: today };
}

function getSelectableMode(leaveType) {
  if (leaveType === "sick") return "sick";
  if (leaveType === "service_incentive") return "scheduled";
  if (leaveType === "maternity") return "any";
  return "scheduled";
}

function getDocumentPlaceholder(leaveType) {
  if (leaveType === "sick") return "Attach medical document";
  if (leaveType === "emergency") return "Attach proof document";
  if (["maternity", "paternity"].includes(leaveType)) return "Attach supporting document";
  if (leaveType === "service_incentive") return "Supporting document not required";
  return "Attach PDF or image";
}

const LeaveForm = ({ formData, leaveCredits, onChange, onSubmit, errorMessage, submitDisabled }) => {
  const [showLeavePicker, setShowLeavePicker] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showDeliveryPicker, setShowDeliveryPicker] = useState(false);
  const [showBirthPicker, setShowBirthPicker] = useState(false);
  const leaveCreditsByType = Object.fromEntries(
    (leaveCredits?.byType || []).map((item) => [item.leaveType, item]),
  );
  const startDateBounds = getStartDateBounds(formData);
  const todayDateKey = getTodayDateKey();
  const selectableMode = getSelectableMode(formData.leaveType);
  const requestedDates = formData.requestedDates || [];

  const updateRequestedDates = (dates) => {
    const sorted = [...new Set(dates)].sort();
    onChange("requestedDates", sorted);
    onChange("startDate", sorted[0] || "");
    onChange("endDate", sorted[sorted.length - 1] || "");
  };

  const toggleRequestedDate = (dateKey) => {
    const next = requestedDates.includes(dateKey)
      ? requestedDates.filter((date) => date !== dateKey)
      : [...requestedDates, dateKey];
    updateRequestedDates(next);
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset?.uri) return;

      onChange("supportingDocument", {
        uri: asset.uri,
        name: asset.name || "supporting-document",
        type: asset.mimeType || "application/octet-stream",
        size: asset.size || null,
      });
    } catch (error) {
      Alert.alert(
        "File Selection Failed",
        error?.message || "Could not attach the selected document.",
      );
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.todayRow}>
        <View>
          <Text style={styles.todayLabel}>Today&apos;s Date</Text>
          <Text style={styles.todayValue}>{formatLeaveDate(todayDateKey)}</Text>
        </View>
      </View>

      {formData.leaveType === "service_incentive" ? (
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>SIL Purpose</Text>
          <View style={styles.purposeRow}>
            {[
              { value: "standard", label: "Standard SIL" },
              { value: "sick_substitution", label: "Sick Substitute" },
            ].map((option) => {
              const active = formData.silPurpose === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.purposeButton, active && styles.purposeButtonActive]}
                  onPress={() => {
                    onChange("silPurpose", option.value);
                    updateRequestedDates([]);
                  }}
                >
                  <Text style={[styles.purposeText, active && styles.purposeTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Leave Type</Text>
        <TouchableOpacity
          style={styles.inputRow}
          onPress={() => setShowLeavePicker(true)}
          activeOpacity={0.75}
        >
          <FontAwesome5
            name="clipboard-list"
            size={13}
            color="#8A94A6"
            style={styles.icon}
          />
          <Text
            style={[
              styles.inputText,
              !formData.leaveType && styles.placeholder,
            ]}
          >
            {formData.leaveType
              ? LEAVE_TYPE_LABELS[formData.leaveType]
              : "Select Leave Type"}
          </Text>
          <Feather name="chevron-down" size={15} color="#8A94A6" />
        </TouchableOpacity>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>
          {formData.leaveType === "maternity" ? "Maternity Leave Start" : "Leave Dates"}
        </Text>
        <TouchableOpacity
          style={styles.inputRow}
          onPress={() => {
            if (!formData.leaveType) {
              Alert.alert("Select Leave Type", "Please choose a leave type first.");
              return;
            }
            if (formData.leaveType === "maternity" && !formData.deliveryDate) {
              Alert.alert("Delivery Date Required", "Please choose the expected delivery date first.");
              return;
            }
            if (formData.leaveType === "paternity" && !formData.childBirthDate) {
              Alert.alert("Birth Date Required", "Please choose the child birth date first.");
              return;
            }
            setShowStartPicker(true);
          }}
          activeOpacity={0.75}
        >
          <Feather
            name="calendar"
            size={14}
            color="#8A94A6"
            style={styles.icon}
          />
          <Text
            style={[
              styles.inputText,
              requestedDates.length === 0 && styles.placeholder,
            ]}
          >
            {requestedDates.length === 0
              ? "Select leave date(s)"
              : formData.leaveType === "maternity"
                ? `${formatLeaveDate(requestedDates[0])} - ${formatLeaveDate(requestedDates[requestedDates.length - 1])}`
                : `${requestedDates.length} date${requestedDates.length === 1 ? "" : "s"} selected`}
          </Text>
        </TouchableOpacity>
        {showStartPicker && (
          <ScheduledLeaveDatePicker
            visible={showStartPicker}
            title="Select Start Date"
            selectedDate={formData.startDate}
            selectedDates={requestedDates}
            minDate={startDateBounds.minDate}
            maxDate={startDateBounds.maxDate}
            selectableMode={
              formData.leaveType === "service_incentive"
                && formData.silPurpose === "sick_substitution"
                ? "sick"
                : selectableMode
            }
            multiple={formData.leaveType !== "maternity"}
            onSelect={(dateKey) => {
              if (formData.leaveType === "maternity") {
                updateRequestedDates(
                  getDateRange(dateKey, addDaysToDateKey(dateKey, 104)),
                );
              } else {
                toggleRequestedDate(dateKey);
              }
            }}
            onClose={() => setShowStartPicker(false)}
          />
        )}
      </View>

      {formData.leaveType === "maternity" ? (
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Expected Delivery Date</Text>
          <TouchableOpacity
            style={styles.inputRow}
            onPress={() => setShowDeliveryPicker(true)}
            activeOpacity={0.75}
          >
            <Feather name="calendar" size={14} color="#8A94A6" style={styles.icon} />
            <Text style={[styles.inputText, !formData.deliveryDate && styles.placeholder]}>
              {formatLeaveDate(formData.deliveryDate, "mm / dd / yyyy")}
            </Text>
          </TouchableOpacity>
          {showDeliveryPicker && (
            <ScheduledLeaveDatePicker
              visible={showDeliveryPicker}
              title="Select Delivery Date"
              selectedDate={formData.deliveryDate}
              selectableMode="any"
              onSelect={(dateKey) => {
                onChange("deliveryDate", dateKey);
                updateRequestedDates([]);
              }}
              onClose={() => setShowDeliveryPicker(false)}
            />
          )}
        </View>
      ) : null}

      {formData.leaveType === "paternity" ? (
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Child Birth Date</Text>
          <TouchableOpacity
            style={styles.inputRow}
            onPress={() => setShowBirthPicker(true)}
            activeOpacity={0.75}
          >
            <Feather name="calendar" size={14} color="#8A94A6" style={styles.icon} />
            <Text style={[styles.inputText, !formData.childBirthDate && styles.placeholder]}>
              {formatLeaveDate(formData.childBirthDate, "mm / dd / yyyy")}
            </Text>
          </TouchableOpacity>
          {showBirthPicker && (
            <ScheduledLeaveDatePicker
              visible={showBirthPicker}
              title="Select Birth Date"
              selectedDate={formData.childBirthDate}
              maxDate={todayDateKey}
              selectableMode="any"
              onSelect={(dateKey) => {
                onChange("childBirthDate", dateKey);
                updateRequestedDates([]);
              }}
              onClose={() => setShowBirthPicker(false)}
            />
          )}
        </View>
      ) : null}

      {errorMessage ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Reason</Text>
        <View style={[styles.inputRow, styles.activeInputRow, styles.textAreaRow]}>
          <Feather
            name="edit-2"
            size={14}
            color="#8A94A6"
            style={[styles.icon, { marginTop: 1 }]}
          />
          <TextInput
            style={styles.textArea}
            placeholder="Please describe the reason for your leave..."
            placeholderTextColor="#B0B8C9"
            value={formData.reason}
            onChangeText={(v) => onChange("reason", v)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Supporting Document</Text>
        <TouchableOpacity
          style={[styles.inputRow, styles.activeInputRow]}
          onPress={handlePickDocument}
          activeOpacity={0.75}
        >
          <Feather
            name="paperclip"
            size={14}
            color="#8A94A6"
            style={styles.icon}
          />
          <Text
            style={[
              styles.inputText,
              !formData.supportingDocument && styles.placeholder,
            ]}
            numberOfLines={1}
          >
            {formData.supportingDocument?.name || getDocumentPlaceholder(formData.leaveType)}
          </Text>
          {formData.supportingDocument ? (
            <Pressable
              style={styles.clearFileButton}
              onPress={(event) => {
                event.stopPropagation();
                onChange("supportingDocument", null);
              }}
            >
              <Feather name="x" size={15} color="#8A94A6" />
            </Pressable>
          ) : (
            <Feather name="upload" size={15} color="#8A94A6" />
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, submitDisabled && styles.submitBtnDisabled]}
        onPress={onSubmit}
        activeOpacity={0.85}
        disabled={submitDisabled}
      >
        <Text style={styles.submitText}>Submit Request</Text>
      </TouchableOpacity>

      <LeavePicker
        visible={showLeavePicker}
        selected={formData.leaveType}
        onSelect={(val) => {
          onChange("leaveType", val);
          onChange("silPurpose", "standard");
          onChange("requestedDates", []);
          onChange("startDate", "");
          onChange("endDate", "");
          onChange("deliveryDate", "");
          onChange("childBirthDate", "");
          setShowLeavePicker(false);
        }}
        onClose={() => setShowLeavePicker(false)}
        leaveCreditsByType={leaveCreditsByType}
      />
    </View>
  );
};

export default LeaveForm;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    gap: 18,
  },
  fieldGroup: {
    gap: 8,
  },
  purposeRow: {
    flexDirection: "row",
    gap: 8,
  },
  purposeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  purposeButtonActive: {
    borderColor: "#093269",
    backgroundColor: "#EEF2FA",
  },
  purposeText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
  },
  purposeTextActive: {
    color: "#093269",
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8A94A6",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8ECF2",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#FAFBFD",
  },
  activeInputRow: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CBD5E1",
  },
  textAreaRow: {
    alignItems: "flex-start",
  },
  icon: {
    marginRight: 10,
  },
  inputText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#1A2340",
  },
  placeholder: {
    color: "#B0B8C9",
    fontWeight: "400",
  },
  textArea: {
    flex: 1,
    fontSize: 14,
    color: "#1A2340",
    minHeight: 84,
    lineHeight: 21,
  },
  clearFileButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EEF1F6",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  submitBtn: {
    backgroundColor: "#E6B215",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
    shadowColor: "#E6B215",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 5,
  },
  submitBtnDisabled: {
    backgroundColor: "#CBD5E1",
    shadowColor: "transparent",
    elevation: 0,
  },
  errorContainer: {
    paddingHorizontal: 4,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "600",
  },
  todayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E8ECF2",
    marginBottom: 12,
  },
  todayLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8A94A6",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  todayValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A2340",
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
