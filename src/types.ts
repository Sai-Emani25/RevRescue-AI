export type RiskCategory = 
  | 'payment_failure' 
  | 'checkout_abandonment' 
  | 'failed_subscription' 
  | 'overdue_receivable';

export type CommunicationChannel = 
  | 'email' 
  | 'sms' 
  | 'voice_hinglish' 
  | 'gateway_retry';

export type AuditStatus = 'success' | 'halted' | 'escalated';

export interface AuditTrailEntry {
  timestamp: string;
  action: string;
  status: AuditStatus;
}

export interface Diagnosis {
  root_cause: string;
  confidence_score: number;
}

export interface ActionPayload {
  channel: CommunicationChannel;
  message_or_command: string;
  scheduled_delay_hours: number;
}

export interface ComplianceAndGuardrails {
  current_attempt_count: number;
  max_allowed_attempts: number;
  stop_rule_triggered: boolean;
  stop_reason: string | null;
}

export interface RecoveryAction {
  selected_workflow: string;
  action_payload: ActionPayload;
}

export interface RevRescueOutput {
  event_id: string;
  customer_id: string;
  risk_category: RiskCategory;
  diagnosis: Diagnosis;
  recovery_action: RecoveryAction;
  compliance_and_guardrails: ComplianceAndGuardrails;
  audit_trail: AuditTrailEntry[];
}

export interface RevenueRiskInputEvent {
  event_id: string;
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_language?: 'en' | 'hinglish' | 'es' | 'de';
  risk_category: RiskCategory;
  amount_at_risk: number;
  currency: string;
  current_attempt_count: number;
  
  // Specific contextual parameters
  gateway_error_code?: string;
  gateway_error_message?: string;
  gateway_name?: string;
  
  cart_items?: Array<{ name: string; price: number; quantity: number }>;
  cart_age_minutes?: number;
  has_applied_discount?: boolean;
  
  subscription_plan?: string;
  days_in_grace_period?: number;
  card_last_four?: string;
  card_expiry_month_year?: string;
  
  invoice_id?: string;
  invoice_due_date?: string;
  days_overdue?: number;
  customer_sentiment?: 'neutral' | 'apologetic' | 'hostile' | 'opt_out' | 'disputed';
  dispute_filed?: boolean;
  notes?: string;
}

export interface PresetScenario {
  id: string;
  title: string;
  category: RiskCategory;
  badgeText: string;
  description: string;
  isStopRuleExample?: boolean;
  event: RevenueRiskInputEvent;
}
