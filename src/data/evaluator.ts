import { RevenueRiskInputEvent, RevRescueOutput } from '../types';

export function evaluateClientFallback(event: RevenueRiskInputEvent): RevRescueOutput {
  const now = new Date().toISOString();
  const attempts = event.current_attempt_count ?? 0;
  const isHostile = (event.customer_sentiment as string) === 'hostile' || (event.customer_sentiment as string) === 'opt_out';
  const isOverdueAging = (event.days_overdue ?? 0) > 45;
  const isHardDecline = event.gateway_error_code?.toLowerCase().includes('stolen') || 
                        event.gateway_error_code?.toLowerCase().includes('closed') ||
                        event.gateway_error_code?.toLowerCase().includes('lost');
  const isDispute = Boolean(event.dispute_filed);
  const isMaxAttempts = attempts >= 3;

  // Stopping rules
  if (isHardDecline || isHostile || isOverdueAging || isDispute || isMaxAttempts) {
    let reason = "Compliance guardrail boundary condition met.";
    if (isHardDecline) reason = "Hard decline (lost/stolen/closed card). Automated retries halted to prevent issuer penalties.";
    else if (isHostile) reason = "Customer hostility/opt-out detected. Outreach halted to protect brand integrity.";
    else if (isOverdueAging) reason = "Invoice overdue aging > 45 days. Shifted to human collections ledger.";
    else if (isMaxAttempts) reason = "Max allowed contact attempts (3/3) reached. Automated outreach halted.";
    else if (isDispute) reason = "Formal chargeback dispute active. Freezing automated collections.";

    return {
      event_id: event.event_id,
      customer_id: event.customer_id,
      risk_category: event.risk_category,
      diagnosis: {
        root_cause: `Mandatory compliance stop: ${reason}`,
        confidence_score: 0.99
      },
      recovery_action: {
        selected_workflow: "Escalation to Human Review & Legal Queue",
        action_payload: {
          channel: "email",
          message_or_command: `[AUTOMATED WORKFLOW HALTED] Event ${event.event_id} flagged for human review. Reason: ${reason}`,
          scheduled_delay_hours: 0
        }
      },
      compliance_and_guardrails: {
        current_attempt_count: attempts,
        max_allowed_attempts: 3,
        stop_rule_triggered: true,
        stop_reason: reason
      },
      audit_trail: [
        { timestamp: now, action: "Trigger received & evaluated", status: "success" },
        { timestamp: now, action: `Stop Rule Engaged: ${reason}`, status: "halted" },
        { timestamp: now, action: "Escalated to Tier-2 Operations", status: "escalated" }
      ]
    };
  }

  // Workflows
  if (event.risk_category === 'payment_failure') {
    return {
      event_id: event.event_id,
      customer_id: event.customer_id,
      risk_category: event.risk_category,
      diagnosis: {
        root_cause: `Soft gateway decline (${event.gateway_error_code || 'insufficient_funds'}). Account liquidity recovery expected in next settlement cycle.`,
        confidence_score: 0.95
      },
      recovery_action: {
        selected_workflow: "Payment Degradation / Mandate Retry Sequencer",
        action_payload: {
          channel: "gateway_retry",
          message_or_command: `retry_mandate_charge(event_id='${event.event_id}', gateway='${event.gateway_name || 'PRIMARY_GATEWAY'}', scheduled_window='09:00_AM_LOCAL', delay_hours=24)`,
          scheduled_delay_hours: 24
        }
      },
      compliance_and_guardrails: {
        current_attempt_count: attempts + 1,
        max_allowed_attempts: 3,
        stop_rule_triggered: false,
        stop_reason: null
      },
      audit_trail: [
        { timestamp: now, action: "Diagnosed soft decline condition", status: "success" },
        { timestamp: now, action: "Scheduled smart settlement retry (T+24h)", status: "success" }
      ]
    };
  }

  if (event.risk_category === 'checkout_abandonment') {
    return {
      event_id: event.event_id,
      customer_id: event.customer_id,
      risk_category: event.risk_category,
      diagnosis: {
        root_cause: "High-intent cart abandonment at shipping calculation step. Session active 45 minutes ago.",
        confidence_score: 0.92
      },
      recovery_action: {
        selected_workflow: "Checkout Drop-Off Recovery",
        action_payload: {
          channel: "sms",
          message_or_command: `Hi ${event.customer_name || 'there'}! We saved your cart (${event.currency} ${event.amount_at_risk.toLocaleString()}). Complete your order in 1-click with free expedited shipping: https://checkout.revrescue.ai/pay/${event.event_id}`,
          scheduled_delay_hours: 2
        }
      },
      compliance_and_guardrails: {
        current_attempt_count: attempts + 1,
        max_allowed_attempts: 3,
        stop_rule_triggered: false,
        stop_reason: null
      },
      audit_trail: [
        { timestamp: now, action: "Cart drop-off intent verified", status: "success" },
        { timestamp: now, action: "Dispatched compliant SMS checkout nudge", status: "success" }
      ]
    };
  }

  if (event.risk_category === 'overdue_receivable') {
    const isHinglish = event.customer_language === 'hinglish';
    return {
      event_id: event.event_id,
      customer_id: event.customer_id,
      risk_category: event.risk_category,
      diagnosis: {
        root_cause: `B2B Invoice #${event.event_id} is ${event.days_overdue || 15} days past Net-30 terms. Vendor approval pending in client ERP.`,
        confidence_score: 0.90
      },
      recovery_action: {
        selected_workflow: "B2B Receivables Chaser & Promise-to-Pay Tracker",
        action_payload: {
          channel: isHinglish ? "voice_hinglish" : "email",
          message_or_command: isHinglish 
            ? `Namaste ${event.customer_name || 'Sir/Madam'}, RevRescue accounts team se call kar rahe hain. Aapka invoice #${event.event_id} (${event.currency} ${event.amount_at_risk.toLocaleString()}) pending hai. Kya hum aaj payment settlement process kar sakte hain?`
            : `Dear ${event.customer_name || 'Finance Team'}, invoice #${event.event_id} for ${event.currency} ${event.amount_at_risk.toLocaleString()} is ${event.days_overdue || 15} days past due. Please authorize direct settlement at https://billing.revrescue.ai/inv/${event.event_id}.`,
          scheduled_delay_hours: 0
        }
      },
      compliance_and_guardrails: {
        current_attempt_count: attempts + 1,
        max_allowed_attempts: 3,
        stop_rule_triggered: false,
        stop_reason: null
      },
      audit_trail: [
        { timestamp: now, action: "B2B aging schedule evaluated", status: "success" },
        { timestamp: now, action: `Dispatched ${isHinglish ? 'Hinglish voice agent call' : 'formal dunning email'}`, status: "success" }
      ]
    };
  }

  // Failed subscription
  return {
    event_id: event.event_id,
    customer_id: event.customer_id,
    risk_category: event.risk_category,
    diagnosis: {
      root_cause: "Recurring SaaS renewal mandate failure. Customer is within active 7-day grace period.",
      confidence_score: 0.93
    },
    recovery_action: {
      selected_workflow: "Failed-Subscription Recovery",
      action_payload: {
        channel: "email",
        message_or_command: `Hello ${event.customer_name || 'Subscriber'}, your subscription renewal (${event.currency} ${event.amount_at_risk.toLocaleString()}) was unsuccessful. Your service is active for 7 days under our grace policy. Please update your payment method: https://account.revrescue.ai/billing/${event.customer_id}`,
        scheduled_delay_hours: 0
      }
    },
    compliance_and_guardrails: {
      current_attempt_count: attempts + 1,
      max_allowed_attempts: 3,
      stop_rule_triggered: false,
      stop_reason: null
    },
    audit_trail: [
      { timestamp: now, action: "Subscription renewal failure detected", status: "success" },
      { timestamp: now, action: "Dispatched grace-period payment update link", status: "success" }
    ]
  };
}
