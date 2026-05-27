import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop, Line, Text as SvgText } from "react-native-svg";
import { useColors } from "@/hooks/useColors";

interface Props {
  data: number[];
  color: string;
  label: string;
  unit: string;
  minVal: number;
  maxVal: number;
  height?: number;
  width: number;
  currentValue?: number;
}

export default function RealtimeChart({ data, color, label, unit, minVal, maxVal, height = 120, width, currentValue }: Props) {
  const colors = useColors();
  const pts = Math.min(data.length, 60);
  const slice = data.slice(-pts);

  const { linePath, fillPath } = useMemo(() => {
    if (slice.length < 2) return { linePath: "", fillPath: "" };
    const W = width - 8;
    const H = height - 24;
    const range = maxVal - minVal || 1;

    const points = slice.map((v, i) => ({
      x: 4 + (i / (Math.max(slice.length - 1, 1))) * W,
      y: 4 + H - ((v - minVal) / range) * H,
    }));

    let line = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const cp1x = points[i - 1].x + (points[i].x - points[i - 1].x) * 0.4;
      const cp1y = points[i - 1].y;
      const cp2x = points[i].x - (points[i].x - points[i - 1].x) * 0.4;
      const cp2y = points[i].y;
      line += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${points[i].x} ${points[i].y}`;
    }

    const fill =
      line +
      ` L ${points[points.length - 1].x} ${H + 4} L ${points[0].x} ${H + 4} Z`;

    return { linePath: line, fillPath: fill };
  }, [slice, width, height, minVal, maxVal]);

  const gradId = `grad_${label.replace(/\s/g, "")}`;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.value, { color }]}>
          {currentValue !== undefined ? currentValue : slice[slice.length - 1] ?? "--"} <Text style={[styles.unit, { color: colors.mutedForeground }]}>{unit}</Text>
        </Text>
      </View>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0.35} />
            <Stop offset="1" stopColor={color} stopOpacity={0.02} />
          </LinearGradient>
        </Defs>
        <Line x1={4} y1={height - 20} x2={width - 4} y2={height - 20} stroke={colors.border} strokeWidth={1} />
        {fillPath ? <Path d={fillPath} fill={`url(#${gradId})`} /> : null}
        {linePath ? <Path d={linePath} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
        <SvgText x={4} y={height - 6} fontSize={10} fill={colors.mutedForeground}>{minVal}</SvgText>
        <SvgText x={width - 28} y={height - 6} fontSize={10} fill={colors.mutedForeground}>{maxVal}</SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  value: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  unit: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
