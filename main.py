"""
RevRescue AI - Autonomous Revenue Recovery & Bounded Compliance Engine
FastAPI backend orchestrator with Google GenAI SDK (Gemini 3.7 Flash) and strict Pydantic schemas.
"""

import os
import json
import sqlite3
import datetime
from typing import List, Optional, Literal
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from google import genai
from google.genai import types

# -----------------------------------------------------------------------------
# 1. DATABASE & LEDGER SETUP (SQLite Audit Trail)
# -----------------------------------------------------------------------------
DB_PATH = os.path.join(os.path.dirname(__file__), "revrescue_ledger.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS recovery_audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id TEXT NOT NULL,
            customer_id TEXT NOT NULL,
            risk_category TEXT NOT NULL,
            amount_at_risk REAL NOT NULL,
            recovered_amount REAL DEFAULT 0.0,
            root_cause TEXT,
            confidence_score REAL,
            selected_workflow TEXT,
            channel TEXT,
            scheduled_delay_hours INTEGER,
            current_attempt_count INTEGER,
            stop_rule_triggered BOOLEAN,
            stop_reason TEXT,
            raw_response_json TEXT,
            timestamp TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

def record_audit_entry(event_input: "RevenueRiskInputEvent", output: "RevRescueOutput", recovered_amt: float):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO recovery_audit_log (
            event_id, customer_id, risk_category, amount_at_risk, recovered_amount,
            root_cause, confidence_score, selected_workflow, channel,
            scheduled_delay_hours, current_attempt_count, stop_rule_triggered,
            stop_reason, raw_response_json, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        output.event_id,
        output.customer_id,
        output.risk_category,
        event_input.amount_at_risk,
        recovered_amt,
        output.diagnosis.root_cause,
        output.diagnosis.confidence_score,
        output.recovery_action.selected_workflow,
        output.recovery_action.action_payload.channel,
        output.recovery_action.action_payload.scheduled_delay_hours,
        output.compliance_and_guardrails.current_attempt_count,
        1 if output.compliance_and_guardrails.stop_rule_triggered else 0,
        output.compliance_and_guardrails.stop_reason,
        output.model_dump_json(),
        datetime.datetime.now(datetime.timezone.utc).isoformat()
    ))
    conn.commit()
    conn.close()

# -----------------------------------------------------------------------------
# 2. PYDANTIC SCHEMAS (Strict I/O & Output Contract)
# -----------------------------------------------------------------------------
class RevenueRiskInputEvent(BaseModel):
    event_id: str
    customer_id: str
    customer_name: Optional[str] = "Valued Customer"
    amount_at_risk: float
    currency: str = "USD"
    risk_category: Literal[
        "payment_failure",
        "checkout_abandonment",
        "failed_subscription",
        "overdue_receivable"
    ]
    current_attempt_count: int = 1
    gateway_error_code: Optional[str] = None
    days_overdue: Optional[int] = 0
    customer_sentiment: Optional[str] = "neutral"
    customer_language: Optional[str] = "en"
    dispute_filed: Optional[bool] = False
    notes: Optional[str] = None

class DiagnosisSchema(BaseModel):
    root_cause: str = Field(description="Precise technical or behavioral cause of revenue risk")
    confidence_score: float = Field(ge=0.0, le=1.0, description="Confidence score between 0.0 and 1.0")

class ActionPayloadSchema(BaseModel):
    channel: Literal["email", "sms", "voice_hinglish", "gateway_retry"]
    message_or_command: str = Field(description="Rendered professional communication message or gateway execution command")
    scheduled_delay_hours: int = Field(ge=0, description="Execution delay hours")

class RecoveryActionSchema(BaseModel):
    selected_workflow: str = Field(description="Name of the selected bounded workflow")
    action_payload: ActionPayloadSchema

class ComplianceSchema(BaseModel):
    current_attempt_count: int
    max_allowed_attempts: int = 3
    stop_rule_triggered: bool
    stop_reason: Optional[str] = None

class AuditEntrySchema(BaseModel):
    timestamp: str
    action: str
    status: Literal["success", "halted", "escalated"]

class RevRescueOutput(BaseModel):
    event_id: str
    customer_id: str
    risk_category: Literal[
        "payment_failure",
        "checkout_abandonment",
        "failed_subscription",
        "overdue_receivable"
    ]
    diagnosis: DiagnosisSchema
    recovery_action: RecoveryActionSchema
    compliance_and_guardrails: ComplianceSchema
    audit_trail: List[AuditEntrySchema]

