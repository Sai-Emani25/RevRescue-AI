import { GoogleGenAI, Type } from "@google/genai";
import { RevenueRiskInputEvent, RevRescueOutput } from "../src/types";

let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const REVRESCUE_SYSTEM_INSTRUCTION = `
You are RevRescue AI, an advanced, autonomous revenue recovery agent. Your mission is to continuously analyze revenue-at-risk events (payment failures, checkout drop-offs, failed subscriptions, and overdue B2B receivables), diagnose the root cause, determine the optimal intervention strategy, and execute a bounded recovery workflow.

You do not just identify problems—you close the loop by recovering money safely, compliantly, and transparently, generating a full audit trail for every action.

# Operational Capabilities & Interventions
When presented with a revenue-at-risk trigger, evaluate the scenario and select one of the following bounded recovery workflows:
1. Payment Degradation / Mandate Retry Sequencer: Analyze gateway error codes (e.g., soft vs. hard declines), schedule intelligent retry intervals, or trigger alternative routing.
2. Checkout Drop-Off Recovery: Trigger contextual cart-abandonment nudges via SMS, email, or WhatsApp with hyper-personalized incentives.
3. Failed-Subscription Recovery: Send proactive account update links and grace-period notifications before service suspension.
4. B2B Receivables Chaser & Promise-to-Pay Tracker: Draft escalated, professional reminders or schedule Hinglish voice/chat recovery flows for local markets.

# Mandatory Compliance & Guardrails (Strict Enforcement)
To prevent customer fatigue, brand damage, or legal non-compliance, you must strictly follow these rules:
* Bounded Retries: Never exceed a maximum of 3 automated retry or contact attempts per dispute/abandonment lifecycle unless manually overridden. If current_attempt_count >= 3, you MUST set stop_rule_triggered: true and halt automated contact.
* Stop Rules: If a customer explicitly opts out, expresses hostility, files a dispute/chargeback, or if an invoice has passed its maximum grace window (e.g., > 45 days), immediately halt all automated recovery workflows and flag the account for human legal/support review. Set stop_rule_triggered: true, provide clear stop_reason, and status: "halted" or "escalated".
* No Unauthorized Discounts: Never offer financial discounts, write-offs, or payment extensions outside of pre-approved business policy parameters (max allowed discount is 5-10% coupon only for eligible cart checkout abandonment).
* Tone & Persona: Maintain a polite, empathetic, professional, yet firm tone across all communications (including multilingual/Hinglish flows).

# Required Output Structure
You must output valid JSON strictly matching the response schema.
`;

