import time
from collections import defaultdict
from typing import Tuple, Dict, List

class AuthRateLimiter:
    """
    Sliding window in-memory rate limiter for authentication endpoints:
    - Cooldown period between OTP resends (preventing rapid spamming)
    - Hourly request caps per mobile number (preventing SMS budget exhaustion)
    - Login brute force protection (locking accounts with repeated failed passwords)
    """

    def __init__(self):
        # Maps phone_number -> list of timestamp floats
        self._otp_requests: Dict[str, List[float]] = defaultdict(list)
        # Maps identifier -> list of failed timestamp floats
        self._failed_logins: Dict[str, List[float]] = defaultdict(list)

    def check_otp_resend(
        self,
        phone_number: str,
        cooldown_seconds: int = 60,
        max_per_hour: int = 5
    ) -> Tuple[bool, int, str]:
        """
        Validates both the consecutive cooldown and hourly cap for an OTP request.
        Returns: (is_allowed: bool, retry_after_seconds: int, reason: str)
        """
        now = time.time()
        requests = self._otp_requests[phone_number]

        # 1. Purge requests older than 1 hour (3600 seconds)
        cutoff = now - 3600.0
        self._otp_requests[phone_number] = [t for t in requests if t > cutoff]
        requests = self._otp_requests[phone_number]

        # 2. Check consecutive cooldown (last request must be older than cooldown_seconds)
        if requests:
            last_request = requests[-1]
            elapsed = now - last_request
            if elapsed < cooldown_seconds:
                remaining = int(cooldown_seconds - elapsed) + 1
                return (
                    False,
                    remaining,
                    f"Please wait {remaining} seconds before requesting a new verification code."
                )

        # 3. Check hourly volume cap
        if len(requests) >= max_per_hour:
            oldest_relevant = requests[-max_per_hour]
            wait_time = int(3600 - (now - oldest_relevant)) + 1
            return (
                False,
                wait_time,
                f"Maximum OTP requests ({max_per_hour}/hour) exceeded for this mobile number. Try again later."
            )

        return (True, 0, "")

    def record_otp_request(self, phone_number: str):
        """Records an authorized OTP generation event."""
        self._otp_requests[phone_number].append(time.time())

    def check_login_lockout(
        self,
        identifier: str,
        max_failed_attempts: int = 5,
        lockout_seconds: int = 300
    ) -> Tuple[bool, int, str]:
        """
        Prevents credential stuffing & password brute-forcing.
        Locks out an account/IP after 5 consecutive failed attempts for 5 minutes.
        """
        now = time.time()
        failures = self._failed_logins[identifier]

        # Purge failures outside the lockout window
        cutoff = now - lockout_seconds
        self._failed_logins[identifier] = [t for t in failures if t > cutoff]
        failures = self._failed_logins[identifier]

        if len(failures) >= max_failed_attempts:
            oldest_in_window = failures[0]
            remaining = int(lockout_seconds - (now - oldest_in_window)) + 1
            return (
                False,
                remaining,
                f"Too many failed login attempts. Account temporarily locked for {remaining} seconds."
            )

        return (True, 0, "")

    def record_login_failure(self, identifier: str):
        """Logs a failed credential check."""
        self._failed_logins[identifier].append(time.time())

    def reset_login_failures(self, identifier: str):
        """Resets the failure counter upon successful authentication."""
        if identifier in self._failed_logins:
            del self._failed_logins[identifier]

    def clear(self):
        """Reset internal stores (primarily for unit test isolation)."""
        self._otp_requests.clear()
        self._failed_logins.clear()

auth_rate_limiter = AuthRateLimiter()
