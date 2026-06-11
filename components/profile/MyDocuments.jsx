// components/profile/MyDocuments.jsx
import documentsService from "@/services/documentsService";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DocumentViewer from "./DocumentViewer";

const NAVY = "#0d2550";
const GOLD = "#c9a84c";

const STATUS_CONFIG = {
  active:   { bg: "#e8f5e9", color: "#2e7d32", label: "Active",   icon: "checkmark-circle" },
  expiring: { bg: "#fff8e1", color: "#f57f17", label: "Expiring", icon: "warning"          },
  expired:  { bg: "#ffebee", color: "#c62828", label: "Expired",  icon: "close-circle"     },
};

// Returns true if the URL can be opened in DocumentViewer (images or PDFs)
const isViewable = (url) => {
  if (!url || typeof url !== "string") return false;
  return (
    /\.(jpg|jpeg|png|gif|webp|pdf)(\?.*)?$/i.test(url) ||
    /cloudinary\.com\/.+\/(image|raw)\/upload\//i.test(url)
  );
};

function DocItem({ icon, name, meta, status, onPress }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.active;
  return (
    <TouchableOpacity style={styles.docRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.docIconWrap}>
        <FontAwesome5 name={icon} size={14} color={GOLD} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.docName}>{name}</Text>
        <Text style={styles.docMeta}>{meta}</Text>
      </View>
      <View style={[styles.docBadge, { backgroundColor: s.bg }]}>
        <Ionicons name={s.icon} size={10} color={s.color} />
        <Text style={[styles.docBadgeText, { color: s.color }]}>{s.label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color="#ccc" style={{ marginLeft: 6 }} />
    </TouchableOpacity>
  );
}

export default function MyDocuments({ onDocPress }) {
  const [documents,   setDocuments]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [viewerUri,   setViewerUri]   = useState(null);
  const [expanded,    setExpanded]    = useState(false);

  useEffect(() => {
    documentsService
      .getDocuments()
      .then(setDocuments)
      .catch((err) => console.warn("Failed to load documents:", err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDocPress = (doc) => {
    if (isViewable(doc.document_url)) {
      setViewerUri(doc.document_url);
      return;
    }
    onDocPress?.(doc);
  };

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.titleText}>My Documents</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{documents.length} Files</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={NAVY} style={{ paddingVertical: 20 }} />
      ) : documents.length === 0 ? (
        <Text style={styles.emptyText}>No documents found.</Text>
      ) : expanded ? (
        <>
          {documents.map((doc, i) => (
          <React.Fragment key={doc.id}>
            {i > 0 && <View style={styles.divider} />}
            <DocItem {...doc} onPress={() => handleDocPress(doc)} />
          </React.Fragment>
          ))}
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setExpanded(false)}
            activeOpacity={0.75}
          >
            <Ionicons name="chevron-up" size={15} color={NAVY} />
            <Text style={styles.toggleText}>Hide Documents</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setExpanded(true)}
          activeOpacity={0.75}
        >
          <Ionicons name="documents-outline" size={15} color={NAVY} />
          <Text style={styles.toggleText}>See All Documents</Text>
        </TouchableOpacity>
      )}

      <DocumentViewer
        visible={Boolean(viewerUri)}
        uri={viewerUri}
        onClose={() => setViewerUri(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor:  "#fff",
    marginHorizontal: 16,
    marginBottom:     12,
    borderRadius:     14,
    paddingHorizontal: 16,
    paddingVertical:  14,
    shadowColor:      "#000",
    shadowOffset:     { width: 0, height: 2 },
    shadowOpacity:    0.06,
    shadowRadius:     8,
    elevation:        3,
  },
  titleRow: {
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "space-between",
    marginBottom:   14,
  },
  titleText:  { fontSize: 13, fontWeight: "700", color: NAVY, letterSpacing: 0.3 },
  countBadge: { backgroundColor: "#f0f4ff", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  countText:  { fontSize: 11, color: NAVY, fontWeight: "600" },
  divider:    { height: 1, backgroundColor: "#f0f0f0", marginVertical: 2 },
  emptyText:  { color: "#999", fontSize: 12, textAlign: "center", paddingVertical: 20 },
  toggleButton: {
    borderWidth: 1,
    borderColor: "#dbe4f3",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#f8fbff",
  },
  toggleText: {
    color: NAVY,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  docRow:     { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  docIconWrap: {
    width:           34,
    height:          34,
    borderRadius:    8,
    backgroundColor: "#1a3a6b",
    alignItems:      "center",
    justifyContent:  "center",
    marginRight:     12,
  },
  docName:        { fontSize: 13, fontWeight: "600", color: NAVY },
  docMeta:        { fontSize: 10, color: "#999", marginTop: 2 },
  docBadge:       { flexDirection: "row", alignItems: "center", borderRadius: 20, paddingHorizontal: 7, paddingVertical: 3, gap: 3 },
  docBadgeText:   { fontSize: 10, fontWeight: "600" },
});