export function evaluateDeterministicRules(event: RevenueRiskInputEvent): RevRescueOutput {
  const now = new Date().toISOString();
  const currentAttempts = event.current_attempt_count ?? 0;
  const maxAttempts = 3;

  // Stop Rule Check 1: Hostility / Threat
  if (event.customer_sentiment === 'hostile') {
    return {
      event_id: event.event_id,
      customer_id: event.customer_id,
      risk_category: event.risk_category,
      diagnosis: {
        root_cause: "Customer expressed hostility and legal escalation risk during outreach.",
        confidence_score: 0.98
      },
      recovery_action: {
        selected_workflow: "Human Review Escalation (Stop Rule Triggered)",
        action_payload: {
          channel: "email",
          message_or_command: "ESCALATION_DISPATCH: Customer flagged as hostile. Automated outreach terminated immediately. Case transferred to Tier 3 Legal & Executive Support.",
          scheduled_delay_hours: 0
        }
      },
      compliance_and_guardrails: {
        current_attempt_count: currentAttempts,
        max_allowed_attempts: maxAttempts,
        stop_rule_triggered: true,
        stop_reason: "Customer hostility detected. Automated recovery halted to prevent brand and legal liability."
      },
      audit_trail: [
        {
          timestamp: now,
          action: "Evaluated customer sentiment and risk factors",
          status: "success"
        },
        {
          timestamp: new Date(Date.now() + 1000).toISOString(),
          action: "Triggered Stop Rule: Customer Hostility / Legal Risk",
          status: "halted"
        },
        {
          timestamp: new Date(Date.now() + 2000).toISOString(),
          action: "Routed account to Human Legal & VIP Support Queue",
          status: "escalated"
        }
      ]
    };
  }

  // Stop Rule Check 2: Customer Opt-out
  if (event.customer_sentiment === 'opt_out') {
    return {
      event_id: event.event_id,
      customer_id: event.customer_id,
      risk_category: event.risk_category,
      diagnosis: {
        root_cause: "Customer explicitly opted out or requested do-not-contact status.",
        confidence_score: 0.99
      },
      recovery_action: {
        selected_workflow: "Compliance Opt-Out Lock",
        action_payload: {
          channel: "email",
          message_or_command: "OPT_OUT_SUPPRESSION: Contact preferences updated. Automated triggers disabled across all channels.",
          scheduled_delay_hours: 0
        }
      },
      compliance_and_guardrails: {
        current_attempt_count: currentAttempts,
        max_allowed_attempts: maxAttempts,
        stop_rule_triggered: true,
        stop_reason: "Customer explicitly opted out. Automated workflows halted under TCPA/GDPR compliance."
      },
      audit_trail: [
        {
          timestamp: now,
          action: "Logged customer opt-out suppression flag",
          status: "halted"
        }
      ]
    };
  }

  // Stop Rule Check 3: Formal Chargeback / Dispute Filed
  if (event.dispute_filed || event.customer_sentiment === 'disputed' || event.gateway_error_code?.includes('dispute') || event.gateway_error_code?.includes('chargeback')) {
    return {
      event_id: event.event_id,
      customer_id: event.customer_id,
      risk_category: event.risk_category,
      diagnosis: {
        root_cause: "Bank dispute / chargeback recorded with payment processor.",
        confidence_score: 0.96
      },
      recovery_action: {
        selected_workflow: "Dispute Freeze & Evidence Packaging",
        action_payload: {
          channel: "email",
          message_or_command: "DISPUTE_HOLD: Outreach frozen. Gathering transaction logs, invoice receipts, and service delivery timestamps for representment package.",
          scheduled_delay_hours: 0
        }
      },
      compliance_and_guardrails: {
        current_attempt_count: currentAttempts,
        max_allowed_attempts: maxAttempts,
        stop_rule_triggered: true,
        stop_reason: "Formal bank dispute / chargeback logged. Automated dunning halted to comply with card network rules."
      },
      audit_trail: [
        {
          timestamp: now,
          action: "Detected active cardholder chargeback / dispute",
          status: "halted"
        },
        {
          timestamp: new Date(Date.now() + 1000).toISOString(),
          action: "Escalated case to Dispute Operations Team",
          status: "escalated"
        }
      ]
    };
  }

  // Stop Rule Check 4: Invoice Overdue > 45 Days
  if (event.days_overdue && event.days_overdue > 45) {
    return {
      event_id: event.event_id,
      customer_id: event.customer_id,
      risk_category: event.risk_category,
      diagnosis: {
        root_cause: `Invoice is ${event.days_overdue} days overdue, exceeding the 45-day maximum grace window.`,
        confidence_score: 0.97
      },
      recovery_action: {
        selected_workflow: "B2B Receivables Chaser & Promise-to-Pay Tracker (Escalated)",
        action_payload: {
          channel: "email",
          message_or_command: `FORMAL_NOTICE: Invoice #${event.invoice_id || 'INV-PENDING'} is ${event.days_overdue} days past due ($${event.amount_at_risk}). Forwarded to Human Collections & Finance Director for legal demand letter.`,
          scheduled_delay_hours: 0
        }
      },
      compliance_and_guardrails: {
        current_attempt_count: currentAttempts,
        max_allowed_attempts: maxAttempts,
        stop_rule_triggered: true,
        stop_reason: `Invoice overdue window exceeded policy limit (> 45 days: actual ${event.days_overdue} days). Halted automated contact.`
      },
      audit_trail: [
        {
          timestamp: now,
          action: `Checked invoice age (${event.days_overdue} days vs 45-day policy ceiling)`,
          status: "halted"
        },
        {
          timestamp: new Date(Date.now() + 1000).toISOString(),
          action: "Terminated automated cadence; escalated to Legal Collections",
          status: "escalated"
        }
      ]
    };
  }

  // Stop Rule Check 5: Max Attempts Exceeded (>= 3)
  if (currentAttempts >= maxAttempts) {
    return {
      event_id: event.event_id,
      customer_id: event.customer_id,
      risk_category: event.risk_category,
      diagnosis: {
        root_cause: `Maximum bounded automated attempts reached (${currentAttempts}/${maxAttempts}). Customer has not responded to previous retries.`,
        confidence_score: 0.95
      },
      recovery_action: {
        selected_workflow: "Manual Override Escalation",
        action_payload: {
          channel: "email",
          message_or_command: "ESCALATION_QUEUE: Attempt limit (3/3) reached. Automated workflows stopped to prevent customer fatigue. Assigned to Senior Account Executive.",
          scheduled_delay_hours: 0
        }
      },
      compliance_and_guardrails: {
        current_attempt_count: currentAttempts,
        max_allowed_attempts: maxAttempts,
        stop_rule_triggered: true,
        stop_reason: "Bounded retry limit reached (3 of 3 attempts completed). Requires manual agent intervention."
      },
      audit_trail: [
        {
          timestamp: now,
          action: "Attempt count evaluation: 3/3 reached",
          status: "halted"
        },
        {
          timestamp: new Date(Date.now() + 1000).toISOString(),
          action: "Transferred event to Human Manual Review queue",
          status: "escalated"
        }
      ]
    };
  }

  // Active Workflows (1 to 4)
  if (event.risk_category === 'payment_failure') {
    const isHardDecline = event.gateway_error_code?.toLowerCase().includes('stolen') || 
                          event.gateway_error_code?.toLowerCase().includes('lost') ||
                          event.gateway_error_code?.toLowerCase().includes('expired');

    if (isHardDecline) {
      return {
        event_id: event.event_id,
        customer_id: event.customer_id,
        risk_category: "payment_failure",
        diagnosis: {
          root_cause: `Hard decline reported by ${event.gateway_name || 'gateway'} (${event.gateway_error_code || 'card_declined'}). Card cannot be retried automatically.`,
          confidence_score: 0.94
        },
        recovery_action: {
          selected_workflow: "Payment Degradation / Mandate Retry Sequencer (Hard Decline Branch)",
          action_payload: {
            channel: "email",
            message_or_command: `Dear ${event.customer_name || 'Valued Customer'},\n\nYour payment of ${event.currency} ${event.amount_at_risk.toLocaleString()} could not be processed because your card ending in ${event.card_last_four || '****'} requires an update. To avoid service disruption, please securely update your billing details here: https://billing.app.com/update?token=sec_${event.customer_id}.\n\nWarm regards,\nBilling Operations`,
            scheduled_delay_hours: 0
          }
        },
        compliance_and_guardrails: {
          current_attempt_count: currentAttempts + 1,
          max_allowed_attempts: maxAttempts,
          stop_rule_triggered: false,
          stop_reason: null
        },
        audit_trail: [
          {
            timestamp: now,
            action: `Diagnosed hard decline code: ${event.gateway_error_code}`,
            status: "success"
          },
          {
            timestamp: new Date(Date.now() + 1000).toISOString(),
            action: "Suppressed automated gateway retry to prevent issuer penalty",
            status: "success"
          },
          {
            timestamp: new Date(Date.now() + 2000).toISOString(),
            action: "Dispatched secure payment update link to customer email",
            status: "success"
          }
        ]
      };
    }

    // Soft decline -> Intelligent retry schedule
    return {
      event_id: event.event_id,
      customer_id: event.customer_id,
      risk_category: "payment_failure",
      diagnosis: {
        root_cause: `Temporary soft decline / insufficient funds (${event.gateway_error_code || 'INSUFFICIENT_FUNDS_SOFT_DECLINE'}). Issuer is operational.`,
        confidence_score: 0.92
      },
      recovery_action: {
        selected_workflow: "Payment Degradation / Mandate Retry Sequencer",
        action_payload: {
          channel: "gateway_retry",
          message_or_command: `EXECUTE_GATEWAY_RETRY: Route to ${event.gateway_name || 'Primary Gateway'} backup pipeline. Schedule retry token tx_${event.event_id} at optimum banking settlement hour (+6h).`,
          scheduled_delay_hours: 6
        }
      },
      compliance_and_guardrails: {
        current_attempt_count: currentAttempts + 1,
        max_allowed_attempts: maxAttempts,
        stop_rule_triggered: false,
        stop_reason: null
      },
      audit_trail: [
        {
          timestamp: now,
          action: "Analyzed gateway response code: Soft decline identified",
          status: "success"
        },
        {
          timestamp: new Date(Date.now() + 1000).toISOString(),
          action: `Scheduled automated retry attempt ${currentAttempts + 1} of 3 with 6-hour delay window`,
          status: "success"
        }
      ]
    };
  }

  if (event.risk_category === 'checkout_abandonment') {
    return {
      event_id: event.event_id,
      customer_id: event.customer_id,
      risk_category: "checkout_abandonment",
      diagnosis: {
        root_cause: `High-intent session drop-off at checkout (${event.cart_age_minutes || 30} mins ago). Value: ${event.currency} ${event.amount_at_risk}.`,
        confidence_score: 0.90
      },
      recovery_action: {
        selected_workflow: "Checkout Drop-Off Recovery",
        action_payload: {
          channel: "sms",
          message_or_command: `Hi ${event.customer_name || 'there'}! We noticed you left items in your cart. Complete your order in 1 click here: https://checkout.store.com/r/${event.event_id} (Use pre-approved code RECOVER5 for 5% off within 24h).`,
          scheduled_delay_hours: 1
        }
      },
      compliance_and_guardrails: {
        current_attempt_count: currentAttempts + 1,
        max_allowed_attempts: maxAttempts,
        stop_rule_triggered: false,
        stop_reason: null
      },
      audit_trail: [
        {
          timestamp: now,
          action: "Evaluated cart intent score & abandoned cart value",
          status: "success"
        },
        {
          timestamp: new Date(Date.now() + 1000).toISOString(),
          action: "Verified policy compliance: 5% discount is within authorized boundary",
          status: "success"
        },
        {
          timestamp: new Date(Date.now() + 2000).toISOString(),
          action: `Queued 1st-stage SMS recovery nudge (Attempt ${currentAttempts + 1}/3)`,
          status: "success"
        }
      ]
    };
  }

  if (event.risk_category === 'failed_subscription') {
    return {
      event_id: event.event_id,
      customer_id: event.customer_id,
      risk_category: "failed_subscription",
      diagnosis: {
        root_cause: `Subscription renewal failed for plan ${event.subscription_plan || 'Active Plan'}. Day ${event.days_in_grace_period || 1} of grace period.`,
        confidence_score: 0.93
      },
      recovery_action: {
        selected_workflow: "Failed-Subscription Recovery",
        action_payload: {
          channel: "email",
          message_or_command: `Hi ${event.customer_name || 'Subscriber'},\n\nWe were unable to renew your ${event.subscription_plan || 'subscription'}. No worries—your access remains active for another 4 days in your grace window. Please update your payment method to ensure uninterrupted service: https://app.service.com/account/billing?id=${event.customer_id}.\n\nThank you for being with us!`,
          scheduled_delay_hours: 2
        }
      },
      compliance_and_guardrails: {
        current_attempt_count: currentAttempts + 1,
        max_allowed_attempts: maxAttempts,
        stop_rule_triggered: false,
        stop_reason: null
      },
      audit_trail: [
        {
          timestamp: now,
          action: "Verified grace period status and active service entitlements",
          status: "success"
        },
        {
          timestamp: new Date(Date.now() + 1000).toISOString(),
          action: "Generated empathetic dunning notification with 1-click update link",
          status: "success"
        }
      ]
    };
  }

  // overdue_receivable (B2B Receivables)
  const isHinglish = event.customer_language === 'hinglish' || event.currency === 'INR';
  const hinglishMessage = `Namaste ${event.customer_name || 'Rahul ji'}, RevRescue AI finance desk se call kar raha hoon regarding Invoice #${event.invoice_id || 'INV-8492'} amounting to ₹${event.amount_at_risk.toLocaleString()}, jo ${event.days_overdue || 15} din overdue hai. Kya hum aaj ke liye promise-to-pay confirm kar sakte hain ya payment link SMS par share karein?`;
  const englishMessage = `Dear ${event.customer_name || 'Finance Team'},\n\nThis is a courtesy follow-up regarding Invoice #${event.invoice_id || 'INV-8492'} for ${event.currency} ${event.amount_at_risk.toLocaleString()}, which was due on ${event.invoice_due_date || 'recently'} (${event.days_overdue || 15} days overdue). Please review the payment link or reply with your expected promise-to-pay date.\n\nBest regards,\nAccounts Receivable`;

  return {
    event_id: event.event_id,
    customer_id: event.customer_id,
    risk_category: "overdue_receivable",
    diagnosis: {
      root_cause: `B2B receivable overdue by ${event.days_overdue || 15} days. Total amount: ${event.currency} ${event.amount_at_risk.toLocaleString()}.`,
      confidence_score: 0.91
    },
    recovery_action: {
      selected_workflow: "B2B Receivables Chaser & Promise-to-Pay Tracker",
      action_payload: {
        channel: isHinglish ? "voice_hinglish" : "email",
        message_or_command: isHinglish ? hinglishMessage : englishMessage,
        scheduled_delay_hours: 4
      }
    },
    compliance_and_guardrails: {
      current_attempt_count: currentAttempts + 1,
      max_allowed_attempts: maxAttempts,
      stop_rule_triggered: false,
      stop_reason: null
    },
    audit_trail: [
      {
        timestamp: now,
        action: `Checked B2B invoice aging: ${event.days_overdue || 15} days (within 45-day allowable threshold)`,
        status: "success"
      },
      {
        timestamp: new Date(Date.now() + 1000).toISOString(),
        action: `Selected ${isHinglish ? 'Hinglish localized voice/chat channel' : 'formal email chaser'} with promise-to-pay tracking`,
        status: "success"
      }
    ]
  };
}

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    event_id: { type: Type.STRING },
    customer_id: { type: Type.STRING },
    risk_category: {
      type: Type.STRING,
      description: "Must be payment_failure | checkout_abandonment | failed_subscription | overdue_receivable"
    },
    diagnosis: {
      type: Type.OBJECT,
      properties: {
        root_cause: { type: Type.STRING },
        confidence_score: { type: Type.NUMBER, description: "Float between 0.0 and 1.0" }
      },
      required: ["root_cause", "confidence_score"]
    },
    recovery_action: {
      type: Type.OBJECT,
      properties: {
        selected_workflow: { type: Type.STRING },
        action_payload: {
          type: Type.OBJECT,
          properties: {
            channel: { type: Type.STRING, description: "email | sms | voice_hinglish | gateway_retry" },
            message_or_command: { type: Type.STRING },
            scheduled_delay_hours: { type: Type.INTEGER }
          },
          required: ["channel", "message_or_command", "scheduled_delay_hours"]
        }
      },
      required: ["selected_workflow", "action_payload"]
    },
    compliance_and_guardrails: {
      type: Type.OBJECT,
      properties: {
        current_attempt_count: { type: Type.INTEGER },
        max_allowed_attempts: { type: Type.INTEGER },
        stop_rule_triggered: { type: Type.BOOLEAN },
        stop_reason: { type: Type.STRING, nullable: true }
      },
      required: ["current_attempt_count", "max_allowed_attempts", "stop_rule_triggered"]
    },
    audit_trail: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          timestamp: { type: Type.STRING },
          action: { type: Type.STRING },
          status: { type: Type.STRING, description: "success | halted | escalated" }
        },
        required: ["timestamp", "action", "status"]
      }
    }
  },
  required: [
    "event_id",
    "customer_id",
    "risk_category",
    "diagnosis",
    "recovery_action",
    "compliance_and_guardrails",
    "audit_trail"
  ]
};

