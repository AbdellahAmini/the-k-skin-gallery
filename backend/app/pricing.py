"""Shared retail pricing rules for catalogue imports and admin edits."""


def round_up_to_10_dh(value):
    """Round a compare-at price upward to the next 10 DH, preserving blank values."""
    if value is None or value == "":
        return None
    amount = int(value)
    if amount <= 0:
        return amount
    return ((amount + 9) // 10) * 10
