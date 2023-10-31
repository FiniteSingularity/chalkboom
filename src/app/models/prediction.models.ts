export interface PredictionWagersWager {
  user_name: string;
  channel_points_used: number;
}

export interface PredictionWagersOutcome {
  title: string;
  users: number;
  channel_points: number;
  top_predictors: PredictionWagersWager[];
}

export interface PredictionWagers {
  outcomes: PredictionWagersOutcome[];
}
