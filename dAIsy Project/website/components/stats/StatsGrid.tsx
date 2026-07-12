import StatCounter from "./StatCounter";
import { RESEARCH_CONTENT } from "@/lib/content";

export default function StatsGrid() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {RESEARCH_CONTENT.stats.map((stat, i) => (
        <StatCounter
          key={i}
          value={stat.value}
          suffix={stat.suffix}
          label={stat.label}
          source={stat.source}
        />
      ))}
    </div>
  );
}
