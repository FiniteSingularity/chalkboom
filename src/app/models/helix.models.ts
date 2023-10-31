export interface CreatePredictionPayload {
  broadcaster_id: string;
  title: string;
  outcomes: { title: string }[];
  prediction_window: number;
}

export interface PredictionPredictor {
  user_id: string;
  user_name: string;
  user_login: string;
  channel_points_used: number;
  channel_points_won: number;
}

export interface PredictionOutcome {
  id: string;
  title: string;
  users: number;
  channel_points: number;
  top_predictors: PredictionPredictor[] | null;
  color: 'BLUE' | 'PINK';
}

export interface PredictionData {
  id: string;
  broadcaster_id: string;
  broadcaster_name: string;
  broadcaster_login: string;
  title: string;
  winning_outcome_id: string | null;
  outcomes: PredictionOutcome[];
  prediction_window: number;
  status: 'ACTIVE' | 'CANCELLED' | 'LOCKED' | 'RESOLVED';
  created_at: string;
  ended_at: string | null;
  locked_at: string | null;
}

export interface PredictionResponse {
  data: PredictionData[];
}

export interface PredictionDetails {
  id: string;
  outcomes: {
    id: string;
    title: string;
  }[];
}
