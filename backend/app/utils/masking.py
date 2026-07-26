import re
from typing import Any, Union, List, Dict

def mask_string(s: str) -> str:
    """
    Masks a string: 'John Doe' -> 'J*** D**'
    Keep first char of each word, mask the rest.
    """
    if not s:
        return s

    words = s.split()
    masked_words = []
    for word in words:
        if len(word) <= 1:
            masked_words.append(word)
        else:
            masked_words.append(word[0] + '*' * (len(word) - 1))

    # The prompt specifically asked for 'J*** D**' style, which is a bit different
    # from just one asterisk per char. Let's stick to a consistent masking.
    # Let's use 3 asterisks for the rest of the word if it's long,
    # or just match the length? The prompt says 'John Doe' -> 'J*** D**'.
    # 'John' (4) -> 'J***' (1 + 3)
    # 'Doe' (3) -> 'D**' (1 + 2)
    # So it is 1 char + (len-1) asterisks.

    return " ".join(masked_words)

def mask_pii(data: Any, role: str, is_pii_field: bool = False) -> Any:
    """
    Recursively masks PII (name, address) if the user role is not authorized.
    Authorized roles: 'Supervisor', 'Admin'.
    """
    authorized_roles = {'Supervisor', 'Admin'}
    if role in authorized_roles:
        return data

    if isinstance(data, str):
        return mask_string(data) if is_pii_field else data

    elif isinstance(data, list):
        return [mask_pii(item, role, is_pii_field) for item in data]

    elif isinstance(data, dict):
        masked_dict = {}
        for key, value in data.items():
            is_pii = is_pii_field or (key.lower() in {'name', 'address', 'members'})
            masked_dict[key] = mask_pii(value, role, is_pii)
        return masked_dict

    return data
