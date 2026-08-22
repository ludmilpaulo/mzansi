from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class CheckoutResult:
    redirect_url: str | None
    provider_reference: str
    raw: dict


class PaymentProvider(ABC):
    code: str

    @abstractmethod
    def create_checkout(self, *, invoice, return_url: str, cancel_url: str) -> CheckoutResult:
        raise NotImplementedError

    @abstractmethod
    def verify_webhook(self, payload: dict, headers: dict) -> bool:
        raise NotImplementedError


class ManualPaymentProvider(PaymentProvider):
    code = "manual"

    def create_checkout(self, *, invoice, return_url: str, cancel_url: str) -> CheckoutResult:
        return CheckoutResult(
            redirect_url=None,
            provider_reference=f"manual-{invoice.number}",
            raw={"return_url": return_url, "cancel_url": cancel_url},
        )

    def verify_webhook(self, payload: dict, headers: dict) -> bool:
        return True


def get_provider(code: str | None = None) -> PaymentProvider:
    # Swap this registry when adding PayFast / Stripe / Peach without changing business logic.
    registry: dict[str, PaymentProvider] = {"manual": ManualPaymentProvider()}
    return registry.get(code or "manual", registry["manual"])
