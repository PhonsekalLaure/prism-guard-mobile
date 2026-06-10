import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import ScreenWrapper from "@/components/dashboard/ScreenWrapper";
import {
  PrismColors,
  PrismRadius,
  PrismShadows,
  PrismSpacing,
  PrismTypography,
} from "@/constants/prismTheme";
import incidentService from "@/services/incidentService";

const titleCase = (value) =>
  String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

function formatDateTime(value) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function ThreadMessage({ message }) {
  const isGuard = message.sender_role === "guard";

  return (
    <View style={[styles.threadMessage, isGuard ? styles.threadGuard : styles.threadAdmin]}>
      <View style={styles.threadHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{message.sender_initials || "PG"}</Text>
        </View>
        <View style={styles.threadMeta}>
          <Text style={styles.threadName}>{message.sender_name || "Unknown User"}</Text>
          <Text style={styles.threadRole}>
            {message.sender_label || (isGuard ? "Security Guard" : "HRIS Admin")} | {message.date || formatDateTime(message.created_at)}
          </Text>
        </View>
      </View>
      <Text style={styles.threadText}>{message.message}</Text>
    </View>
  );
}

export default function IncidentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef(null);

  const loadIncident = useCallback(async ({ quiet = false } = {}) => {
    if (!id) return;
    try {
      if (!quiet) setLoading(true);
      setError(null);
      const detail = await incidentService.fetchIncidentReportById(id);
      setIncident(detail);
    } catch (err) {
      setError(err.message || "Unable to load incident report.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    loadIncident();
  }, [loadIncident]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadIncident({ quiet: true });
  };

  const handleSendMessage = async () => {
    if (sending) return;
    const cleanMessage = messageText.trim();
    if (!cleanMessage) {
      Alert.alert("Message Required", "Please enter a message before sending.");
      return;
    }

    try {
      setSending(true);
      await incidentService.sendIncidentMessage(id, cleanMessage);
      setMessageText("");
      await loadIncident({ quiet: true });
    } catch (err) {
      Alert.alert("Message Failed", err.message || "Unable to send message.");
    } finally {
      setSending(false);
    }
  };

  const messages = incident?.messages || [];
  const threadClosed = incident?.status === "resolved";
  const handleReplyFocus = () => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <ScreenWrapper activeTabKey="report">
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={22} color={PrismColors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Incident Details</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.headerBtn} disabled={loading}>
          <Ionicons name="refresh" size={19} color={PrismColors.white} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={PrismColors.navy} />
        </View>
      ) : error ? (
        <View style={styles.loadingState}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.keyboardArea}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={(
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={PrismColors.navy} />
            )}
          >
            <View style={styles.summaryCard}>
              <View style={styles.summaryTop}>
                <View style={styles.reportIcon}>
                  <Ionicons name="document-text-outline" size={22} color={PrismColors.navy} />
                </View>
                <View style={styles.summaryCopy}>
                  <Text style={styles.reportId}>{incident.reportId || `INC-${String(incident.id || "").slice(0, 8).toUpperCase()}`}</Text>
                  <Text style={styles.title}>{incident.title || "Incident report"}</Text>
                </View>
              </View>
              <View style={styles.badgeRow}>
                <Text style={styles.badge}>{titleCase(incident.reviewStatus || incident.status)}</Text>
                <Text style={styles.badge}>{titleCase(incident.severity || "medium")}</Text>
              </View>
              <Text style={styles.meta}>{incident.siteName || "Unknown site"}</Text>
              <Text style={styles.meta}>Submitted {formatDateTime(incident.submittedAt || incident.createdAt)}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Original Report</Text>
              <Text style={styles.bodyText}>{incident.rawText || "No original report available."}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Status Summary</Text>
              <Text style={styles.bodyText}>{incident.summary || "Report submitted for operations review."}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Conversation</Text>
              {messages.length === 0 ? (
                <Text style={styles.emptyText}>No messages yet.</Text>
              ) : (
                messages.map((message) => <ThreadMessage key={message.id} message={message} />)
              )}

              {threadClosed ? (
                <Text style={styles.closedText}>This thread is closed because the incident is resolved.</Text>
              ) : (
                <View style={styles.replyBox}>
                  <TextInput
                    style={styles.replyInput}
                    value={messageText}
                    onChangeText={setMessageText}
                    onFocus={handleReplyFocus}
                    placeholder="Write a reply to Operations..."
                    placeholderTextColor={PrismColors.textSecondary}
                    multiline
                    editable={!sending}
                  />
                  <TouchableOpacity
                    style={[styles.sendButton, sending && styles.sendButtonDisabled]}
                    onPress={handleSendMessage}
                    disabled={sending}
                    activeOpacity={0.86}
                  >
                    <Text style={styles.sendText}>{sending ? "Sending..." : "Send Message"}</Text>
                    <Ionicons name="send" size={16} color={PrismColors.navy} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: PrismColors.navy,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 16,
    paddingTop: 14,
    paddingHorizontal: PrismSpacing.md,
    ...PrismShadows.card,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: PrismTypography.bold,
    color: PrismColors.white,
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: PrismSpacing.lg,
  },
  errorText: {
    color: PrismColors.danger,
    fontSize: PrismTypography.base,
    textAlign: "center",
  },
  keyboardArea: {
    flex: 1,
  },
  body: {
    padding: PrismSpacing.md,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: PrismColors.cardBg,
    borderRadius: PrismRadius.lg,
    padding: PrismSpacing.base,
    marginBottom: PrismSpacing.md,
    ...PrismShadows.card,
  },
  summaryTop: {
    flexDirection: "row",
    gap: PrismSpacing.md,
    alignItems: "center",
  },
  reportIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PrismColors.goldDim,
  },
  summaryCopy: {
    flex: 1,
  },
  reportId: {
    fontSize: PrismTypography.xs,
    color: PrismColors.textSecondary,
    fontWeight: PrismTypography.bold,
  },
  title: {
    marginTop: 2,
    fontSize: PrismTypography.lg,
    color: PrismColors.navy,
    fontWeight: PrismTypography.bold,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: PrismSpacing.sm,
    marginTop: PrismSpacing.md,
  },
  badge: {
    backgroundColor: PrismColors.goldDim,
    color: PrismColors.navy,
    fontSize: PrismTypography.xs,
    fontWeight: PrismTypography.bold,
    paddingHorizontal: PrismSpacing.sm,
    paddingVertical: 4,
    borderRadius: PrismRadius.full,
    overflow: "hidden",
  },
  meta: {
    marginTop: PrismSpacing.xs,
    color: PrismColors.textSecondary,
    fontSize: PrismTypography.sm,
  },
  card: {
    backgroundColor: PrismColors.cardBg,
    borderRadius: PrismRadius.lg,
    padding: PrismSpacing.base,
    marginBottom: PrismSpacing.md,
    ...PrismShadows.card,
  },
  sectionTitle: {
    color: PrismColors.navy,
    fontSize: PrismTypography.base,
    fontWeight: PrismTypography.bold,
    marginBottom: PrismSpacing.sm,
  },
  bodyText: {
    color: PrismColors.textPrimary,
    fontSize: PrismTypography.base,
    lineHeight: 21,
  },
  emptyText: {
    color: PrismColors.textSecondary,
    fontSize: PrismTypography.sm,
  },
  threadMessage: {
    borderRadius: PrismRadius.md,
    padding: PrismSpacing.md,
    marginBottom: PrismSpacing.sm,
    borderWidth: 1,
  },
  threadGuard: {
    backgroundColor: "#F7FAFF",
    borderColor: "#D9E6FF",
  },
  threadAdmin: {
    backgroundColor: "#FFF9E8",
    borderColor: "#F3D675",
  },
  threadHeader: {
    flexDirection: "row",
    gap: PrismSpacing.sm,
    alignItems: "center",
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: PrismColors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: PrismColors.white,
    fontSize: PrismTypography.xs,
    fontWeight: PrismTypography.bold,
  },
  threadMeta: {
    flex: 1,
  },
  threadName: {
    color: PrismColors.textPrimary,
    fontSize: PrismTypography.sm,
    fontWeight: PrismTypography.bold,
  },
  threadRole: {
    color: PrismColors.textSecondary,
    fontSize: PrismTypography.xs,
    marginTop: 2,
  },
  threadText: {
    color: PrismColors.textPrimary,
    fontSize: PrismTypography.base,
    lineHeight: 20,
    marginTop: PrismSpacing.sm,
  },
  replyBox: {
    borderTopWidth: 1,
    borderTopColor: PrismColors.border,
    marginTop: PrismSpacing.sm,
    paddingTop: PrismSpacing.md,
  },
  closedText: {
    color: PrismColors.textSecondary,
    fontSize: PrismTypography.sm,
    lineHeight: 18,
    marginTop: PrismSpacing.sm,
  },
  replyInput: {
    minHeight: 92,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: PrismColors.border,
    borderRadius: PrismRadius.md,
    padding: PrismSpacing.md,
    color: PrismColors.textPrimary,
    fontSize: PrismTypography.base,
    backgroundColor: PrismColors.offWhite,
  },
  sendButton: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: PrismSpacing.sm,
    marginTop: PrismSpacing.sm,
    backgroundColor: PrismColors.gold,
    borderRadius: PrismRadius.md,
    paddingHorizontal: PrismSpacing.base,
    paddingVertical: PrismSpacing.md,
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendText: {
    color: PrismColors.navy,
    fontSize: PrismTypography.sm,
    fontWeight: PrismTypography.bold,
  },
});