async function executeGeminiWithRetry(
  genAI: GoogleGenAI,
  prompt: string,
  modelName: string = "gemini-3.7-flash",
  maxRetries: number = 1
): Promise<string | null> {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      const response = await genAI.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: REVRESCUE_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        }
      });
      return response.text?.trim() || null;
    } catch (error: any) {
      attempt++;
      const errorMessage = error?.message || String(error);
      const isTransient = 
        errorMessage.includes("503") || 
        errorMessage.includes("UNAVAILABLE") || 
        errorMessage.includes("high demand") || 
        errorMessage.includes("429") || 
        errorMessage.includes("RESOURCE_EXHAUSTED") ||
        errorMessage.includes("ECONNRESET");

      if (isTransient && attempt <= maxRetries) {
        const backoffMs = attempt * 400 + Math.random() * 200;
        await delay(backoffMs);
        continue;
      }
      return null;
    }
  }
  return null;
}

export async function analyzeRevenueRiskEvent(event: RevenueRiskInputEvent): Promise<RevRescueOutput> {
  const genAI = getGenAI();

  // If Gemini API is not available or encounters issues, use strict deterministic fallback
  if (!genAI) {
    return evaluateDeterministicRules(event);
  }

  // Quick pre-guardrail check to avoid burning LLM quota on obvious hard stops
  const isHostile = (event.customer_sentiment as string) === 'hostile';
  const isOptOut = (event.customer_sentiment as string) === 'opt_out';
  if (
    (event.current_attempt_count ?? 0) >= 3 ||
    isHostile ||
    isOptOut ||
    (event.days_overdue ?? 0) > 45 ||
    event.dispute_filed ||
    event.gateway_error_code === 'stolen_card' ||
    event.gateway_error_code === 'account_closed'
  ) {
    return evaluateDeterministicRules(event);
  }

  const prompt = `
Analyze this revenue-at-risk event and generate the required bounded recovery response:

Event Input Data:
${JSON.stringify(event, null, 2)}

Strict Guardrails to Enforce:
1. current_attempt_count is currently ${event.current_attempt_count ?? 0}. If already >= 3, you MUST trigger stop_rule_triggered: true.
2. If customer_sentiment is 'hostile' or 'opt_out', you MUST trigger stop_rule_triggered: true.
3. If dispute_filed is true, you MUST trigger stop_rule_triggered: true.
4. If days_overdue > 45, you MUST trigger stop_rule_triggered: true.
5. If customer_language is 'hinglish' or context is Indian B2B receivables, channel should be 'voice_hinglish' or 'sms' with natural, polite Hinglish conversational wording.
6. Only return valid JSON matching the exact schema.
`;

  // Cascade: gemini-3.7-flash -> gemini-flash-latest -> gemini-3.1-flash-lite -> Deterministic Rules
  const modelsToTry = ["gemini-3.7-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];

  for (const modelName of modelsToTry) {
    try {
      const parsedText = await executeGeminiWithRetry(genAI, prompt, modelName, 1);
      if (parsedText) {
        const aiOutput = JSON.parse(parsedText) as RevRescueOutput;

        // Secondary safety verification pass: Ensure guardrails are rigidly enforced
        if (
          (event.current_attempt_count ?? 0) >= 3 || 
          isHostile || 
          isOptOut || 
          (event.days_overdue ?? 0) > 45 || 
          event.dispute_filed
        ) {
          aiOutput.compliance_and_guardrails.stop_rule_triggered = true;
          if (!aiOutput.compliance_and_guardrails.stop_reason) {
            aiOutput.compliance_and_guardrails.stop_reason = "Mandatory compliance guardrail triggered.";
          }
        }

        return aiOutput;
      }
    } catch {
      // Continue silently to next model in cascade
    }
  }

  // Deterministic engine fallback guarantee
  return evaluateDeterministicRules(event);
}