# -----------------------------------------------------------------------------
# 3. GEMINI AGENT INITIALIZATION & PROMPT
# -----------------------------------------------------------------------------
SYSTEM_INSTRUCTION = """
You are RevRescue AI, an advanced, autonomous revenue recovery agent. Your mission is to continuously analyze revenue-at-risk events (payment failures, checkout drop-offs, failed subscriptions, and overdue B2B receivables), diagnose the root cause, determine the optimal intervention strategy, and execute a bounded recovery workflow.

Operational Workflows:
1. Payment Degradation / Mandate Retry Sequencer: Analyze error codes, schedule retry intervals, or trigger alternative routing.
2. Checkout Drop-Off Recovery: Trigger contextual cart-abandonment nudges via SMS, email, or WhatsApp with hyper-personalized incentives.
3. Failed-Subscription Recovery: Send proactive account update links and grace-period notifications before service suspension.
4. B2B Receivables Chaser & Promise-to-Pay Tracker: Draft escalated reminders or schedule Hinglish voice/chat recovery flows.

Mandatory Compliance & Guardrails (Strict Enforcement):
- Bounded Retries: Never exceed 3 automated retry attempts.
- Stop Rules: If customer opts out, expresses hostility, files dispute, or invoice > 45 days, halt automated workflows (stop_rule_triggered=true).
- No Unauthorized Discounts: Never offer discounts exceeding 10% policy cap.
- Tone: Maintain empathetic, professional, firm tone.
"""

def get_gemini_client() -> genai.Client:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY environment variable is not configured."
        )
    return genai.Client(api_key=api_key)

