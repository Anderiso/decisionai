export type GuidanceStyle = 'friend' | 'advisor' | 'either';

export type DecisionFocus = 'everyday' | 'relationships' | 'career_money' | 'big_life';

export interface ProfileRow {
  id: string;
  display_name: string | null;
  guidance_style: GuidanceStyle | null;
  decision_focus: DecisionFocus | null;
  onboarding_completed_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileInput {
  display_name: string;
  guidance_style: GuidanceStyle;
  decision_focus: DecisionFocus;
}
