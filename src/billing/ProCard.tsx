import React from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { Action, Card, Heading, Label } from "../components/monitor/primitives";
export function ProCard() {
  const { t } = useTranslation(), router = useRouter();
  return <Card>
    <Heading>AirCapital Pro</Heading>
    <Label>{t("monitor.proRequired")}</Label>
    <Action label={t("monitor.billingPlans")} onPress={() => router.push("/subscription")} />
  </Card>;
}
