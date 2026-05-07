"use client";

interface ComplianceScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export default function ComplianceScore({
  score,
  size = "md",
}: ComplianceScoreProps) {
  const sizes = {
    sm: { width: 80, stroke: 6, font: "text-lg" },
    md: { width: 120, stroke: 8, font: "text-3xl" },
    lg: { width: 160, stroke: 10, font: "text-4xl" },
  };

  const { width, stroke, font } = sizes[size];
  const radius = (width - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 80
      ? "#10B981"
      : score >= 60
      ? "#EAB308"
      : score >= 40
      ? "#F97316"
      : "#EF4444";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={width} height={width} className="-rotate-90">
        <circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={stroke}
        />
        <circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <span
        className={`absolute ${font} font-bold`}
        style={{ color }}
      >
        {score}
      </span>
    </div>
  );
}
