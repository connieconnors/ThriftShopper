import { Camera } from "expo-camera";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BackHandler,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type {
  WebView as WebViewType,
  WebViewNavigation,
  WebViewOpenWindowEvent,
  WebViewPermissionRequestEvent,
} from "react-native-webview";
import { WebView } from "react-native-webview";

const DEFAULT_PRODUCTION_WEB_APP_URL = "https://app.thriftshopper.com";
const WEBVIEW_LOAD_TIMEOUT_MS = 20000;
const ALLOWED_PERMISSION_HOSTS = new Set(["app.thriftshopper.com"]);

const nativePlatformInjection = `
  window.__THRIFTSHOPPER_NATIVE_PLATFORM = ${JSON.stringify(Platform.OS)};
  true;
`;

function openExternalUrl(url: string) {
  void Linking.openURL(url).catch(() => undefined);
}

export default function App() {
  const webViewRef = useRef<WebViewType>(null);
  const candidateUrls = useMemo(() => {
    if (__DEV__) {
      const fromEnv = process.env.EXPO_PUBLIC_WEB_APP_URL?.trim().replace(/\/+$/, "");
      const baseHost = Platform.OS === "ios" ? "127.0.0.1" : "10.0.2.2";
      const localUrls = [3000, 3001, 3002].map((port) => `http://${baseHost}:${port}`);
      return fromEnv ? [fromEnv, ...localUrls.filter((url) => url !== fromEnv)] : localUrls;
    }
    return [DEFAULT_PRODUCTION_WEB_APP_URL];
  }, []);

  const [urlIndex, setUrlIndex] = useState(0);
  const [webViewKey, setWebViewKey] = useState(0);
  const [webViewLoading, setWebViewLoading] = useState(true);
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const [cameraReady, setCameraReady] = useState(Platform.OS === "web");
  const [canGoBack, setCanGoBack] = useState(false);
  const appUrl = candidateUrls[urlIndex]!;

  useEffect(() => {
    void (async () => {
      if (Platform.OS !== "ios" && Platform.OS !== "android") {
        setCameraReady(true);
        return;
      }
      await Camera.requestCameraPermissionsAsync();
      setCameraReady(true);
    })();
  }, []);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (webViewRef.current && canGoBack) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    });

    return () => subscription.remove();
  }, [canGoBack]);

  useEffect(() => {
    if (!webViewLoading) return;
    setLoadTimedOut(false);
    const timeoutId = setTimeout(() => setLoadTimedOut(true), WEBVIEW_LOAD_TIMEOUT_MS);
    return () => clearTimeout(timeoutId);
  }, [appUrl, webViewKey, webViewLoading]);

  const tryNextUrl = () => {
    setUrlIndex((prev) => (prev < candidateUrls.length - 1 ? prev + 1 : prev));
  };

  const retryCurrentUrl = useCallback(() => {
    setLoadTimedOut(false);
    setWebViewLoading(true);
    setWebViewKey((prev) => prev + 1);
  }, []);

  const onNavigationStateChange = useCallback((navigationState: WebViewNavigation) => {
    setCanGoBack(navigationState.canGoBack);
  }, []);

  const shouldStartLoad = useCallback((request: { url: string }) => {
    const url = request.url;

    if (url.startsWith("mailto:") || url.startsWith("tel:")) {
      openExternalUrl(url);
      return false;
    }

    if (url.startsWith("intent:")) {
      openExternalUrl(url);
      return false;
    }

    // Keep all http(s) navigation in the WebView — required for Stripe 3DS / bank auth redirects.
    return true;
  }, []);

  const onOpenWindow = useCallback((event: WebViewOpenWindowEvent) => {
    const targetUrl = event.nativeEvent.targetUrl;
    if (!targetUrl || !webViewRef.current) return;

    if (targetUrl.startsWith("mailto:") || targetUrl.startsWith("tel:")) {
      openExternalUrl(targetUrl);
      return;
    }

    webViewRef.current.injectJavaScript(
      `window.location.href = ${JSON.stringify(targetUrl)}; true;`
    );
  }, []);

  const onPermissionRequest = useCallback((event: WebViewPermissionRequestEvent) => {
    const { host, resources, grant, deny } = event.nativeEvent;
    if (!isAllowedPermissionHost(host)) {
      deny();
      return;
    }

    const allowedResources = resources.filter(
      (resource) => resource === "camera" || resource === "microphone"
    );

    if (allowedResources.length > 0) {
      grant(allowedResources);
      return;
    }

    deny();
  }, []);

  if (!cameraReady) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorWrap}>
          <Text style={styles.body}>Preparing camera permissions…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
      {loadTimedOut ? (
        <View style={styles.errorWrap}>
          <Text style={styles.title}>ThriftShopper is taking too long to load</Text>
          <Text style={styles.body}>
            Check your connection and try again. If the problem continues, visit app.thriftshopper.com
            in your browser.
          </Text>
          <Pressable style={styles.primaryButton} onPress={retryCurrentUrl}>
            <Text style={styles.primaryButtonText}>Try again</Text>
          </Pressable>
          <Pressable style={styles.badge}>
            <Text style={styles.badgeText}>{appUrl}</Text>
          </Pressable>
        </View>
      ) : (
        <WebView
          key={`${appUrl}-${webViewKey}`}
          ref={webViewRef}
          source={{ uri: appUrl }}
          originWhitelist={["https://*", "http://*"]}
          automaticallyAdjustContentInsets={false}
          contentInsetAdjustmentBehavior="never"
          injectedJavaScriptBeforeContentLoaded={nativePlatformInjection}
          startInLoadingState
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled={Platform.OS === "android"}
          allowFileAccess
          allowFileAccessFromFileURLs
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
          setSupportMultipleWindows
          inheritAppPermissions
          mediaCapturePermissionGrantType="grant"
          onPermissionRequest={onPermissionRequest}
          onNavigationStateChange={onNavigationStateChange}
          onOpenWindow={onOpenWindow}
          onLoadStart={() => {
            setWebViewLoading(true);
            setLoadTimedOut(false);
          }}
          onLoadEnd={() => {
            setWebViewLoading(false);
            setLoadTimedOut(false);
          }}
          onShouldStartLoadWithRequest={shouldStartLoad}
          onHttpError={tryNextUrl}
          onError={tryNextUrl}
          renderError={() => (
            <View style={styles.errorWrap}>
              <Text style={styles.title}>ThriftShopper Web App Not Reachable</Text>
              <Text style={styles.body}>
                Check your connection and try again. If the problem continues, visit
                app.thriftshopper.com in your browser.
              </Text>
              <Pressable style={styles.primaryButton} onPress={retryCurrentUrl}>
                <Text style={styles.primaryButtonText}>Try again</Text>
              </Pressable>
              <Pressable style={styles.badge}>
                <Text style={styles.badgeText}>{appUrl}</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#ede9e1",
  },
  errorWrap: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ede9e1",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    color: "#16193a",
  },
  body: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    color: "#374151",
  },
  primaryButton: {
    marginTop: 18,
    borderRadius: 999,
    backgroundColor: "#16193a",
    paddingHorizontal: 22,
    paddingVertical: 11,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  badge: {
    marginTop: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  badgeText: {
    fontSize: 12,
    color: "#475569",
  },
});
