// components/profile/DocumentViewer.jsx
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

const { width: SW, height: SH } = Dimensions.get("window");

const isPdf = (url) =>
  typeof url === "string" &&
  (url.toLowerCase().includes(".pdf") ||
   /cloudinary\.com\/.+\/raw\/upload\//i.test(url));

export default function DocumentViewer({ visible, uri, onClose }) {
  const scale   = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    if (visible) {
      scale.setValue(0.85);
      opacity.setValue(0);
      setError(false);
      setLoading(true);

      Animated.parallel([
        Animated.spring(scale,   { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
        Animated.timing(opacity, { toValue: 1, useNativeDriver: true, duration: 200 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scale,   { toValue: 0.85, useNativeDriver: true, duration: 150 }),
        Animated.timing(opacity, { toValue: 0,    useNativeDriver: true, duration: 150 }),
      ]).start();
    }
  }, [visible]);

  // Google Docs viewer renders PDFs without any native PDF lib
  const pdfViewerUrl = uri
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(uri)}&embedded=true`
    : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      {/* Content */}
      <Animated.View style={[styles.container, { opacity, transform: [{ scale }] }]}>

        {isPdf(uri) ? (
          // ── PDF via Google Docs viewer ──
          <WebView
            source={{ uri: pdfViewerUrl }}
            style={styles.webview}
            onLoadStart={() => { setLoading(true);  setError(false); }}
            onLoadEnd={()   => setLoading(false)}
            onError={()     => { setLoading(false); setError(true);  }}
            scalesPageToFit
            javaScriptEnabled
          />
        ) : (
          // ── Image ──
          <Image
            source={{ uri }}
            style={styles.image}
            resizeMode="contain"
            onLoadStart={() => { setLoading(true);  setError(false); }}
            onLoadEnd={()   => setLoading(false)}
            onError={()     => { setLoading(false); setError(true);  }}
          />
        )}

        {/* Loading spinner */}
        {loading && !error && (
          <ActivityIndicator
            color="#fff"
            size="large"
            style={StyleSheet.absoluteFill}
          />
        )}

        {/* Error state */}
        {error && (
          <View style={styles.errorWrap}>
            <Ionicons name="document-outline" size={48} color="rgba(255,255,255,0.4)" />
            <Text style={styles.errorText}>
              Could not load document.{"\n"}Check your connection and try again.
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Close button — always on top */}
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={onClose}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close" size={22} color="#fff" />
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.88)",
  },
  container: {
    position:        "absolute",
    top:             SH * 0.08,
    left:            SW * 0.04,
    width:           SW * 0.92,
    height:          SH * 0.76,
    borderRadius:    12,
    overflow:        "hidden",
    backgroundColor: "#1a1a1a",
  },
  webview: {
    flex:            1,
    backgroundColor: "#1a1a1a",
  },
  image: {
    width:  "100%",
    height: "100%",
  },
  errorWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems:     "center",
    justifyContent: "center",
    gap:            12,
  },
  errorText: {
    color:     "rgba(255,255,255,0.5)",
    fontSize:  14,
    textAlign: "center",
    lineHeight: 22,
  },
  closeBtn: {
    position:        "absolute",
    top:             52,
    right:           20,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius:    20,
    width:           40,
    height:          40,
    alignItems:      "center",
    justifyContent:  "center",
  },
});