# -----------------------------------------------------------------------------
# 4. DETERMINISTIC FALLBACK RULES ENGINE
# -----------------------------------------------------------------------------
def deterministic_evaluate(event: RevenueRiskInputEvent) -> RevRescueOutput:
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    attempts = event.current_attempt_count or 1
    
    # 1. Check Hard Declines & Stop Rules
    is_hard_decline = event.gateway_error_code in ["stolen_card", "account_closed", "fraudulent", "lost_card"]
    is_hostile = event.customer_sentiment in ["hostile", "opt_out", "stop"]
    is_aged_out = (event.days_overdue or 0) > 45
    is_max_attempts = attempts >= 3
    is_disputed = bool(event.dispute_filed)

    if is_hard_decline or is_hostile or is_aged_out or is_max_attempts or is_disputed:
        stop_reason = (
            "Hard decline detected (stolen card/account closed). Automated retry halted for risk mitigation." if is_hard_decline else
            "Customer hostility/opt-out received. Automated outreach halted to protect brand." if is_hostile else
            "Invoice overdue aging > 45 days. Escalated to human legal/collections ledger." if is_aged_out else
            "Max allowed contact attempts (3/3) reached. Halting automated retries." if is_max_attempts else
            "Active chargeback/dispute registered. Freezing automated collections."
        )
        return RevRescueOutput(
            event_id=event.event_id,
            customer_id=event.customer_id,
            risk_category=event.risk_category,
            diagnosis=DiagnosisSchema(
                root_cause=f"Critical boundary condition: {stop_reason}",
                confidence_score=0.98
            ),
            recovery_action=RecoveryActionSchema(
                selected_workflow="Escalation to Human Review & Legal Queue",
                action_payload=ActionPayloadSchema(
                    channel="email",
                    message_or_command=f"ESCALATION_TICKET_CREATED: Event {event.event_id} placed on compliance hold. Reason: {stop_reason}",
                    scheduled_delay_hours=0
                )
            ),
            compliance_and_guardrails=ComplianceSchema(
                current_attempt_count=attempts,
                max_allowed_attempts=3,
                stop_rule_triggered=True,
                stop_reason=stop_reason
            ),
            audit_trail=[
                AuditEntrySchema(timestamp=now_iso, action="Event Ingested", status="success"),
                AuditEntrySchema(timestamp=now_iso, action=f"Stop Rule Triggered: {stop_reason}", status="halted"),
                AuditEntrySchema(timestamp=now_iso, action="Transferred to Tier-2 Operations", status="escalated")
            ]
        )

    # 2. Standard Recoveries
    if event.risk_category == "payment_failure":
        return RevRescueOutput(
            event_id=event.event_id,
            customer_id=event.customer_id,
            risk_category=event.risk_category,
            diagnosis=DiagnosisSchema(
                root_cause=f"Soft gateway decline ({event.gateway_error_code or 'insufficient_funds'}). Temporary liquidity shortfall.",
                confidence_score=0.94
            ),
            recovery_action=RecoveryActionSchema(
                selected_workflow="Mandate Smart Retry Sequencer",
                action_payload=ActionPayloadSchema(
                    channel="gateway_retry",
                    message_or_command=f"retry_mandate_charge(event_id='{event.event_id}', gateway='ADYEN_PRIMARY', delay=24)",
                    scheduled_delay_hours=24
                )
            ),
            compliance_and_guardrails=ComplianceSchema(
                current_attempt_count=attempts,
                max_allowed_attempts=3,
                stop_rule_triggered=False,
                stop_reason=None
            ),
            audit_trail=[
                AuditEntrySchema(timestamp=now_iso, action="Soft decline diagnosed", status="success"),
                AuditEntrySchema(timestamp=now_iso, action="Scheduled 24h bank settlement retry", status="success")
            ]
        )
    elif event.risk_category == "checkout_abandonment":
        return RevRescueOutput(
            event_id=event.event_id,
            customer_id=event.customer_id,
            risk_category=event.risk_category,
            diagnosis=DiagnosisSchema(
                root_cause="High-intent cart drop-off during shipping calculation.",
                confidence_score=0.91
            ),
            recovery_action=RecoveryActionSchema(
                selected_workflow="Contextual Cart Recovery Nudge",
                action_payload=ActionPayloadSchema(
                    channel="sms",
                    message_or_command=f"Hi {event.customer_name}, we saved your cart ({event.currency} {event.amount_at_risk:,.2f})! Complete your checkout today with verified 1-click checkout: https://pay.revrescue.ai/cart/{event.event_id}",
                    scheduled_delay_hours=2
                )
            ),
            compliance_and_guardrails=ComplianceSchema(
                current_attempt_count=attempts,
                max_allowed_attempts=3,
                stop_rule_triggered=False,
                stop_reason=None
            ),
            audit_trail=[
                AuditEntrySchema(timestamp=now_iso, action="Cart drop-off triaged", status="success"),
                AuditEntrySchema(timestamp=now_iso, action="Dispatched personalized SMS token", status="success")
            ]
        )
    elif event.risk_category == "overdue_receivable":
        is_hinglish = event.customer_language == "hinglish"
        return RevRescueOutput(
            event_id=event.event_id,
            customer_id=event.customer_id,
            risk_category=event.risk_category,
            diagnosis=DiagnosisSchema(
                root_cause=f"Commercial invoice {event.days_overdue} days past due. Payment delay due to cycle timing.",
                confidence_score=0.89
            ),
            recovery_action=RecoveryActionSchema(
                selected_workflow="B2B Receivables Chaser & Promise-to-Pay Tracker",
                action_payload=ActionPayloadSchema(
                    channel="voice_hinglish" if is_hinglish else "email",
                    message_or_command=(
                        f"Namaste {event.customer_name} ji! RevRescue billing se call kar rahe hain. Aapka invoice #{event.event_id} of {event.currency} {event.amount_at_risk:,.2f} pending hai. Kya hum aaj settlement initiate kar sakte hain?"
                        if is_hinglish else
                        f"Dear {event.customer_name}, your invoice #{event.event_id} ({event.currency} {event.amount_at_risk:,.2f}) is {event.days_overdue} days past due. Please review and authorize payment at https://billing.revrescue.ai/inv/{event.event_id}."
                    ),
                    scheduled_delay_hours=0
                )
            ),
            compliance_and_guardrails=ComplianceSchema(
                current_attempt_count=attempts,
                max_allowed_attempts=3,
                stop_rule_triggered=False,
                stop_reason=None
            ),
            audit_trail=[
                AuditEntrySchema(timestamp=now_iso, action="B2B aging schedule evaluated", status="success"),
                AuditEntrySchema(timestamp=now_iso, action=f"Dispatched {'Hinglish voice agent' if is_hinglish else 'dunning email'}", status="success")
            ]
        )
    else:  # failed_subscription
        return RevRescueOutput(
            event_id=event.event_id,
            customer_id=event.customer_id,
            risk_category=event.risk_category,
            diagnosis=DiagnosisSchema(
                root_cause="Subscription recurring mandate failed. In grace window before cancellation.",
                confidence_score=0.92
            ),
            recovery_action=RecoveryActionSchema(
                selected_workflow="Failed Subscription Grace Period Orchestrator",
                action_payload=ActionPayloadSchema(
                    channel="email",
                    message_or_command=f"Hello {event.customer_name}, we couldn't renew your subscription ({event.currency} {event.amount_at_risk:,.2f}). Your service remains active during our 7-day grace window. Update payment details: https://account.revrescue.ai/billing/{event.customer_id}",
                    scheduled_delay_hours=0
                )
            ),
            compliance_and_guardrails=ComplianceSchema(
                current_attempt_count=attempts,
                max_allowed_attempts=3,
                stop_rule_triggered=False,
                stop_reason=None
            ),
            audit_trail=[
                AuditEntrySchema(timestamp=now_iso, action="Subscription mandate failed", status="success"),
                AuditEntrySchema(timestamp=now_iso, action="Issued 7-day grace token", status="success")
            ]
        )

