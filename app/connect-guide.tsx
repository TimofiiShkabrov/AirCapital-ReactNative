import React, { useState } from "react";
import { Linking, ScrollView, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  Card,
  Heading,
  IconButton,
  Label,
  Picker,
  s,
} from "../src/components/monitor/primitives";
import { useMonitorTheme } from "../src/components/monitor/theme";
import { ALL_EXCHANGES, type Exchange } from "../src/types/common";
import { EXCHANGE_CONFIG } from "../src/constants/exchanges";
import { CONNECTION_GUIDES } from "../src/domain/connectionGuides";
import { COVERAGE_KEYS } from "../src/domain/exchangeCoverage";

export default function ConnectionGuideScreen() {
  const { t } = useTranslation(),
    c = useMonitorTheme(),
    router = useRouter();
  const params = useLocalSearchParams<{ exchange?: string }>();
  const [exchange, setExchange] = useState<Exchange>(
    ALL_EXCHANGES.includes(params.exchange as Exchange)
      ? (params.exchange as Exchange)
      : "binance",
  );
  const [linkError, setLinkError] = useState(false);
  const guide = CONNECTION_GUIDES[exchange];
  const name = EXCHANGE_CONFIG[exchange].label;
  const officialLink = (url: string, label: string) => (
    <Pressable
      key={url}
      accessibilityRole="link"
      accessibilityLabel={`${label} · ${new URL(url).hostname}`}
      onPress={() => {
        setLinkError(false);
        void Linking.openURL(url).catch(() => setLinkError(true));
      }}
      style={({ pressed }) => ({
        padding: 14,
        borderRadius: 12,
        backgroundColor: c.tint,
        gap: 5,
        opacity: pressed ? 0.65 : 1,
      })}
    >
      <Text
        style={{
          color: c.accent,
          fontWeight: "600",
          textAlign: c.rtl ? "right" : "left",
        }}
      >
        {label} ↗
      </Text>
      <Label>{new URL(url).hostname}</Label>
    </Pressable>
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View
        style={[
          s.row,
          { paddingHorizontal: 20, paddingVertical: 8 },
          c.rtl && { flexDirection: "row-reverse" },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Heading>{t("monitor.connectionHelp")}</Heading>
        </View>
        <IconButton
          label={t("monitor.close")}
          icon="close-outline"
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/settings")
          }
        />
      </View>
      <ScrollView contentContainerStyle={s.page}>
        <Picker
          label={t("monitor.exchanges")}
          value={exchange}
          choices={ALL_EXCHANGES.map((e) => ({
            value: e,
            label: EXCHANGE_CONFIG[e].label,
          }))}
          onChange={(v) => {
            setExchange(v as Exchange);
            setLinkError(false);
          }}
        />
        <Card>
          <Heading>{t("monitor.officialSource", { exchange: name })}</Heading>
          <Label>{t("monitor.guideIntro")}</Label>
          {officialLink(
            guide.url,
            t(
              guide.kind === "article"
                ? "monitor.officialGuide"
                : "monitor.apiManagement",
            ),
          )}
          {guide.docs &&
            officialLink(guide.docs, t("monitor.apiDocumentation"))}
          {linkError && (
            <Text accessibilityRole="alert" style={{ color: c.negative }}>
              {t("monitor.linkOpenError")}
            </Text>
          )}
        </Card>
        <Card>
          <Heading>{t("monitor.createForAirCapital")}</Heading>
          <Label>{t(`monitor.creation_${exchange}`)}</Label>
          <Label>{t(`monitor.guide_${exchange}`)}</Label>
          <Label>{t("monitor.guideIP")}</Label>
        </Card>
        <Card>
          <Heading>{t("monitor.finishConnection")}</Heading>
          {[
            "guideStep1",
            "guideStep2",
            ...(exchange === "okx" ? ["guideStepPassphrase"] : []),
            "guideStep3",
            "guideStep4",
          ].map((key, i) => (
            <View
              key={key}
              style={[
                {
                  flexDirection: c.rtl ? "row-reverse" : "row",
                  gap: 12,
                  alignItems: "flex-start",
                },
              ]}
            >
              <Text
                style={{ color: c.accent, fontWeight: "700", fontSize: 16 }}
              >
                {i + 1}.
              </Text>
              <View style={{ flex: 1 }}>
                <Label>{t(`monitor.${key}`, { exchange: name })}</Label>
              </View>
            </View>
          ))}
          <Label>{t("monitor.guideSecrets")}</Label>
        </Card>
        <Card>
          <Heading>{t("monitor.coverageTitle")}</Heading>
          <Label>{t(`monitor.${COVERAGE_KEYS[exchange]}`)}</Label>
        </Card>
        <Card>
          <Heading>{t("monitor.connectionTrouble")}</Heading>
          <Label>{t("monitor.guideTrouble")}</Label>
          <Label>{t("monitor.keyHelp")}</Label>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
