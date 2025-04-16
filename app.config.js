export default {
  expo: {
    name: "Jungle Squad Academy",
    slug: "jungle-squad",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "jungle-squad",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#0A0A0A"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.junglesquad.academy"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#0A0A0A"
      },
      package: "com.junglesquad.academy"
    },
    web: {
      bundler: "metro",
      output: "server",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router"
    ],
    experiments: {
      typedRoutes: true,
      tsconfigPaths: true
    },
    extra: {
      router: {
        origin: "https://academy.junglesquad.com"
      },
      eas: {
        projectId: "vaswavxammksguwnpwdr" // Ensure this is the correct EAS project ID
      }
    }
  }
};