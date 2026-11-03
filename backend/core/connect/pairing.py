"""
Pairing codes and device tokens: the pure rules (RFC 8628 style).

A surgeon presses "Send to headset"; the backend mints a one-time 6-digit code for that assignment. The
trainee types it on the headset's gateway card; the headset gets a bearer token back. Codes are short, so
the protections are the ones RFC 8628 asks for: expiry, single use, and throttling of wrong guesses.

Only hashes are stored. A code is guessable by anyone who can read the table, so it is also short-lived.
"""
from __future__ import annotations

import hashlib
import secrets
import time
from collections import defaultdict, deque
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Deque, Dict, Optional

CODE_LENGTH = 6
CODE_TTL = timedelta(minutes=10)
TOKEN_TTL = timedelta(days=30)
# Wrong guesses allowed per client in the window before it is told to wait.
MAX_FAILURES = 10
FAILURE_WINDOW_S = 600


def generate_code(length: int = CODE_LENGTH) -> str:
    """A uniformly random numeric code, leading zeros kept ("004217")."""
    return "".join(secrets.choice("0123456789") for _ in range(length))


def normalise_code(raw: str) -> Optional[str]:
    """What the trainee typed, reduced to digits; None if it cannot be a code."""
    digits = "".join(ch for ch in (raw or "") if ch.isdigit())
    return digits if len(digits) == CODE_LENGTH else None


def hash_code(code: str) -> str:
    return hashlib.sha256(("mediver-pair-v1:" + code).encode()).hexdigest()


def new_token() -> str:
    """An opaque bearer token. High entropy, so an unsalted SHA-256 of it is enough to store."""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


@dataclass(frozen=True)
class RedeemDecision:
    ok: bool
    status: int      # the HTTP status the headset is given
    reason: str      # shown on the gateway card


def decide_redeem(row: Optional[dict], now: datetime) -> RedeemDecision:
    """Whether a code can be redeemed, given the assignment its hash matched (None = no match).

    `row` needs: status, code_expires_at, code_consumed_at.
    404 unknown, 410 expired or already used, per the contract."""
    if row is None:
        return RedeemDecision(False, 404, "Code not recognised")
    if row.get("status") == "cancelled":
        return RedeemDecision(False, 410, "This assignment was cancelled, ask for a new code")
    if row.get("code_consumed_at") is not None:
        return RedeemDecision(False, 410, "Code already used, ask for a new one")
    expires = row.get("code_expires_at")
    if expires is None or expires <= now:
        return RedeemDecision(False, 410, "Code expired, ask for a new one")
    return RedeemDecision(True, 200, "")


class FailureThrottle:
    """Sliding-window limit on wrong guesses, per client key (address and device id).

    In memory, so it is per backend process: enough for one instance. A deployment with several instances
    needs a shared store (the design note lists it); the code space is small, so do not skip that."""

    def __init__(self, limit: int = MAX_FAILURES, window_s: int = FAILURE_WINDOW_S, clock=time.monotonic):
        self.limit, self.window_s, self.clock = limit, window_s, clock
        self._hits: Dict[str, Deque[float]] = defaultdict(deque)

    def _trim(self, key: str) -> Deque[float]:
        q = self._hits[key]
        cutoff = self.clock() - self.window_s
        while q and q[0] <= cutoff:
            q.popleft()
        return q

    def retry_after(self, key: str) -> int:
        """Seconds to wait, 0 if the client may try."""
        q = self._trim(key)
        if len(q) < self.limit:
            return 0
        return max(1, int(q[0] + self.window_s - self.clock()) + 1)

    def record_failure(self, key: str) -> None:
        self._trim(key).append(self.clock())

    def reset(self, key: str) -> None:
        self._hits.pop(key, None)
