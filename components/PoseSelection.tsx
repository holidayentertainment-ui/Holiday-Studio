'use client';

interface Pose {
  id: string;
  label: string;
  description: string;
  detail: string;
  icon: string;
  gradient: string;
}

const POSES: Pose[] = [
  {
    id: 'female',
    label: 'Female',
    description: 'Elegant editorial posing',
    detail:
      'Graceful posture, refined hand placement, soft feminine confidence inspired by Vogue editorial direction.',
    icon: '💃',
    gradient: 'linear-gradient(135deg, rgba(236,72,153,0.12), rgba(168,85,247,0.08))',
  },
  {
    id: 'male',
    label: 'Male',
    description: 'Structured, confident posing',
    detail:
      'Strong GQ-inspired stance, powerful shoulder framing, sophisticated presence with masculine editorial energy.',
    icon: '🕴️',
    gradient: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(99,102,241,0.08))',
  },
  {
    id: 'non_binary',
    label: 'Non-Binary',
    description: 'Balanced modern pose language',
    detail:
      'Fluid blend of feminine and masculine editorial cues with a contemporary, boundary-breaking visual identity.',
    icon: '✦',
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(99,102,241,0.08))',
  },
];

interface PoseSelectionProps {
  selectedPose: string;
  onPoseSelect: (id: string) => void;
}

export default function PoseSelection({ selectedPose, onPoseSelect }: PoseSelectionProps) {
  return (
    <section className="max-w-7xl mx-auto px-6 pb-4">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
        >
          3
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Choose Pose Direction</h2>
          <p className="text-sm text-[#8888a0] mt-0.5">
            AI will apply editorial posing logic based on your selection
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-5">
        {POSES.map((pose) => {
          const isSelected = selectedPose === pose.id;
          return (
            <button
              key={pose.id}
              onClick={() => onPoseSelect(pose.id)}
              className="text-left rounded-3xl p-6 border transition-all duration-200 relative overflow-hidden group"
              style={{
                background: isSelected
                  ? 'rgba(99,102,241,0.08)'
                  : 'rgba(255,255,255,0.02)',
                borderColor: isSelected
                  ? 'rgba(99,102,241,0.45)'
                  : 'rgba(255,255,255,0.07)',
                boxShadow: isSelected
                  ? '0 0 0 1px rgba(99,102,241,0.2), 0 8px 24px rgba(99,102,241,0.08)'
                  : undefined,
              }}
            >
              {/* Background gradient art */}
              <div
                className="absolute inset-0 opacity-60 transition-opacity duration-300 group-hover:opacity-100"
                style={{ background: pose.gradient }}
              />

              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">{pose.icon}</span>
                  {isSelected && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(99,102,241,0.9)' }}
                    >
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                        <path
                          d="M2 5.5l2.5 2.5L9 3"
                          stroke="white"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                <h3 className="font-bold text-lg tracking-tight">{pose.label}</h3>
                <p
                  className="text-sm font-medium mt-0.5"
                  style={{ color: isSelected ? 'rgba(165,180,252,0.9)' : 'rgba(255,255,255,0.5)' }}
                >
                  {pose.description}
                </p>
                <p className="text-xs text-[#8888a0] mt-3 leading-relaxed">{pose.detail}</p>

                {/* Selection indicator bar */}
                <div
                  className="mt-5 h-0.5 rounded-full transition-all duration-300"
                  style={{
                    background: isSelected
                      ? 'linear-gradient(90deg, rgba(99,102,241,0.8), rgba(139,92,246,0.8))'
                      : 'rgba(255,255,255,0.07)',
                    width: isSelected ? '100%' : '40%',
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
