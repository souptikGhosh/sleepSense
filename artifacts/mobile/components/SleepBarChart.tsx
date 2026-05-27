import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
import { useColors } from "@/hooks/useColors";
import { DailyStats } from "@/context/SessionContext";

interface Props {
  data: DailyStats[];
  width?: number;
}

export default function SleepBarChart({ data, width: propWidth }: Props) {
  const colors = useColors();
  const screenWidth = Dimensions.get("window").width;
  const W = propWidth ?? screenWidth - 48;
  const H = 120;
  const padding = { left: 8, right: 8, top: 10, bottom: 24 };
  const chartH = H - padding.top - padding.bottom;
  const barAreaW = W - padding.left - padding.right;
  const barCount = data.length;
  const barSpacing = 4;
  const barW = (barAreaW - (barCount - 1) * barSpacing) / barCount;

  const maxTotal = Math.max(...data.map((d) => d.rem + d.nonRem), 1);

  return (
    <View>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendLabel, { color: colors.mutedForeground }]}>REM</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.secondary }]} />
          <Text style={[styles.legendLabel, { color: colors.mutedForeground }]}>Non-REM</Text>
        </View>
      </View>
      <Svg width={W} height={H}>
        {data.map((d, i) => {
          const x = padding.left + i * (barW + barSpacing);
          const totalH = ((d.rem + d.nonRem) / maxTotal) * chartH;
          const remH = (d.rem / (d.rem + d.nonRem || 1)) * totalH;
          const nonRemH = totalH - remH;
          const y = padding.top + chartH - totalH;

          return (
            <React.Fragment key={d.label}>
              <Rect x={x} y={y} width={barW} height={nonRemH} rx={3} fill={`${colors.primary}40`} />
              <Rect x={x} y={y + nonRemH} width={barW} height={remH} rx={3} fill={colors.primary} />
              <SvgText
                x={x + barW / 2}
                y={H - 4}
                textAnchor="middle"
                fontSize={10}
                fill={colors.mutedForeground}
                fontFamily="Inter_400Regular"
              >
                {d.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  legendRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