# -----------------------------------------------------------------------------
# 5. FASTAPI APPLICATION SETUP
# -----------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="RevRescue AI Orchestrator API",
    description="Autonomous Revenue Recovery & Bounded Compliance Engine powered by Google Gemini 3.7 Flash",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# 6. MOCK DOWNSTREAM DISPATCHERS
# -----------------------------------------------------------------------------
def mock_stripe_retry(event_id: str, delay_hours: int) -> bool:
    print(f"[MOCK STRIPE] Scheduled PaymentIntent retry for {event_id} in {delay_hours} hours.")
    return True

def mock_twilio_dispatch(channel: str, customer_id: str, message: str) -> bool:
    print(f"[MOCK TWILIO/{channel.upper()}] Dispatched to {customer_id}: '{message[:60]}...'")
    return True

# -----------------------------------------------------------------------------
# 7. CORE RECOVERY & INGESTION ENDPOINTS
# -----------------------------------------------------------------------------
@app.post("/api/v1/events/ingest", response_model=RevRescueOutput)
async def ingest_revenue_risk_event(event: RevenueRiskInputEvent):
    """
    Ingests a single revenue-at-risk event, runs the Gemini 3.7 Flash agent
    with structured schema enforcement, executes mock dispatches, and logs to SQLite.
    """
    output: Optional[RevRescueOutput] = None

    # Step 1: Pre-Guardrail Check (Immediate halt for edge cases)
    if (
        (event.current_attempt_count or 1) >= 3 or
        event.customer_sentiment in ["hostile", "opt_out", "stop"] or
        (event.days_overdue or 0) > 45 or
        event.gateway_error_code in ["stolen_card", "account_closed"] or
        event.dispute_filed
    ):
        output = deterministic_evaluate(event)
    else:
        # Step 2: Query Gemini 3.7 Flash via Google GenAI SDK
        try:
            client = get_gemini_client()
            prompt = f"Analyze revenue-at-risk event and generate bounded recovery response:\n{event.model_dump_json(indent=2)}"
            
            response = client.models.generate_content(
                model="gemini-3.7-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_INSTRUCTION,
                    response_mime_type="application/json",
                    response_schema=RevRescueOutput,
                    temperature=0.1
                )
            )
            if response.text:
                output = RevRescueOutput.model_validate_json(response.text)
        except Exception as e:
            print(f"[RevRescue AI] Gemini GenAI call fallback ({e}). Using deterministic engine.")
            output = deterministic_evaluate(event)

    if not output:
        output = deterministic_evaluate(event)

    # Step 3: Action Execution & Downstream Dispatch
    recovered_amount = 0.0
    if not output.compliance_and_guardrails.stop_rule_triggered:
        if output.recovery_action.action_payload.channel == "gateway_retry":
            mock_stripe_retry(event.event_id, output.recovery_action.action_payload.scheduled_delay_hours)
        else:
            mock_twilio_dispatch(
                output.recovery_action.action_payload.channel,
                event.customer_id,
                output.recovery_action.action_payload.message_or_command
            )
        # Expected model recovery attribution
        recovered_amount = round(event.amount_at_risk * 0.90, 2)

    # Step 4: Immutable Audit Record
    record_audit_entry(event, output, recovered_amount)

    return output

@app.get("/api/v1/audit/metrics")
async def get_metrics():
    """Returns top-line financial summary and stop rule counts from the audit database."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            COUNT(*),
            SUM(amount_at_risk),
            SUM(recovered_amount),
            SUM(CASE WHEN stop_rule_triggered = 1 THEN 1 ELSE 0 END)
        FROM recovery_audit_log
    """)
    row = cursor.fetchone()
    conn.close()

    total_events = row[0] or 0
    total_risk = row[1] or 0.0
    total_recovered = row[2] or 0.0
    stop_rules_tripped = row[3] or 0

    return {
        "total_events_processed": total_events,
        "total_revenue_at_risk": round(total_risk, 2),
        "total_revenue_recovered": round(total_recovered, 2),
        "recovery_rate_percent": round((total_recovered / total_risk * 100) if total_risk > 0 else 0, 1),
        "stop_rules_triggered_count": stop_rules_tripped
    }

if __name__ == "__main__":
    import uvicorn
    print("Starting RevRescue AI FastAPI Server on port 8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
